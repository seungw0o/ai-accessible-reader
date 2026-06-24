import { useEffect, useRef, useState } from 'react';
import type { ArticleData } from '../types';
import type { Language, Translation } from '../i18n';

type UseSpeechReaderParams = {
  articleData: ArticleData | null;
  language: Language;
  copy: Translation;
  announce: (message: string) => void;
};

export function useSpeechReader({ articleData, language, copy, announce }: UseSpeechReaderParams) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [speechVolume, setSpeechVolume] = useState(1);
  const [readTarget, setReadTarget] = useState<'summary' | 'article'>('summary');
  const speechCharIndexRef = useRef(0);
  const utteranceIdRef = useRef(0);
  const speechRestartTimerRef = useRef<number | null>(null);
  const speechLang = language === 'en' ? 'en-US' : 'ko-KR';

  const isSpeechSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window;

  useEffect(() => {
    return () => {
      if (speechRestartTimerRef.current !== null) {
        window.clearTimeout(speechRestartTimerRef.current);
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const getReadableSpeechText = () => {
    if (!articleData) return '';
    if (readTarget === 'summary') {
      const summaryText = articleData.summary?.trim();
      return summaryText || articleData.textContent;
    }
    return articleData.textContent;
  };

  const findNearestSpeechBoundary = (text: string, index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, Math.max(text.length - 1, 0)));
    const nextBreak = text.slice(clampedIndex).search(/[\s.!?。！？,，]/);
    if (nextBreak >= 0 && nextBreak < 40) {
      return clampedIndex + nextBreak + 1;
    }
    return clampedIndex;
  };

  const speakUtterance = (utterance: SpeechSynthesisUtterance, utteranceId: number) => {
    if (!isSpeechSupported) return;
    const voices = window.speechSynthesis.getVoices();

    if (voices.length === 0) {
      const handleVoicesChanged = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        if (utteranceIdRef.current === utteranceId) {
          window.speechSynthesis.speak(utterance);
        }
      };

      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged, { once: true });
      window.setTimeout(() => {
        if (utteranceIdRef.current === utteranceId) {
          window.speechSynthesis.speak(utterance);
        }
      }, 120);
      return;
    }

    window.speechSynthesis.speak(utterance);
  };

  const startSpeechAt = (
    startIndex = 0,
    options?: { rate?: number; volume?: number; silent?: boolean }
  ) => {
    if (!articleData || !isSpeechSupported) return;

    const fullText = getReadableSpeechText();
    if (!fullText.trim()) return;
    const safeStartIndex = findNearestSpeechBoundary(fullText, startIndex);
    const textToRead = fullText.slice(safeStartIndex);
    const utteranceId = utteranceIdRef.current + 1;
    utteranceIdRef.current = utteranceId;
    speechCharIndexRef.current = safeStartIndex;

    if (speechRestartTimerRef.current !== null) {
      window.clearTimeout(speechRestartTimerRef.current);
      speechRestartTimerRef.current = null;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToRead);
    const availableVoices = window.speechSynthesis.getVoices();
    const preferredVoice =
      availableVoices.find((voice) => voice.lang === speechLang) ||
      availableVoices.find((voice) => voice.lang.startsWith(speechLang.slice(0, 2)));

    utterance.rate = options?.rate ?? speechRate;
    utterance.volume = options?.volume ?? speechVolume;
    if (preferredVoice) {
      utterance.lang = preferredVoice.lang;
      utterance.voice = preferredVoice;
    }
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      if (!options?.silent) {
        announce(copy.announcements.speakStart);
      }
    };
    utterance.onboundary = (event) => {
      if (typeof event.charIndex === 'number') {
        speechCharIndexRef.current = safeStartIndex + event.charIndex;
      }
    };
    utterance.onend = () => {
      if (utteranceIdRef.current === utteranceId) {
        setIsPlaying(false);
        setIsPaused(false);
        speechCharIndexRef.current = 0;
      }
    };
    utterance.onerror = () => {
      if (utteranceIdRef.current === utteranceId) {
        setIsPlaying(false);
        setIsPaused(false);
      }
    };

    speechRestartTimerRef.current = window.setTimeout(() => {
      if (utteranceIdRef.current === utteranceId) {
        speakUtterance(utterance, utteranceId);
      }
      speechRestartTimerRef.current = null;
    }, 80);
  };

  const handleSpeak = () => {
    if (!articleData || !isSpeechSupported) return;

    if (isPaused) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
        setIsPlaying(true);
        announce(copy.announcements.speakStart);
      } else {
        startSpeechAt(speechCharIndexRef.current);
      }
      return;
    }

    startSpeechAt(0);
  };

  const handleReplay = () => {
    startSpeechAt(0);
  };

  const handleSkipSpeech = (seconds: number) => {
    if (!articleData || !isSpeechSupported) return;
    const fullText = getReadableSpeechText();
    const estimatedChars = Math.round(seconds * 16 * speechRate);
    const nextIndex = Math.max(0, Math.min(speechCharIndexRef.current + estimatedChars, fullText.length - 1));
    startSpeechAt(nextIndex, { silent: true });
  };

  const handleSpeechRateCommit = (rate: number) => {
    setSpeechRate(rate);
    if (isPlaying) {
      startSpeechAt(speechCharIndexRef.current, { rate, volume: speechVolume, silent: true });
    } else if (isPaused) {
      utteranceIdRef.current += 1;
      window.speechSynthesis.cancel();
    }
  };

  const handleSpeechVolumeCommit = (volume: number) => {
    setSpeechVolume(volume);
    if (isPlaying) {
      startSpeechAt(speechCharIndexRef.current, { rate: speechRate, volume, silent: true });
    } else if (isPaused) {
      utteranceIdRef.current += 1;
      window.speechSynthesis.cancel();
    }
  };

  const handlePause = () => {
    if (!isPlaying || !isSpeechSupported) return;
    window.speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
    announce(copy.announcements.speakPause);
  };

  const handleStop = (silent = false) => {
    if (!isSpeechSupported) return;
    utteranceIdRef.current += 1;
    if (speechRestartTimerRef.current !== null) {
      window.clearTimeout(speechRestartTimerRef.current);
      speechRestartTimerRef.current = null;
    }
    window.speechSynthesis.cancel();
    speechCharIndexRef.current = 0;
    setIsPlaying(false);
    setIsPaused(false);
    if (!silent) {
      announce(copy.announcements.speakStop);
    }
  };

  return {
    isPlaying,
    isPaused,
    speechSupported: isSpeechSupported,
    speechRate,
    setSpeechRate,
    speechVolume,
    setSpeechVolume,
    readTarget,
    setReadTarget,
    handleSpeak,
    handleReplay,
    handleSkipSpeech,
    handleSpeechRateCommit,
    handleSpeechVolumeCommit,
    handlePause,
    handleStop,
  };
}
