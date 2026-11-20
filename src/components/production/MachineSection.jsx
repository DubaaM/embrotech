import { useTranslation } from 'react-i18next'
import GlassCard from '../about/GlassCard'
import SpecList from './SpecList'

function MachineSection({ machine, reversed, onOpenImage }) {
  const { t } = useTranslation()
  const titleId = `production-${machine.id}`

  return (
    <section aria-labelledby={titleId} className={`production-machine${reversed ? ' production-machine--reverse' : ''}`}>
      <div className="production-image-reveal" data-reveal>
        <button
          aria-label={t('production.openPhoto', { name: t(machine.name) })}
          className="production-image-button"
          onClick={(event) => onOpenImage(machine, event.currentTarget)}
          type="button"
        >
          <img alt={t(machine.alt)} decoding="async" height={machine.height} loading="lazy" src={machine.image} width={machine.width} />
        </button>
      </div>
      <div className="production-card-reveal" data-reveal style={{ '--reveal-order': 1 }}>
        <GlassCard className="production-card">
          <h2 id={titleId}>{t(machine.name)}</h2>
          <p>{t(machine.description)}</p>
          <SpecList specs={machine.specs} />
        </GlassCard>
      </div>
    </section>
  )
}

export default MachineSection
