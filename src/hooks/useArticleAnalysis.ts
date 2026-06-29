import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { postJson } from '../api';
import type { ArticleData } from '../types';
import type { Translation } from '../i18n';
import type { ToastTone } from '../stores/toastStore';

type UseArticleAnalysisParams = {
  copy: Translation;
  notify: (message: string, tone?: ToastTone) => void;
  onComplete: () => void;
};

export function useArticleAnalysis({ copy, notify, onComplete }: UseArticleAnalysisParams) {
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [progress, setProgress] = useState(0);
  const progressTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearProgressTimer = () => {
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  useEffect(
    () => () => {
      clearProgressTimer();
      abortControllerRef.current?.abort();
    },
    []
  );

  const extractMutation = useMutation({
    mutationFn: (targetUrl: string) =>
      postJson<ArticleData, { url: string }>('/api/extract', { url: targetUrl }, {
        signal: abortControllerRef.current?.signal,
      }),
    onMutate: () => {
      clearProgressTimer();
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      setProgress(8);
      setArticleData(null);
      notify(copy.announcements.extractStart, 'info');
      progressTimerRef.current = window.setInterval(() => {
        setProgress((current) => {
          if (current >= 92) return current;
          const increment = current < 35 ? 4 : current < 70 ? 2 : 0.8;
          return Math.min(92, Number((current + increment).toFixed(1)));
        });
      }, 260);
    },
    onSuccess: (data) => {
      clearProgressTimer();
      abortControllerRef.current = null;
      setArticleData(data);
      setProgress(100);
      const category = data.category || '기타';
      notify(
        copy.announcements.extractSuccess(
          copy.categories[category as keyof typeof copy.categories] || category
        ),
        'success'
      );
      window.setTimeout(() => {
        onComplete();
        setProgress(0);
      }, 500);
    },
    onError: (error) => {
      clearProgressTimer();
      abortControllerRef.current = null;
      setProgress(0);

      if (error instanceof DOMException && error.name === 'AbortError') {
        notify(copy.announcements.extractCanceled, 'info');
        return;
      }

      console.error(error);
      notify(copy.announcements.extractFail, 'error');
    },
  });

  const handleExtract = (url: string) => {
    if (!url.trim() || extractMutation.isPending) return;
    extractMutation.mutate(url);
  };

  const handleCancelExtract = () => {
    if (!extractMutation.isPending) return;
    abortControllerRef.current?.abort();
  };

  return {
    articleData,
    setArticleData,
    loading: extractMutation.isPending,
    progress,
    handleExtract,
    handleCancelExtract,
  };
}
