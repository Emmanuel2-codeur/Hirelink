import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { LANGS } from '@/i18n';
import { useAuth } from '@/context/AuthContext';

export default function LanguageSwitcher({ className = '' }) {
  const { t, i18n } = useTranslation();
  const { setLanguage } = useAuth();
  return (
    <label className={`relative inline-flex min-h-11 items-center gap-1.5 text-sm font-medium ${className}`}>
      <Globe size={16} aria-hidden="true" />
      <span className="sr-only">{t('common.language')}</span>
      <select value={i18n.language} onChange={(e) => setLanguage(e.target.value)}
        className="cursor-pointer appearance-none rounded-md bg-transparent py-2 pe-1 ps-0 text-sm font-medium focus:outline-none">
        {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k} className="text-graphite">{v.label}</option>)}
      </select>
    </label>
  );
}
