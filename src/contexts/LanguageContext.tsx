import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Lang } from '@/lib/translations';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: typeof translations;
  isUrdu: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: translations,
  isUrdu: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('enb_lang') as Lang) || 'en';
  });

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('enb_lang', newLang);
    // Set RTL direction for Urdu
    document.documentElement.dir = newLang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations, isUrdu: lang === 'ur' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

// Convenience hook — get translated string for current lang
// Usage: const { l } = useT(); l('welcome', 'headline')
export function useT() {
  const { lang, t } = useContext(LanguageContext);
  
  const l = <S extends keyof typeof translations>(
    section: S,
    key: keyof (typeof translations)[S]['en']
  ): string => {
    const section_data = t[section] as any;
    return section_data[lang]?.[key] ?? section_data['en']?.[key] ?? String(key);
  };

  return { l, lang, isUrdu: lang === 'ur' };
}
