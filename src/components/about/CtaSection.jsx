import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import GlassCard from './GlassCard'
import './about.css'

function CtaSection({ translationKey = 'about.cta', headingId = 'about-cta-title' }) {
  const { t } = useTranslation()
  const { language } = useParams()

  return (
    <section aria-labelledby={headingId} className="about-section about-inner">
      <div data-reveal>
        <GlassCard className="about-cta">
          <h2 id={headingId}>{t(`${translationKey}.title`)}</h2>
          <p>{t(`${translationKey}.description`)}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link className="about-cta-link" to={`/${language}/contact`}>
              {t(`${translationKey}.button`)}
            </Link>
            <Link className="about-cta-link about-cta-link--secondary" to={`/${language}/${language === 'sk' ? 'skusobna' : 'try-it'}`}>
              {t('about.cta.tryButton')}
            </Link>
          </div>
        </GlassCard>
      </div>
    </section>
  )
}

export default CtaSection
