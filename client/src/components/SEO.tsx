import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

const SITE_URL = 'https://afghancargo.online'
const SITE_NAME = 'Afghanistan Online Cargo'
const SITE_NAME_FA = 'کارگو آنلاین افغانستان'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.svg`
const DEFAULT_TWITTER = '@afghancargo'

interface SEOProps {
  titleEn: string
  titleFa: string
  descriptionEn: string
  descriptionFa: string
  keywordsEn?: string
  keywordsFa?: string
  path?: string
  noIndex?: boolean
  ogImage?: string
  ogType?: 'website' | 'article' | 'profile'
  structuredData?: object | object[]
}

// Base keywords always included
const BASE_KEYWORDS_EN = `Afghanistan cargo, Afghan package delivery, send package to Afghanistan,
cross-border delivery Afghanistan, Afghan travelers, cargo Afghanistan online,
package delivery Kabul, Afghan courier, KYC verified delivery, Afghan diaspora`

const BASE_KEYWORDS_FA = `کارگو افغانستان, بسته افغانستان, ارسال بسته به افغانستان,
مسافران افغانستان, کارگو آنلاین افغانستان, ارسال پارسل, تحویل بسته کابل,
مسافر افغانستان به اروپا, مسافر افغانستان به امریکا, مسافر افغانستان به دوبی`

export function SEO({
  titleEn,
  titleFa,
  descriptionEn,
  descriptionFa,
  keywordsEn,
  keywordsFa,
  path = '',
  noIndex = false,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  structuredData,
}: SEOProps) {
  const { i18n } = useTranslation()
  const isDari = i18n.language === 'fa-AF'

  const siteName = isDari ? SITE_NAME_FA : SITE_NAME
  const title = isDari
    ? `${titleFa} — ${SITE_NAME_FA}`
    : `${titleEn} — ${SITE_NAME}`
  const lang = isDari ? 'fa' : 'en'
  const dir = isDari ? 'rtl' : 'ltr'

  // Merge page-specific keywords with base keywords
  const keywords = isDari
    ? `${keywordsFa ? keywordsFa + ', ' : ''}${BASE_KEYWORDS_FA}`
    : `${keywordsEn ? keywordsEn + ', ' : ''}${BASE_KEYWORDS_EN}`

  const canonicalUrl = `${SITE_URL}${path}`

  // Combine both language descriptions for richer indexing
  const fullDescription = `${descriptionEn} | ${descriptionFa}`

  return (
    <Helmet>
      {/* Basic */}
      <html lang={lang} dir={dir} />
      <title>{title}</title>
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Khadim Tawakuli" />
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots */}
      {noIndex
        ? <meta name="robots" content="noindex, nofollow" />
        : <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      }

      {/* Geo targeting */}
      <meta name="geo.region" content="AF" />
      <meta name="geo.placename" content="Afghanistan" />

      {/* Language */}
      <meta name="language" content={isDari ? 'Dari, Persian, فارسی, دری' : 'English, Dari'} />

      {/* hreflang alternates — no ?lang param, just path */}
      <link rel="alternate" hrefLang="en" href={`${SITE_URL}${path}`} />
      <link rel="alternate" hrefLang="fa" href={`${SITE_URL}${path}`} />
      <link rel="alternate" hrefLang="fa-AF" href={`${SITE_URL}${path}`} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${titleEn} — ${SITE_NAME}`} />
      <meta property="og:locale" content={isDari ? 'fa_AF' : 'en_US'} />
      <meta property="og:locale:alternate" content={isDari ? 'en_US' : 'fa_AF'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={DEFAULT_TWITTER} />
      <meta name="twitter:creator" content={DEFAULT_TWITTER} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={`${titleEn} — ${SITE_NAME}`} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(structuredData)
            ? structuredData
            : [structuredData]
          )}
        </script>
      )}
    </Helmet>
  )
}

export default SEO