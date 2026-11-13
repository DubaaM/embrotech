import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PhotoGallery from './PhotoGallery'

function ExampleCard({ example }) {
  const { t, i18n } = useTranslation()
  const [logoFailed, setLogoFailed] = useState(false)
  const title = example.title
  const clientName = example.clientName
  const price = new Intl.NumberFormat(i18n.resolvedLanguage || i18n.language, {
    style: 'currency',
    currency: 'EUR',
  }).format(example.price)

  return (
    <article className="glass group grid overflow-hidden rounded-2xl border border-border p-4 shadow-sm motion-safe:transition motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg motion-reduce:transition-none sm:p-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,4fr)_minmax(0,3fr)] lg:items-stretch lg:gap-4">
      <div className="order-1 flex flex-col lg:min-h-0">
        <div className="fabric-cream flex h-150 items-center justify-center overflow-hidden rounded-xl lg:h-auto lg:min-h-0 lg:flex-1">
          {example.logo && !logoFailed ? (
            <img
              alt={clientName}
              className="h-full w-full rounded-xl object-cover"
              loading="lazy"
              onError={() => setLogoFailed(true)}
              src={example.logo}
            />
          ) : (
            <span className="text-center text-lg font-semibold text-text">
              {clientName}
            </span>
          )}
        </div>
        <p className="mt-1 text-center text-xs text-muted">{clientName}</p>
      </div>

      <div className="order-2 flex min-w-0 flex-col gap-2 py-3 lg:py-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-text">{title}</h3>
          <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-semibold text-text">
            {t(`examples.garments.${example.garment}`)}
          </span>
        </div>
        <p className="leading-5 text-muted">{example.description}</p>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          {[
            [
              'stitches',
              example.stitchCount.toLocaleString(
                i18n.resolvedLanguage || i18n.language,
              ),
            ],
            ['size', example.size],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted">{t(`examples.details.${label}`)}</dt>
              <dd className="font-medium text-text">{value}</dd>
            </div>
          ))}
        </dl>

        <div>
          <p className="text-xl font-bold text-text">{price}</p>
          <p className="text-xs leading-5 text-muted">
            {t('examples.priceNote')}
          </p>
        </div>
      </div>

      <div className="order-3 min-w-0 self-center lg:self-stretch">
        <PhotoGallery example={example} title={title} />
      </div>
    </article>
  )
}

export default ExampleCard
