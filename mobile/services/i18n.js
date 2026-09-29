// Langue persistée + RTL. Après changement vers/depuis l'arabe, relancer l'app (limitation React Native : I18nManager).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
const dict = {
  fr: { welcome: 'Bienvenue sur HireLink', tagline: 'Le lien intelligent entre recruteurs et talents', hello: 'Bonjour' },
  en: { welcome: 'Welcome to HireLink', tagline: 'The smart link between recruiters and talent', hello: 'Hello' },
  ar: { welcome: 'مرحبًا بك في HireLink', tagline: 'الرابط الذكي بين المُوظِّفين والمواهب', hello: 'مرحبًا' },
};
export const t = (lng, k) => dict[lng]?.[k] ?? dict.fr[k];
export async function getLang() { return (await AsyncStorage.getItem('lang')) || 'fr'; }
export async function setLang(lng) { await AsyncStorage.setItem('lang', lng); I18nManager.allowRTL(true); I18nManager.forceRTL(lng === 'ar'); }
