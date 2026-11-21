import { useTranslation } from 'react-i18next'
import { GARMENT_COLORS } from '../../data/garmentViewerConfig.js'

function ColorPicker({ onChange, value, isFullscreen = false }) {
  const { t } = useTranslation()
  const colorsClass = isFullscreen
    ? 'flex max-w-full flex-nowrap gap-2 overflow-x-auto py-2 lg:max-h-[65dvh] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:py-1'
    : 'flex flex-wrap gap-2'

  return (
    <fieldset className={`glass-strong min-w-0 rounded-xl border border-border p-3 ${isFullscreen ? 'lg:w-20 lg:shrink-0' : 'mt-3'}`}>
      <legend className="px-1 text-sm font-semibold text-text">{t('sandbox.product.viewer.garmentColorLabel')}</legend>
      <div className={colorsClass}>
        {GARMENT_COLORS.map(({ hex, id }) => {
          const label = t(`sandbox.product.viewer.colors.${id}`)
          const selected = value.toLowerCase() === hex.toLowerCase()
          return (
            <button
              aria-label={label}
              aria-pressed={selected}
              className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${selected ? 'ring-2 ring-brand ring-offset-2 ring-offset-bg' : ''}`}
              key={id}
              onClick={() => onChange(hex)}
              style={{ backgroundColor: hex }}
              title={label}
              type="button"
            >
              {selected ? (
                <svg aria-hidden="true" className="size-5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" fill="none" stroke={id === 'white' || id === 'cream' ? '#2A1A0E' : '#FFFFFF'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="m5 12 4 4L19 6" />
                </svg>
              ) : null}
            </button>
          )
        })}
        <label
          className="relative inline-flex size-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-surface focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand"
          title={t('sandbox.product.viewer.customColor')}
        >
          <span aria-hidden="true" className="absolute inset-0" style={{ backgroundColor: value }} />
          <span aria-hidden="true" className="relative rounded-md bg-bg/80 px-1 text-xs font-bold text-text">+</span>
          <input
            aria-label={t('sandbox.product.viewer.customColor')}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            type="color"
            value={value}
          />
        </label>
      </div>
    </fieldset>
  )
}

export default ColorPicker
