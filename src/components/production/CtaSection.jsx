import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

function CtaSection() {
  const { t } = useTranslation()
  const { language } = useParams()

  return (
    <section aria-labelledby="production-cta-title" className="production-cta" data-reveal>
      <h2 id="production-cta-title">{t('production.cta.title')}</h2>
      <p>{t('production.cta.description')}</p>
      <Link className="about-cta-link" to={`/${language}/contact`}>
        {t('production.cta.button')}
      </Link>
    </section>
  )
}

export default CtaSection
