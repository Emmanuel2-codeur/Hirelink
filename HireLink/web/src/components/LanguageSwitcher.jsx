import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { LANGS } from '@/i18n';
import { useAuth } from '@/context/AuthContext';

export default function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation();
  const { setLanguage } = useAuth();
  return (
    <label className={`inline-flex items-center gap-1.5 text-sm ${className}`}>
      <Globe size={16} />
      <select value={i18n.language} onChange={(e) => setLanguage(e.target.value)}
        className="cursor-pointer rounded-md border-0 bg-transparent py-1 pe-6 ps-1 text-sm focus:ring-2 focus:ring-teal">
        {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k} className="text-graphite">{v.label}</option>)}
      </select>
    </label>
  );
}
