'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Locale, Translations } from './types';
import { id } from './id';
import { en } from './en';

// ============================================================
// i18n Provider — Indonesian default, switchable to English
// ============================================================

const TRANSLATIONS: Record<Locale, Translations> = { id, en };
const STORAGE_KEY = 'taverna_locale';

interface I18nContextType {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  /** Interpolate {key} placeholders in a string */
  fmt: (template: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'id',
  t: id,
  setLocale: () => {},
  fmt: (s) => s,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('id');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && (stored === 'id' || stored === 'en')) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const fmt = useCallback((template: string, vars?: Record<string, string | number>) => {
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (_, key) =>
      vars[key] !== undefined ? String(vars[key]) : `{${key}}`
    );
  }, []);

  const value: I18nContextType = {
    locale,
    t: TRANSLATIONS[locale],
    setLocale,
    fmt,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

/** Hook to access translations */
export function useTranslation() {
  return useContext(I18nContext);
}

/** Get translation object without React context (for server or static) */
export function getTranslations(locale: Locale = 'id'): Translations {
  return TRANSLATIONS[locale];
}

export type { Locale, Translations };
