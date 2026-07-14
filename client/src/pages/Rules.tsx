import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Shield, Package, MapPin, CheckCircle } from 'lucide-react'
import { SEO } from '../components/SEO'

// ── Structured Data ─────────────────────────────────────────

const RULES_STRUCTURED_DATA = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Rules & Terms — Afghanistan Online Cargo",
    "alternateName": "قوانین و شرایط — کارگو آنلاین افغانستان",
    "description": "Platform rules, sender terms, and traveler terms governing cross-border package deliveries on Afghanistan Online Cargo.",
    "url": "https://afghancargo.online/rules",
    "inLanguage": ["en", "fa"],
    "isPartOf": {
      "@type": "WebSite",
      "name": "Afghanistan Online Cargo",
      "url": "https://afghancargo.online"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "TermsOfService",
    "name": "Afghanistan Online Cargo — Terms of Service",
    "alternateName": "کارگو آنلاین افغانستان — شرایط خدمات",
    "url": "https://afghancargo.online/rules",
    "description": "Terms governing the use of Afghanistan Online Cargo platform for cross-border package coordination between Afghan senders and travelers.",
    "publisher": {
      "@type": "Person",
      "name": "Khadim Tawakuli",
      "url": "https://tawakuli.dev"
    },
    "inLanguage": ["en", "fa"]
  }
]

function Rules() {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<'general' | 'sender' | 'traveler'>('general')
  const isRTL = i18n.language === 'fa-AF'

  const tabs = [
    { id: 'general' as const, label: t('rules.generalTab'), icon: Shield },
    { id: 'sender' as const, label: t('rules.senderTab'), icon: Package },
    { id: 'traveler' as const, label: t('rules.travelerTab'), icon: MapPin },
  ]

  const generalPoints = t('rules.general.points', { returnObjects: true }) as string[]
  const senderSections = t('rules.sender.sections', { returnObjects: true }) as { heading: string; body: string }[]
  const travelerSections = t('rules.traveler.sections', { returnObjects: true }) as { heading: string; body: string }[]

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <SEO
        titleEn="Platform Rules, Sender Terms & Traveler Terms"
        titleFa="قوانین پلتفرم، شرایط فرستنده و شرایط مسافر"
        descriptionEn="Read the complete rules and legal terms governing cross-border package deliveries on Afghanistan Online Cargo. Includes general platform rules, sender agreement, and traveler agreement."
        descriptionFa="قوانین کامل و شرایط قانونی حاکم بر تحویل بسته‌های بین‌المللی در کارگو آنلاین افغانستان را بخوانید. شامل قوانین عمومی پلتفرم، توافقنامه فرستنده و توافقنامه مسافر."
        keywordsEn="Afghanistan cargo rules, Afghan delivery terms, package delivery agreement, cross-border delivery terms, Afghan cargo legal, sender agreement, traveler agreement, KYC verification terms"
        keywordsFa="قوانین کارگو افغانستان، شرایط تحویل افغانی، توافقنامه ارسال بسته، شرایط تحویل بین‌المللی، قانونی کارگو افغانستان، توافقنامه فرستنده، توافقنامه مسافر، شرایط تأیید هویت"
        path="/rules"
        structuredData={RULES_STRUCTURED_DATA}
      />

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-brand-primary">
          {t('rules.pageTitle')}
        </h1>
        <p className="mt-1 text-xs font-medium text-brand-accent">
          قوانین و توافقنامه‌های پلتفرم
        </p>
        <p className="mt-2 text-sm text-brand-muted">
          {t('rules.pageSubtitle')}
        </p>
        <p className="mt-1 text-xs text-brand-muted/60">
          Please read all terms carefully before using the platform. |{" "}
          لطفاً تمام شرایط را قبل از استفاده از پلتفرم به دقت بخوانید.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 rounded-xl bg-white p-1 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-brand-primary text-white'
                  : 'text-brand-muted hover:text-brand-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* General tab */}
      {activeTab === 'general' && (
        <div className="rounded-2xl bg-white p-8 shadow-sm" dir={isRTL ? 'rtl' : 'ltr'}>
          <h2 className="mb-4 text-xl font-bold text-brand-primary">
            {t('rules.general.title')}
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-brand-muted">
            {t('rules.general.intro')}
          </p>
          <ul className="space-y-3">
            {generalPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-secondary" />
                <p className="text-sm leading-relaxed text-brand-muted">{point}</p>
              </li>
            ))}
          </ul>

          {/* SEO footer text */}
          <div className="mt-8 rounded-xl border border-brand-muted/10 bg-brand-bg p-4">
            <p className="text-xs text-brand-muted leading-relaxed">
              Afghanistan Online Cargo is a coordination platform — not a courier service.
              All physical handovers happen in person between KYC-verified users.
              Every delivery agreement is timestamped as legal evidence.
              The platform does not transport, insure, or take custody of any package.
            </p>
            <p className="mt-2 text-xs text-brand-muted/70 leading-relaxed">
              کارگو آنلاین افغانستان یک پلتفرم هماهنگی است — نه یک سرویس پیک.
              تمام تحویل‌های فیزیکی به صورت حضوری بین کاربران تأیید هویت شده انجام می‌شود.
              هر توافق تحویل به عنوان مدرک قانونی زمان‌بندی می‌شود.
              پلتفرم هیچ بسته‌ای را حمل، بیمه یا نگهداری نمی‌کند.
            </p>
          </div>
        </div>
      )}

      {/* Sender tab */}
      {activeTab === 'sender' && (
        <div className="rounded-2xl bg-white p-8 shadow-sm" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="mb-6 border-b border-brand-muted/10 pb-4">
            <h2 className="text-xl font-bold text-brand-primary">
              {t('rules.sender.title')}
            </h2>
            <p className="mt-1 text-xs text-brand-muted">
              {t('rules.sender.lastUpdated')}
            </p>
          </div>
          <div className="space-y-6">
            {senderSections.map((section, i) => (
              <div key={i}>
                <h3 className="mb-2 font-semibold text-brand-primary">
                  {section.heading}
                </h3>
                <p className="text-sm leading-relaxed text-brand-muted">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Traveler tab */}
      {activeTab === 'traveler' && (
        <div className="rounded-2xl bg-white p-8 shadow-sm" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="mb-6 border-b border-brand-muted/10 pb-4">
            <h2 className="text-xl font-bold text-brand-primary">
              {t('rules.traveler.title')}
            </h2>
            <p className="mt-1 text-xs text-brand-muted">
              {t('rules.traveler.lastUpdated')}
            </p>
          </div>
          <div className="space-y-6">
            {travelerSections.map((section, i) => (
              <div key={i}>
                <h3 className="mb-2 font-semibold text-brand-primary">
                  {section.heading}
                </h3>
                <p className="text-sm leading-relaxed text-brand-muted">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Rules