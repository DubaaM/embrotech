import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

function NotFoundPage() {
  const { t } = useTranslation()
  const { language } = useParams()

  return (
    <section
      aria-labelledby="not-found-title"
      className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24"
    >
      <h1 className="text-3xl font-bold tracking-tight text-text" id="not-found-title">
        {t('notFound.title')}
      </h1>
      <p className="mt-4 text-muted">{t('notFound.description')}</p>
      <Link
        className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-brand px-6 py-3 font-semibold text-on-brand motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:hover:shadow-lg motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        to={`/${language}`}
      >
        {t('notFound.homeLink')}
      </Link>
    </section>
  )
}

export default NotFoundPage
