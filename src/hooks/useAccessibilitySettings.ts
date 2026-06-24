import { useEffect, useState } from 'react';
import type { AccessibilitySettings } from '../types';

const defaultSettings: AccessibilitySettings = {
  fontSize: 20,
  letterSpacing: 0.04,
  lineHeight: 1.8,
  highContrast: false,
  reduceMotion: false,
  autoSave: true,
};

export function useAccessibilitySettings() {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem('accessibility-settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage', error);
    }
    return defaultSettings;
  });

  useEffect(() => {
    document.body.classList.toggle('high-contrast', settings.highContrast);
  }, [settings.highContrast]);

  useEffect(() => {
    document.body.classList.toggle('reduce-motion', settings.reduceMotion);
  }, [settings.reduceMotion]);

  const handleChangeSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      if (next.autoSave) {
        try {
          localStorage.setItem('accessibility-settings', JSON.stringify(next));
        } catch (error) {
          console.error('Failed to save settings to localStorage', error);
        }
      }
      return next;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    try {
      localStorage.setItem('accessibility-settings', JSON.stringify(defaultSettings));
    } catch (error) {
      console.error('Failed to reset settings in localStorage', error);
    }
  };

  return {
    settings,
    handleChangeSetting,
    resetSettings,
  };
}
