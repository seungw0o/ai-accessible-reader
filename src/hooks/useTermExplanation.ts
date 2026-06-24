import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { postJson } from '../api';
import type { ArticleData, TermExplanation } from '../types';
import type { Translation } from '../i18n';
import type { ToastTone } from '../stores/toastStore';

const ignoredTermTokens = new Set([
  '기자',
  '뉴스',
  '본문',
  '사진',
  '제공',
  '무단',
  '전재',
  '재배포',
  '광고',
  '댓글',
  '공유',
  'article',
  'copyright',
  'news',
  'reporter',
  'email',
]);

function extractSuggestedTerms(text: string) {
  const candidates = text
    .replace(/[“”"'‘’()[\]{}<>]/g, ' ')
    .split(/[\s,.;:!?。！？·…/\\|]+/)
    .map((token) => token.trim())
    .filter((token) => {
      const normalized = token.toLowerCase();
      const isKoreanTerm = /^[가-힣A-Za-z0-9+-]+$/.test(token) && token.length >= 4 && token.length <= 18;
      const isEnglishTerm = /^[A-Za-z][A-Za-z0-9+-]{4,24}$/.test(token);
      return (isKoreanTerm || isEnglishTerm) && !ignoredTermTokens.has(normalized);
    });

  const frequency = new Map<string, number>();
  for (const term of candidates) {
    frequency.set(term, (frequency.get(term) || 0) + 1);
  }

  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, 8)
    .map(([term]) => term);
}

type UseTermExplanationParams = {
  articleData: ArticleData | null;
  copy: Translation;
  notify: (message: string, tone?: ToastTone) => void;
};

export function useTermExplanation({ articleData, copy, notify }: UseTermExplanationParams) {
  const [selectedWord, setSelectedWord] = useState('');
  const [termInput, setTermInput] = useState('');
  const [termExplanation, setTermExplanation] = useState<TermExplanation | null>(null);
  const suggestedTerms = useMemo(
    () => extractSuggestedTerms(articleData?.textContent || ''),
    [articleData?.textContent]
  );

  const explainMutation = useMutation({
    mutationFn: (word: string) =>
      postJson<TermExplanation, { word: string; context: string }>('/api/explain', {
        word,
        context: articleData?.textContent?.slice(0, 600) || '',
      }),
    onMutate: (word) => {
      setTermInput(word);
      setTermExplanation(null);
      notify(copy.announcements.explainStart(word), 'info');
    },
    onSuccess: (data, word) => {
      setTermExplanation(data);
      notify(copy.announcements.explainDone(word), 'success');
    },
    onError: (error, word) => {
      console.error(error);
      setTermExplanation({
        word,
        definition: copy.announcements.explainFallback,
        example: '',
      });
      notify(copy.announcements.explainFail, 'error');
    },
  });

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection) return;
    const text = selection.toString().trim();
    if (text && text.length > 1 && text.length < 20) {
      setSelectedWord(text);
      setTermInput(text);
    }
  };

  const handleExplainWord = (wordToExplain?: string) => {
    const targetWord = (wordToExplain || termInput || selectedWord).trim();
    if (!targetWord || explainMutation.isPending) return;
    explainMutation.mutate(targetWord);
  };

  return {
    selectedWord,
    termInput,
    setTermInput,
    suggestedTerms,
    termExplanation,
    termLoading: explainMutation.isPending,
    handleTextSelection,
    handleExplainWord,
  };
}
