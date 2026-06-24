import { useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { useToastStore, type ToastTone } from '../stores/toastStore';

const toastColors: Record<ToastTone, string> = {
  info: 'blue',
  success: 'green',
  error: 'red',
  warning: 'yellow',
};

export function ToastBridge() {
  const latestToast = useToastStore((state) => state.latestToast);
  const lastShownId = useRef<number | null>(null);

  useEffect(() => {
    if (!latestToast || lastShownId.current === latestToast.id) return;

    lastShownId.current = latestToast.id;
    notifications.show({
      title: latestToast.title,
      message: latestToast.message,
      color: toastColors[latestToast.tone],
      autoClose: latestToast.autoClose ?? 3500,
      withCloseButton: true,
    });
  }, [latestToast]);

  return null;
}
