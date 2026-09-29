import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';
import en from './en.json';
import ar from './ar.json';

export const LANGS = { fr: { label: 'Français', dir: 'ltr' }, en: { label: 'English', dir: 'ltr' }, ar: { label: 'العربية', dir: 'rtl' } };
const KEY = 'hirelink.lang';

export function applyLang(lng) {
  const l = LANGS[lng] ? lng : 'fr';
  document.documentElement.lang = l;
  document.documentElement.dir = LANGS[l].dir;   // RTL automatique pour l'arabe
  localStorage.setItem(KEY, l);                  // persistance après actualisation
}

const saved = localStorage.getItem(KEY) || 'fr';
i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en }, ar: { translation: ar } },
  lng: saved, fallbackLng: 'fr', interpolation: { escapeValue: false },
});
applyLang(saved);
i18n.on('languageChanged', applyLang);
export default i18n;
