import { useLang } from '@/contexts/LanguageContext';

interface LanguageToggleProps {
  className?: string;
}

export default function LanguageToggle({ className = '' }: LanguageToggleProps) {
  const { lang, setLang } = useLang();

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-enb-green hover:bg-enb-green/5 transition-all text-sm font-medium ${className}`}
      title={lang === 'en' ? 'اردو میں دیکھیں' : 'Switch to English'}
    >
      <span className="text-base leading-none">{lang === 'en' ? '🇵🇰' : '🇬🇧'}</span>
      <span className={`text-enb-text-primary ${lang === 'ur' ? 'font-urdu' : ''}`}>
        {lang === 'en' ? 'اردو' : 'English'}
      </span>
    </button>
  );
}
