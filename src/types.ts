export type ArticleData = {
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  siteName: string;
  summary: string;
  category?: string;
  url?: string;
  date?: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type TermExplanation = {
  word: string;
  definition: string;
  example: string;
};

export type AccessibilitySettings = {
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  highContrast: boolean;
  reduceMotion: boolean;
  autoSave: boolean;
};
