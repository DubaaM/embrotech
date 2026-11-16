import { useTranslation } from 'react-i18next'

function ProductionHero() {
  const { t } = useTranslation()

  return (
    <header className="production-hero" data-reveal>
      <h1>{t('production.title')}</h1>
      <p>{t('production.description')}</p>
    </header>
  )
}

export default ProductionHero
