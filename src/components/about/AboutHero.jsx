import { useTranslation } from 'react-i18next'

function AboutHero() {
  const { t } = useTranslation()

  return (
    <section aria-labelledby="about-title" className="about-hero">
      <div className="about-inner about-hero-content" data-reveal>
        <p className="about-eyebrow">{t('about.hero.eyebrow')}</p>
        <h1 className="about-hero-title" id="about-title">{t('about.hero.title')}</h1>
        <p className="about-hero-description">{t('about.hero.description')}</p>
      </div>
    </section>
  )
}

export default AboutHero
