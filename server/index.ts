import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import { fileURLToPath } from 'node:url';
import { TextDecoder } from 'node:util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const port = Number(process.env.PORT) || 3001;
const clientDistPath = path.resolve(__dirname, '../dist');
const minArticleTextLength = 80;
const requestHeaders = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
};

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
const anthropicModel = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
const anthropicExplainModel = process.env.ANTHROPIC_EXPLAIN_MODEL || 'claude-haiku-4-5-20251001';

type ExtractedArticle = {
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  siteName: string;
};

type ArticleHtmlResult = {
  html: string;
  url: string;
};

function normalizeArticleUrl(rawUrl: unknown) {
  if (typeof rawUrl !== 'string') {
    throw new Error('URL must be a string');
  }

  const trimmedUrl = rawUrl.trim();
  if (!trimmedUrl) {
    throw new Error('URL is empty');
  }

  const urlWithProtocol = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
  const parsedUrl = new URL(urlWithProtocol);

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are supported');
  }

  parsedUrl.hash = '';
  return parsedUrl.toString();
}

async function fetchArticleHtml(url: string) {
  const response = await axios.get<ArrayBuffer>(url, {
    headers: requestHeaders,
    responseType: 'arraybuffer',
    timeout: 15000,
    maxRedirects: 5,
    maxContentLength: 10 * 1024 * 1024,
    validateStatus: (status) => status >= 200 && status < 400,
  });

  const contentType = String(response.headers['content-type'] || '');
  const html = decodeHtml(Buffer.from(response.data), contentType);

  if (!/<html|<article|<body/i.test(html)) {
    throw new Error('Fetched content is not an HTML article page');
  }

  return html;
}

async function fetchResolvedArticleHtml(url: string): Promise<ArticleHtmlResult> {
  const html = await fetchArticleHtml(url);
  const embeddedArticleUrl = findEmbeddedArticleUrl(html, url);

  if (!embeddedArticleUrl || embeddedArticleUrl === url) {
    return { html, url };
  }

  try {
    return {
      html: await fetchArticleHtml(embeddedArticleUrl),
      url: embeddedArticleUrl,
    };
  } catch (error) {
    console.warn('Embedded article fetch failed. Falling back to original URL:', embeddedArticleUrl, error);
    return { html, url };
  }
}

function findEmbeddedArticleUrl(html: string, baseUrl: string) {
  const parsedBaseUrl = new URL(baseUrl);
  const dom = new JSDOM(html, { url: baseUrl });
  const { document } = dom.window;

  if (isNaverBlogHost(parsedBaseUrl.hostname)) {
    const mainFrame = document.querySelector<HTMLIFrameElement>('iframe#mainFrame, iframe[name="mainFrame"]');
    const mainFrameSrc = mainFrame?.getAttribute('src');
    if (mainFrameSrc) {
      return new URL(mainFrameSrc, baseUrl).toString();
    }

    const mobileUrl = getNaverMobileBlogUrl(parsedBaseUrl);
    if (mobileUrl) return mobileUrl;
  }

  const refreshUrl = getMetaRefreshUrl(document, baseUrl);
  if (refreshUrl && isLikelyArticlePageUrl(refreshUrl)) {
    return refreshUrl;
  }

  const likelyFrame = Array.from(document.querySelectorAll<HTMLIFrameElement>('iframe[src]'))
    .map((iframe) => iframe.getAttribute('src'))
    .filter((src): src is string => !!src)
    .map((src) => new URL(src, baseUrl).toString())
    .find((src) => isLikelyArticleFrameUrl(src, parsedBaseUrl.hostname));

  return likelyFrame || null;
}

function isNaverBlogHost(hostname: string) {
  return hostname === 'blog.naver.com' || hostname === 'm.blog.naver.com';
}

function getNaverMobileBlogUrl(url: URL) {
  if (url.hostname !== 'blog.naver.com') return null;

  const [blogId, logNo] = url.pathname.split('/').filter(Boolean);
  if (blogId && logNo && /^\d+$/.test(logNo)) {
    return `https://m.blog.naver.com/${blogId}/${logNo}`;
  }

  return null;
}

function getMetaRefreshUrl(document: Document, baseUrl: string) {
  const refreshContent = document.querySelector('meta[http-equiv="refresh" i]')?.getAttribute('content') || '';
  const urlMatch = refreshContent.match(/url\s*=\s*([^;]+)/i);
  if (!urlMatch?.[1]) return null;

  try {
    return new URL(urlMatch[1].trim().replace(/^['"]|['"]$/g, ''), baseUrl).toString();
  } catch {
    return null;
  }
}

function isLikelyArticleFrameUrl(url: string, baseHostname: string) {
  try {
    const parsedUrl = new URL(url);
    if (/(youtube|vimeo|instagram|facebook|twitter|x\.com|ads|doubleclick)/i.test(parsedUrl.hostname)) {
      return false;
    }

    const sameSite = parsedUrl.hostname === baseHostname || parsedUrl.hostname.endsWith(`.${baseHostname}`);
    return sameSite && isLikelyArticlePageUrl(url);
  } catch {
    return false;
  }
}

function isLikelyArticlePageUrl(url: string) {
  return /post|article|blog|entry|view|content|read|logNo|PostView|PostList/i.test(url);
}

function decodeHtml(buffer: Buffer, contentType: string) {
  const head = buffer.subarray(0, 4096).toString('latin1');
  const charset =
    contentType.match(/charset=([^;\s]+)/i)?.[1] ||
    head.match(/<meta[^>]+charset=["']?([^"'\s/>]+)/i)?.[1] ||
    head.match(/<meta[^>]+content=["'][^"']*charset=([^"'\s;]+)/i)?.[1] ||
    'utf-8';

  try {
    return new TextDecoder(normalizeCharset(charset)).decode(buffer);
  } catch {
    return new TextDecoder('utf-8').decode(buffer);
  }
}

function normalizeCharset(charset: string) {
  const normalized = charset.trim().toLowerCase();
  if (['ks_c_5601-1987', 'ks_c_5601-1989', 'x-windows-949', 'windows-949', 'cp949'].includes(normalized)) {
    return 'euc-kr';
  }

  return normalized;
}

function chooseArticle(
  readabilityArticle: ReturnType<Readability['parse']>,
  fallbackArticle: ExtractedArticle
): ExtractedArticle | null {
  const readableText = readabilityArticle?.textContent?.trim() || '';
  const fallbackText = fallbackArticle.textContent.trim();
  const readableScore = scoreExtractedText(readableText);
  const fallbackScore = scoreExtractedText(fallbackText);

  if (fallbackText.length >= minArticleTextLength && fallbackScore > readableScore * 0.9) {
    return fallbackArticle;
  }

  if (readableText.length >= minArticleTextLength && readableText.length >= fallbackText.length * 0.6) {
    return {
      title: readabilityArticle?.title || fallbackArticle.title,
      content: readabilityArticle?.content || fallbackArticle.content,
      textContent: readableText,
      excerpt: readabilityArticle?.excerpt || fallbackArticle.excerpt,
      siteName: readabilityArticle?.siteName || fallbackArticle.siteName,
    };
  }

  return fallbackText.length >= minArticleTextLength ? fallbackArticle : null;
}

function scoreExtractedText(text: string) {
  const boilerplatePenalty = (text.match(/광고|댓글|공유|제보|무단 전재|재배포|Copyright|브라우저가 .*지원하지 않습니다/g) || [])
    .length * 120;
  const sentenceCount = splitSentences(text).length;

  return text.length + sentenceCount * 30 - boilerplatePenalty;
}

function extractFallbackArticle(dom: JSDOM, url: string): ExtractedArticle {
  const { document } = dom.window;
  removeNonArticleNodes(document);

  const urlHost = new URL(url).hostname;
  const jsonLdArticle = extractJsonLdArticle(document);
  const bestContainer = findBestArticleContainer(document);
  const containerText = bestContainer ? collectParagraphText(bestContainer) : '';
  const fallbackText = collectParagraphText(document.body);
  const textContent = cleanText(jsonLdArticle.body || containerText || fallbackText);
  const paragraphs = collectArticleParagraphs(bestContainer || document.body, textContent);

  return {
    title:
      cleanText(
        jsonLdArticle.title ||
          getMeta(document, 'property', 'og:title') ||
          getMeta(document, 'name', 'twitter:title') ||
          document.querySelector('h1')?.textContent ||
          document.title
      ) || '제목 없음',
    content: paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join(''),
    textContent,
    excerpt:
      cleanText(
        getMeta(document, 'name', 'description') ||
          getMeta(document, 'property', 'og:description') ||
          textContent.slice(0, 180)
      ),
    siteName: cleanText(getMeta(document, 'property', 'og:site_name')) || urlHost,
  };
}

function removeNonArticleNodes(document: Document) {
  document
    .querySelectorAll(
      [
        'script',
        'style',
        'noscript',
        'iframe',
        'svg',
        'canvas',
        'form',
        'button',
        'input',
        'select',
        'textarea',
        'nav',
        'header',
        'footer',
        'aside',
        '[role="navigation"]',
        '[aria-hidden="true"]',
        '.advertisement',
        '.ad',
        '.ads',
        '.banner',
        '.comment',
        '.comments',
        '.reply',
        '.related',
        '.share',
        '.sns',
        '.subscribe',
      ].join(',')
    )
    .forEach((node) => node.remove());
}

function extractJsonLdArticle(document: Document) {
  const result = { title: '', body: '' };

  for (const script of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
    const rawJson = script.textContent?.trim();
    if (!rawJson) continue;

    try {
      const parsed = JSON.parse(rawJson);
      const article = findJsonLdArticleNode(parsed);
      if (!article) continue;

      result.title = cleanText(readJsonLdString(article.headline) || readJsonLdString(article.name) || result.title);
      result.body = cleanText(readJsonLdString(article.articleBody) || readJsonLdString(article.description) || result.body);

      if (result.body) break;
    } catch {
      continue;
    }
  }

  return result;
}

function findJsonLdArticleNode(value: any): any | null {
  if (!value || typeof value !== 'object') return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJsonLdArticleNode(item);
      if (found) return found;
    }
    return null;
  }

  const type = Array.isArray(value['@type']) ? value['@type'].join(' ') : value['@type'];
  if (typeof type === 'string' && /Article|NewsArticle|BlogPosting/i.test(type)) {
    return value;
  }

  return findJsonLdArticleNode(value['@graph']);
}

function readJsonLdString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function findBestArticleContainer(document: Document) {
  const selectors = [
    'article',
    '#postViewArea',
    '#printPost1',
    '.se-main-container',
    '.se-viewer',
    '.se_component_wrap',
    '.post-view',
    '.post_ct',
    '.post_content',
    '.tt_article_useless_p_margin',
    '.contents_style',
    '#article-view',
    '.article_view',
    '.entry-content',
    '.markdown-body',
    '.velog-post-body',
    '[class*="post-content" i]',
    '[class*="post_view" i]',
    '[class*="blog-post" i]',
    '[itemprop="articleBody"]',
    '[property="articleBody"]',
    '[class*="article" i]',
    '[id*="article" i]',
    '[class*="news" i]',
    '[id*="news" i]',
    '[class*="content" i]',
    '[id*="content" i]',
    '[class*="body" i]',
    '[id*="body" i]',
  ];
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(selectors.join(',')));

  return candidates
    .map((element) => ({ element, score: scoreArticleCandidate(element) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)[0]?.element || null;
}

function scoreArticleCandidate(element: Element) {
  const textBlocks = collectTextBlocks(element, 30);
  const textLength = textBlocks.join('\n').length || cleanText(element.textContent || '').length;
  const linkTextLength = Array.from(element.querySelectorAll('a'))
    .map((link) => cleanText(link.textContent || ''))
    .join('').length;
  const mediaBonus = element.querySelectorAll('figure,img,video').length * 20;

  return textLength - linkTextLength * 1.5 + textBlocks.length * 25 + mediaBonus;
}

function collectParagraphText(root: Element | null) {
  if (!root) return '';

  const uniqueParagraphs = collectTextBlocks(root, 40);

  return uniqueParagraphs.join('\n\n');
}

function collectArticleParagraphs(root: Element | null, fallbackText: string) {
  const uniqueParagraphs = root ? collectTextBlocks(root, 25) : [];

  if (uniqueParagraphs.join('').length >= minArticleTextLength) {
    return uniqueParagraphs;
  }

  return fallbackText
    .split(/\n{2,}|(?<=[.!?。！？])\s+/)
    .map(cleanText)
    .filter((text) => text.length >= 20);
}

function collectTextBlocks(root: Element, minLength: number) {
  const blockSelectors = [
    'p',
    'li',
    'blockquote',
    'h1',
    'h2',
    'h3',
    '[class*="se-text" i]',
    '[class*="se-title" i]',
    '[class*="se-module-text" i]',
    '[class*="paragraph" i]',
    '[class*="content" i] p',
    '[class*="article" i] p',
    '[class*="entry" i] p',
  ];
  const blocks = Array.from(root.querySelectorAll(blockSelectors.join(',')))
    .map((element) => cleanText(element.textContent || ''))
    .filter((text) => text.length >= minLength && !isLikelyBoilerplate(text));
  const uniqueBlocks = [...new Set(blocks)];

  return uniqueBlocks.filter((text, index, texts) => {
    const isDuplicatedByShorterBlock = texts.some(
      (otherText, otherIndex) =>
        otherIndex !== index &&
        text.length > otherText.length + 80 &&
        text.includes(otherText)
    );
    return !isDuplicatedByShorterBlock;
  });
}

function isLikelyBoilerplate(text: string) {
  return /구독|광고|댓글|공유|무단전재|재배포|저작권|Copyright|All rights reserved|로그인|회원가입|뉴스레터|제보/i.test(text);
}

function getMeta(document: Document, attribute: 'name' | 'property', value: string) {
  return document.querySelector(`meta[${attribute}="${value}"]`)?.getAttribute('content') || '';
}

function cleanText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function analyzeArticleLocally(text: string) {
  return {
    summary: summarizeLocally(text),
    category: categorizeLocally(text),
  };
}

function summarizeLocally(text: string) {
  const sentences = splitSentences(text)
    .filter((sentence) => sentence.length >= 20 && !isLikelyBoilerplate(sentence))
    .slice(0, 3);

  if (sentences.length > 0) {
    return sentences.join(' ');
  }

  return cleanText(text).slice(0, 240) || '본문은 추출했지만 요약할 문장을 찾지 못했습니다.';
}

function splitSentences(text: string) {
  return cleanText(text)
    .replace(/([.!?。！？])(?=[가-힣A-Z0-9])/g, '$1 ')
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map(cleanText)
    .filter(Boolean);
}

function categorizeLocally(text: string) {
  const normalized = text.toLowerCase();
  const categories = [
    { category: '정치', keywords: ['대통령', '국회', '정부', '민주당', '국민의힘', '선거', '정치', '청와대', '외교', '장관'] },
    { category: '경제', keywords: ['경제', '금리', '증시', '주가', '환율', '물가', '기업', '투자', '부동산', '은행'] },
    { category: '사회', keywords: ['경찰', '검찰', '법원', '사건', '사고', '화재', '교육', '노동', '시민', '지역'] },
    { category: 'IT/기술', keywords: ['ai', '인공지능', '반도체', '스마트폰', '플랫폼', '소프트웨어', '기술', '로봇', '데이터'] },
    { category: '생활/건강', keywords: ['건강', '의료', '병원', '질병', '날씨', '생활', '식품', '여행', '육아'] },
    { category: '문화/예술', keywords: ['영화', '음악', '방송', '드라마', '공연', '전시', '문화', '예술', '배우', '가수'] },
  ];

  const bestCategory = categories
    .map(({ category, keywords }) => ({
      category,
      score: keywords.reduce((score, keyword) => score + (normalized.includes(keyword.toLowerCase()) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score)[0];

  return bestCategory && bestCategory.score > 0 ? bestCategory.category : '기타';
}

app.use(cors());
app.use(express.json());

app.post('/api/extract', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const normalizedUrl = normalizeArticleUrl(url);
    const resolvedArticleHtml = await fetchResolvedArticleHtml(normalizedUrl);
    const html = resolvedArticleHtml.html;
    const articleUrl = resolvedArticleHtml.url;
    const dom = new JSDOM(html, { url: articleUrl });
    const readableDoc = dom.window.document.cloneNode(true) as typeof dom.window.document;
    const readableArticle = new Readability(readableDoc).parse();
    const fallbackArticle = extractFallbackArticle(dom, articleUrl);
    const article = chooseArticle(readableArticle, fallbackArticle);

    if (!article || article.textContent.trim().length < minArticleTextLength) {
      return res.status(500).json({ error: 'Failed to extract content' });
    }

    const articleTitle = article.title || '제목 없음';
    const articleContent = article.content || '';
    const articleTextContent = article.textContent || '';
    const articleExcerpt = article.excerpt || '';
    const articleSiteName = article.siteName || new URL(articleUrl).hostname;

    const localAnalysis = analyzeArticleLocally(articleTextContent);
    let summary = localAnalysis.summary;
    let category = localAnalysis.category;

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const msg = await anthropic.messages.create({
          model: anthropicModel,
          max_tokens: 1024,
          messages: [{
            role: "user",
            content: `다음 웹페이지 본문을 분석하여 요약 및 카테고리 분류를 수행해줘.
1. 본문 내용을 핵심 위주로 딱 3문장으로 요약해줘.
2. 아래 카테고리 목록 중 가장 적절한 하나를 골라줘:
["정치", "경제", "사회", "IT/기술", "생활/건강", "문화/예술", "기타"]

반드시 아래 JSON 형식으로만 답변하고 다른 마크다운 백틱이나 여담은 일절 쓰지 마:
{
  "summary": "3문장 요약 내용",
  "category": "선택한 카테고리"
}

본문:
${articleTextContent.slice(0, 10000)}`
          }],
        });

        const responseText = msg.content
          .filter(block => block.type === 'text')
          .map(block => (block as any).text)
          .join('') || '{}';

        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
          const result = JSON.parse(cleanedText);
          summary = result.summary || '';
          category = result.category || '기타';
        } catch (jsonError) {
          console.error('JSON parsing error for summary/category:', jsonError);
          const sumMatch = cleanedText.match(/"summary"\s*:\s*"([^"]+)"/);
          const catMatch = cleanedText.match(/"category"\s*:\s*"([^"]+)"/);
          summary = sumMatch?.[1] ?? cleanedText;
          category = catMatch?.[1] ?? '기타';
        }
      } catch (aiError) {
        console.error('Claude Summary/Category error:', aiError);
      }
    } else {
      console.info('ANTHROPIC_API_KEY is not set. Using local article analysis.');
    }

    res.json({
      title: articleTitle,
      content: articleContent,
      textContent: articleTextContent,
      excerpt: articleExcerpt,
      siteName: articleSiteName,
      summary: summary,
      category: category,
      url: articleUrl,
    });
  } catch (error: any) {
    console.error('Extraction error:', error.message);
    res.status(500).json({ error: 'Failed to fetch the URL or parse content' });
  }
});

app.post('/api/explain', async (req, res) => {
  const { word, context } = req.body;
  const cleanWord = cleanText(String(word || '')).slice(0, 60);
  const cleanContext = cleanText(String(context || '')).slice(0, 600);

  if (!cleanWord) {
    return res.status(400).json({ error: 'Word is required' });
  }

  try {
    let definition = '';
    let example = '';

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const msg = await anthropic.messages.create({
          model: anthropicExplainModel,
          max_tokens: 256,
          messages: [{ 
            role: "user", 
            content: `시각장애인이나 난독증 사용자를 위해 아래 용어를 쉬운 한국어로 설명해줘.
조건:
- 초등학생도 이해할 수 있게 1~2문장으로 설명
- 예시 문장은 짧게 1개
- 문맥이 있으면 그 의미를 우선
- JSON만 출력

단어: "${cleanWord}"
문맥: "${cleanContext}"

반드시 아래 JSON 형식으로만 답변하고 다른 인사말이나 마크다운 백틱 등 여담은 절대 쓰지 마:
{
  "definition": "쉬운 설명",
  "example": "쉬운 예시 문장"
}` 
          }],
        });

        const responseText = msg.content
          .filter(block => block.type === 'text')
          .map(block => (block as any).text)
          .join('') || '{}';

        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
          const result = JSON.parse(cleanedText);
          definition = result.definition || '설명을 불러올 수 없습니다.';
          example = result.example || '예시를 불러올 수 없습니다.';
        } catch (jsonError) {
          console.error('JSON parsing error from Claude:', jsonError, 'CleanedText:', cleanedText);
          const defMatch = cleanedText.match(/"definition"\s*:\s*"([^"]+)"/);
          const exMatch = cleanedText.match(/"example"\s*:\s*"([^"]+)"/);
          definition = defMatch?.[1] ?? '쉬운 설명을 파싱하지 못했습니다.';
          example = exMatch?.[1] ?? '예시 문장을 파싱하지 못했습니다.';
        }
      } catch (aiError: any) {
        console.error('Claude API call error:', aiError);
        definition = 'AI 설명 조회 중 오류가 발생했습니다.';
        example = '예시 문장을 불러올 수 없습니다.';
      }
    } else {
      definition = 'Claude API 키가 제공되지 않아 단어 설명을 생성할 수 없습니다.';
      example = '예시 문장이 없습니다.';
    }

    res.json({
      word: cleanWord,
      definition,
      example
    });
  } catch (error: any) {
    console.error('Explain error:', error.message);
    res.status(500).json({ error: 'Failed to explain the word' });
  }
});

app.use(express.static(clientDistPath));

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
