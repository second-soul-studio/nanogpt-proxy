import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../public/locales/en/translation.json';
import fr from '../public/locales/en/translation.json';
import es from '../public/locales/en/translation.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es },
} as const;

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
  resources,
});

export default i18n;
