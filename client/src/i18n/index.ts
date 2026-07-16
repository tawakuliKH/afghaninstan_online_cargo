import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './en.json'
import faAF from './fa-AF.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'fa-AF': { translation: faAF },
    },
    fallbackLng: 'en', // No ?lang= param and nothing cached yet -> English
    detection: {
      order: ['querystring', 'localStorage'],
      lookupQuerystring: 'lang',
      caches: ['localStorage'],
      // ?lang=fa maps to the fa-AF resource bundle (our only Dari variant)
      convertDetectedLanguage: (lng: string) => (lng === 'fa' ? 'fa-AF' : lng),
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n