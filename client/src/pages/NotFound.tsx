import { useTranslation } from 'react-i18next'
import { SEO } from '../components/SEO'

function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="p-8 text-2xl">
      <SEO
        titleEn="Page Not Found"
        titleFa="صفحه پیدا نشد"
        descriptionEn="The page you're looking for doesn't exist."
        descriptionFa="صفحه‌ای که به دنبال آن هستید وجود ندارد."
        path="/404"
        noIndex
      />
      {t('notFound.title')}
    </div>
  )
}

export default NotFound
