import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'error' | 'warning';

export type ToastMessage = {
  id: number;
  tone: ToastTone;
  message: string;
  title?: string;
  autoClose?: number;
};

type ToastInput = Omit<ToastMessage, 'id'>;

type ToastState = {
  latestToast: ToastMessage | null;
  showToast: (toast: ToastInput) => void;
  clearToast: () => void;
};

let toastId = 0;

export const useToastStore = create<ToastState>((set) => ({
  latestToast: null,
  showToast: (toast) => {
    toastId += 1;
    set({
      latestToast: {
        id: toastId,
        ...toast,
      },
    });
  },
  clearToast: () => set({ latestToast: null }),
}));
