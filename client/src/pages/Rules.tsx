import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Shield, Package, MapPin, CheckCircle } from 'lucide-react'

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

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-brand-primary">{t('rules.pageTitle')}</h1>
        <p className="mt-2 text-sm text-brand-muted">{t('rules.pageSubtitle')}</p>
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
                <h3 className="mb-2 font-semibold text-brand-primary">{section.heading}</h3>
                <p className="text-sm leading-relaxed text-brand-muted">{section.body}</p>
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
                <h3 className="mb-2 font-semibold text-brand-primary">{section.heading}</h3>
                <p className="text-sm leading-relaxed text-brand-muted">{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Rules