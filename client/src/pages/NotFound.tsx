import { SEO } from '../components/SEO'

function NotFound() {
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
      404 — Page not found
    </div>
  )
}

export default NotFound