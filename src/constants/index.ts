import * as fr from './fr'
import * as en from './en'
import * as es from './es'
import { Language } from '@/context/LanguageContext'

const data: Record<Language, any> = {
  fr,
  en,
  es
}

export const getConstants = (lang: Language) => data[lang]
export default data
