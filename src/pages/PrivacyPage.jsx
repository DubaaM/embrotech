import { useTranslation } from 'react-i18next'

function PrivacyPage() {
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby="privacy-title"
      className="mx-auto max-w-6xl px-4 py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-3xl">
        <h1
          className="text-4xl font-bold tracking-tight text-text sm:text-5xl"
          id="privacy-title"
        >
          {t('privacy.title')}
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted">
          {t('privacy.description')}
        </p>
      </div>
    </section>
  )
}

export default PrivacyPage
