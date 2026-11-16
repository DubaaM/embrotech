import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import machineImage from '../assets/home/Light.jpg'
import AboutHero from '../components/about/AboutHero'
import CtaSection from '../components/about/CtaSection'
import GlassCard from '../components/about/GlassCard'
import ServiceCard from '../components/about/ServiceCard'
import StatCounter from '../components/about/StatCounter'
import StitchLine from '../components/about/StitchLine'
import ValuesSection from '../components/about/ValuesSection'
import useAboutMotion from '../components/about/useAboutMotion'
import '../components/about/about.css'

const stats = [
  { key: 'experience', value: 25 },
  { key: 'projects', value: 25000 },
  { key: 'clients', value: 100 },
]
const services = ['shirt', 'cap', 'jacket']

function AboutPage() {
  const { t } = useTranslation()
  const pageRef = useRef(null)
  useAboutMotion(pageRef)

  return (
    <div className="about-page" ref={pageRef}>
      <StitchLine />
      <AboutHero />

      <section aria-labelledby="about-story-title" className="about-section about-inner about-story">
        <div data-reveal>
          <GlassCard className="about-story-copy">
            <p className="about-eyebrow">{t('about.story.eyebrow')}</p>
            <h2 id="about-story-title">{t('about.story.title')}</h2>
            <p>{t('about.story.description')}</p>
          </GlassCard>
        </div>
        <div data-reveal style={{ '--reveal-order': 1 }}>
          <GlassCard className="about-story-image">
            <img alt={t('about.story.imageAlt')} decoding="async" loading="lazy" src={machineImage} />
          </GlassCard>
        </div>
      </section>
      <section aria-labelledby="about-stats-title" className="about-section about-inner">
        <div data-reveal>
          <GlassCard className="about-section-intro">
            <h2 id="about-stats-title">{t('about.stats.title')}</h2>
            <p>{t('about.stats.exampleNotice')}</p>
          </GlassCard>
        </div>
        <div className="about-grid about-stats-grid">
          {stats.map(({ key, value }, index) => (
            <div data-reveal key={key} style={{ '--reveal-order': index }}>
              <StatCounter label={t(`about.stats.items.${key}`)} value={value} />
            </div>
          ))}
        </div>
      </section>
      <section aria-labelledby="about-services-title" className="about-section about-inner">
        <div data-reveal>
          <GlassCard className="about-section-intro">
            <h2 id="about-services-title">{t('about.services.title')}</h2>
            <p>{t('about.services.description')}</p>
          </GlassCard>
        </div>
        <div className="about-grid about-services-grid">
          {services.map((type, index) => (
            <div data-reveal key={type} style={{ '--reveal-order': index }}>
              <ServiceCard
                description={t(`about.services.items.${type}.description`)}
                title={t(`about.services.items.${type}.title`)}
                type={type}
              />
            </div>
          ))}
        </div>
      </section>
      <ValuesSection />
      <CtaSection />
    </div>
  )
}

export default AboutPage
