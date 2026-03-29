import fr from './fr.json'
import en from './en.json'

type Locale = 'fr' | 'en'
type TranslationKey = keyof typeof fr

const translations: Record<Locale, Record<string, string>> = { fr, en }

let currentLocale: Locale = detectLocale()

function detectLocale(): Locale {
  const browserLang = navigator.language.slice(0, 2)
  return browserLang === 'fr' ? 'fr' : 'en'
}

export function t(key: TranslationKey): string {
  return translations[currentLocale][key] ?? key
}

export function setLocale(locale: Locale): void {
  currentLocale = locale
}

export function getLocale(): Locale {
  return currentLocale
}
