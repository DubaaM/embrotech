import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

function ContactCta() {
  const { t } = useTranslation()
  const { language } = useParams()

  return (
    <section
      aria-labelledby="home-contact-title"
      className="bg-brand px-4 py-16 text-center text-on-brand sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          className="text-3xl font-bold tracking-tight sm:text-4xl"
          id="home-contact-title"
        >
          {t('home.contact.title')}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-7">
          {t('home.contact.description')}
        </p>
        <Link
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg border border-border bg-surface px-6 py-3 font-semibold text-text motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:hover:shadow-lg motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
          to={`/${language}/contact`}
        >
          {t('home.contact.button')}
        </Link>
      </div>
    </section>
  )
}

export default ContactCta
