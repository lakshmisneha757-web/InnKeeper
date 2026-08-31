import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import te from './locales/te.json';

const STORAGE_KEY = 'innkeeper_language';

const getInitialLanguage = (): string => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['en', 'hi', 'te'].includes(saved)) {
      return saved;
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  return 'en';
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    te: { translation: te },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch (e) {
    // Ignore localStorage errors
  }
});

export default i18n;
