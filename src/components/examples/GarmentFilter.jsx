import { useTranslation } from 'react-i18next'

function GarmentFilter({ garments, selectedGarment, onChange }) {
  const { t } = useTranslation()
  const filters = ['all', ...garments]

  return (
    <div
      aria-label={t('examples.filters.label')}
      className="flex flex-wrap justify-center gap-2"
      role="group"
    >
      {filters.map((garment) => (
        <button
          aria-pressed={selectedGarment === garment}
          className={`min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
            selectedGarment === garment
              ? 'bg-brand text-on-brand'
              : 'bg-surface text-text hover:bg-bg'
          }`}
          key={garment}
          onClick={() => onChange(garment)}
          type="button"
        >
          {t(`examples.filters.${garment}`)}
        </button>
      ))}
    </div>
  )
}

export default GarmentFilter
