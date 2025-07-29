'use client'
import constants, { getConstants } from '@/constants'
import { useLanguage } from '@/context/LanguageContext'

export const useConstants = () => {
  const { lang } = useLanguage()
  return getConstants(lang)
}

export default useConstants
