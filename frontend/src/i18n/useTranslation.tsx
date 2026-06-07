import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import pt from './pt.json';
import en from './en.json';

type Lang = 'pt' | 'en';
type Translations = typeof pt;

const dictionaries: Record<Lang, Translations> = { pt, en };

// resolve caminho dot-notation: "checkout.errors.not_found"
function resolve(obj: unknown, path: string): string {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj) as string ?? path;
}

// substitui {{token}} por valores do params
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (str, [k, v]) => str.replaceAll(`{{${k}}}`, String(v)),
    template
  );
}

interface I18nContextValue {
  lang: Lang;
  t: (key: string, params?: Record<string, string | number>) => string;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('lang');
    return (saved === 'en' || saved === 'pt') ? saved : 'pt';
  });

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      interpolate(resolve(dictionaries[lang], key), params),
    [lang]
  );

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'pt' ? 'en' : 'pt';
      localStorage.setItem('lang', next);
      return next;
    });
  }, []);

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used inside I18nProvider');
  return ctx;
}
