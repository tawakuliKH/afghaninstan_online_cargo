import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

const SITE_URL = 'https://afghancargo.online'
const SITE_NAME = 'Afghanistan Online Cargo'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.svg`

interface SEOProps {
  titleEn: string
  titleFa: string
  descriptionEn: string
  descriptionFa: string
  keywordsEn?: string
  keywordsFa?: string
  path?: string
  noIndex?: boolean
}

export function SEO({
  titleEn,
  titleFa,
  descriptionEn,
  descriptionFa,
  keywordsEn,
  keywordsFa,
  path = '',
  noIndex = false,
}: SEOProps) {
  const { i18n } = useTranslation()
  const isDari = i18n.language === 'fa-AF'

  const title = `${isDari ? titleFa : titleEn} — ${SITE_NAME}`
  const description = isDari ? descriptionFa : descriptionEn
  const keywords = isDari ? keywordsFa : keywordsEn
  const canonicalUrl = `${SITE_URL}${path}`

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* hreflang alternates */}
      <link rel="alternate" hrefLang="en" href={`${SITE_URL}${path}?lang=en`} />
      <link rel="alternate" hrefLang="fa-AF" href={`${SITE_URL}${path}?lang=fa-AF`} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={DEFAULT_OG_IMAGE} />
      <meta property="og:locale" content={isDari ? 'fa_AF' : 'en_US'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
    </Helmet>
  )
}

export default SEO
