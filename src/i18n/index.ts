import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';
import hu from './hu.json';

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'hu'],
    interpolation: { escapeValue: false },
    keySeparator: '.',
    resources: {
      en: { translation: en },
      hu: { translation: hu },
    },
  });

export default i18next;
