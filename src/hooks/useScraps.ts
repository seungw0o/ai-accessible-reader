import { useState } from 'react';
import type { ArticleData } from '../types';
import type { Translation, Language } from '../i18n';
import type { ToastTone } from '../stores/toastStore';

type UseScrapsParams = {
  articleData: ArticleData | null;
  url: string;
  language: Language;
  copy: Translation;
  notify: (message: string, tone?: ToastTone) => void;
  onReadScrap: (scrap: ArticleData) => void;
};

export function useScraps({ articleData, url, language, copy, notify, onReadScrap }: UseScrapsParams) {
  const [scraps, setScraps] = useState<ArticleData[]>(() => {
    try {
      const saved = localStorage.getItem('article-scraps');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error(error);
      return [];
    }
  });

  const currentArticleUrl = articleData?.url || url;
  const isCurrentScrapped = scraps.some((scrap) => scrap.url === currentArticleUrl);

  const saveScraps = (updatedScraps: ArticleData[]) => {
    setScraps(updatedScraps);
    localStorage.setItem('article-scraps', JSON.stringify(updatedScraps));
  };

  const handleToggleScrap = () => {
    if (!articleData) return;

    if (isCurrentScrapped) {
      saveScraps(scraps.filter((scrap) => scrap.url !== currentArticleUrl));
      notify(copy.announcements.scrapRemoved, 'success');
      return;
    }

    const category = articleData.category || '기타';
    const newScrap: ArticleData = {
      ...articleData,
      url: currentArticleUrl,
      date: new Date().toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
      category,
    };

    saveScraps([newScrap, ...scraps]);
    notify(
      copy.announcements.scrapAdded(copy.categories[category as keyof typeof copy.categories] || category),
      'success'
    );
  };

  const handleDeleteScrap = (scrapUrl: string) => {
    saveScraps(scraps.filter((scrap) => scrap.url !== scrapUrl));
    notify(copy.announcements.scrapDeleted, 'success');
  };

  const handleReadScrap = (scrap: ArticleData) => {
    onReadScrap(scrap);
    notify(copy.announcements.scrapLoaded, 'info');
  };

  return {
    scraps,
    isCurrentScrapped,
    handleToggleScrap,
    handleDeleteScrap,
    handleReadScrap,
  };
}
