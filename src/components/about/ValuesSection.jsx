import { useTranslation } from 'react-i18next'
import GlassCard from './GlassCard'

const values = [
  { key: 'quality', path: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" /> },
  { key: 'precision', path: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></> },
  { key: 'individual', path: <path d="M4 7h16M4 17h16M8 4v6m8 4v6M4 12h16" /> },
]

function ValuesSection() {
  const { t } = useTranslation()

  return (
    <section aria-labelledby="about-values-title" className="about-section about-inner">
      <div data-reveal>
        <GlassCard className="about-section-intro">
          <h2 id="about-values-title">{t('about.values.title')}</h2>
          <p>{t('about.values.description')}</p>
        </GlassCard>
      </div>
      <div className="about-grid about-values-grid">
        {values.map(({ key, path }, index) => (
          <div data-reveal key={key} style={{ '--reveal-order': index }}>
            <GlassCard as="article" className="about-value">
              <svg aria-hidden="true" className="about-icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">{path}</svg>
              <h3>{t(`about.values.items.${key}.title`)}</h3>
              <p>{t(`about.values.items.${key}.description`)}</p>
            </GlassCard>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ValuesSection
