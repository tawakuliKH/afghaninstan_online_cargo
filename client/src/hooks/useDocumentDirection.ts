import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const RTL_LANGUAGES = ['fa-AF']

export function useDocumentDirection() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const isRTL = RTL_LANGUAGES.includes(i18n.language)
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = i18n.language
  }, [i18n.language])
}