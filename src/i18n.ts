import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import ru from './locales/ru.json'
import tr from './locales/tr.json'
import vi from './locales/vi.json'
import zh from './locales/zh.json'

const supportedLanguages = ['en', 'de', 'es', 'fr', 'ru', 'tr', 'vi', 'zh'] as const

type SupportedLanguage = (typeof supportedLanguages)[number]

const getInitialLanguage = (): SupportedLanguage => {
  const stored = localStorage.getItem('language')
  if (stored && supportedLanguages.includes(stored as SupportedLanguage)) {
    return stored as SupportedLanguage
  }

  const browser = navigator.language.split('-')[0]
  if (supportedLanguages.includes(browser as SupportedLanguage)) {
    return browser as SupportedLanguage
  }

  return 'en'
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
    es: { translation: es },
    fr: { translation: fr },
    ru: { translation: ru },
    tr: { translation: tr },
    vi: { translation: vi },
    zh: { translation: zh },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  supportedLngs: supportedLanguages,
  interpolation: {
    escapeValue: false,
  },
})

export const setLanguage = (language: SupportedLanguage) => {
  i18n.changeLanguage(language)
  localStorage.setItem('language', language)
}

export default i18n
