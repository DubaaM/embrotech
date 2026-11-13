import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

function PageHero({ pageKey, ctaPath }) {
  const { t } = useTranslation()
  const { language } = useParams()

  return (
    <section
      aria-labelledby="page-title"
      className="mx-auto flex min-h-[65vh] max-w-6xl flex-col items-center justify-center px-4 py-16 text-center sm:py-24 motion-safe:animate-fade-in-up motion-reduce:animate-none"
    >
      <h1
        className="max-w-4xl text-4xl font-bold tracking-tight text-text sm:text-5xl lg:text-6xl"
        id="page-title"
      >
        {t(`pages.${pageKey}.title`)}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
        {t(`pages.${pageKey}.description`)}
      </p>
      <Link
        className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-brand px-6 py-3 font-semibold text-on-brand shadow-sm motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:hover:shadow-lg motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        to={`/${language}/${ctaPath}`}
      >
        {t(`pages.${pageKey}.cta`)}
      </Link>
    </section>
  )
}

export default PageHero
