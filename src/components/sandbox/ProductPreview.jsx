import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sandboxProducts } from '../../data/sandboxProducts'
import { clampPlacement, getInitialPlacement, getSizeLimits } from '../../utils/productPlacement'
import GarmentViewer from './GarmentViewer'

const controlButtonClass = 'min-h-11 rounded-lg border border-border bg-surface px-3 text-sm font-semibold motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50'

function ProductPreview({ artwork, color, onBack, onChange, state }) {
  const { t } = useTranslation()
  const viewerRef = useRef(null)
  const titleRef = useRef(null)
  const [viewerStatus, setViewerStatus] = useState('loading')
  const [projectionError, setProjectionError] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const product = sandboxProducts.tshirt
  const placement = product.placements[state.placement]
  const key = `tshirt:${state.placement}`
  const value = clampPlacement(
    product,
    placement,
    state.adjustments[key] || getInitialPlacement(product, placement, artwork.aspectRatio),
    artwork.aspectRatio,
  )
  const limits = getSizeLimits(product, placement, artwork.aspectRatio)
  const sizeProgress = limits.max === limits.min ? 100 : ((value.size - limits.min) / (limits.max - limits.min)) * 100
  useEffect(() => { titleRef.current?.focus() }, [])

  function updateValue(next) {
    onChange({
      ...state,
      adjustments: {
        ...state.adjustments,
        [key]: clampPlacement(product, placement, next, artwork.aspectRatio),
      },
    })
  }

  async function downloadProduct() {
    setDownloadError('')
    try {
      const blob = await viewerRef.current.download()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'embroidery-product-preview.png'
      document.body.append(link)
      link.click()
      window.setTimeout(() => {
        link.remove()
        URL.revokeObjectURL(url)
      }, 1000)
    } catch (error) {
      console.error('The product preview could not be downloaded.', error)
      setDownloadError(t('sandbox.product.errors.download'))
    }
  }

  return (
    <section aria-labelledby="product-preview-title" className="mt-10 grid gap-8 lg:grid-cols-2">
      <div className="glass min-w-0 rounded-2xl p-6 motion-safe:transition-[transform,box-shadow] motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg motion-reduce:transition-none sm:p-8">
        <h2 className="text-xl font-bold" id="product-preview-title" ref={titleRef} tabIndex="-1">{t('sandbox.product.title')}</h2>
        <label className="mt-5 block font-semibold" htmlFor="sandbox-placement">{t('sandbox.product.placementLabel')}</label>
        <select className="mt-2 w-full rounded-lg border border-border bg-bg px-4 py-3 text-text" id="sandbox-placement" onChange={(event) => onChange({ ...state, placement: event.target.value })} value={state.placement}>
          {Object.keys(product.placements).map((id) => <option key={id} value={id}>{t(`sandbox.product.placements.${id}`)}</option>)}
        </select>
        <label className="mt-5 block font-semibold" htmlFor="sandbox-logo-size">
          {t('sandbox.product.sizeLabel', { size: value.size.toFixed(value.size < 0.1 ? 3 : 1) })}
        </label>
        <input
          className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-border focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-bg [&::-moz-range-thumb]:bg-brand [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-bg [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:shadow-md"
          id="sandbox-logo-size"
          max={limits.max}
          min={limits.min}
          onChange={(event) => updateValue({ ...value, size: Number(event.target.value) })}
          step="0.01"
          style={{ background: `linear-gradient(to right, var(--brand) 0%, var(--brand) ${sizeProgress}%, var(--border) ${sizeProgress}%, var(--border) 100%)` }}
          type="range"
          value={value.size}
        />
        <div aria-hidden="true" className="mt-1 flex justify-between text-xs text-muted">
          <span>{limits.min.toFixed(1)} cm</span>
          <span>{limits.max.toFixed(1)} cm</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted">{t('sandbox.product.sizeNote')}</p>
        <p className="mt-4 text-sm leading-6 text-muted" id="sandbox-product-instructions">{t('sandbox.product.dragInstructions')}</p>
        <div aria-label={t('sandbox.product.moveLabel')} className="mt-3 flex flex-wrap gap-2" role="group">
          {[['left', -2, 0], ['right', 2, 0], ['up', 0, -2], ['down', 0, 2]].map(([direction, x, y]) => (
            <button className={controlButtonClass} key={direction} onClick={() => updateValue({ ...value, x: value.x + x, y: value.y + y })} type="button">{t(`sandbox.product.move.${direction}`)}</button>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="min-h-11 rounded-lg border border-border bg-surface px-5 py-2 font-semibold motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" onClick={onBack} type="button">{t('sandbox.product.back')}</button>
          <button className="min-h-11 rounded-lg bg-brand px-5 py-2 font-semibold text-on-brand motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-reduce:transition-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" disabled={viewerStatus !== 'ready' || projectionError} onClick={() => void downloadProduct()} type="button">{t('sandbox.product.download')}</button>
        </div>
        {downloadError ? <p className="mt-3 text-sm text-text" role="alert">{downloadError}</p> : null}
      </div>
      <div className="glass min-w-0 rounded-2xl p-6 motion-safe:transition-[transform,box-shadow] motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg motion-reduce:transition-none sm:p-8">
        <h3 className="font-semibold">{t('sandbox.product.preview3d')}</h3>
        <p className="mt-2 text-sm text-muted">{t('sandbox.product.rotateInstructions')}</p>
        <GarmentViewer artwork={artwork} color={color} label={t('sandbox.product.previewLabel', { product: t('sandbox.product.products.tshirt'), view: t(`sandbox.product.views.${placement.view}`) })} onError={() => setViewerStatus('error')} onMove={updateValue} onProjectionError={setProjectionError} onReady={() => setViewerStatus('ready')} placement={placement} value={value} viewerRef={viewerRef} />
        {viewerStatus === 'loading' ? <p className="mt-3 text-sm" role="status">{t('sandbox.product.loading3d')}</p> : null}
        {viewerStatus === 'error' ? <p className="mt-3 text-sm" role="alert">{t('sandbox.product.errors.viewer')}</p> : null}
        {projectionError ? <p className="mt-3 text-sm" role="alert">{t('sandbox.product.errors.projection')}</p> : null}
        <div aria-label={t('sandbox.product.rotateLabel')} className="mt-3 flex flex-wrap gap-2" role="group">
          <button aria-label={t('sandbox.product.rotateLeft')} className={`${controlButtonClass} inline-flex size-11 items-center justify-center p-0`} disabled={viewerStatus !== 'ready'} onClick={() => viewerRef.current?.rotate(-1)} type="button">
            <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-2" /></svg>
          </button>
          <button aria-label={t('sandbox.product.rotateRight')} className={`${controlButtonClass} inline-flex size-11 items-center justify-center p-0`} disabled={viewerStatus !== 'ready'} onClick={() => viewerRef.current?.rotate(1)} type="button">
            <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="m15 14 5-5-5-5" /><path d="M20 9H10a6 6 0 0 0 0 12h2" /></svg>
          </button>
        </div>
        <div aria-label={t('sandbox.product.zoomLabel')} className="mt-3 flex flex-wrap gap-2" role="group">
          <button aria-label={t('sandbox.product.zoomIn')} className={`${controlButtonClass} inline-flex size-11 items-center justify-center p-0`} disabled={viewerStatus !== 'ready'} onClick={() => viewerRef.current?.zoom(1)} type="button">
            <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4M10.5 7.5v6M7.5 10.5h6" /></svg>
          </button>
          <button aria-label={t('sandbox.product.zoomOut')} className={`${controlButtonClass} inline-flex size-11 items-center justify-center p-0`} disabled={viewerStatus !== 'ready'} onClick={() => viewerRef.current?.zoom(-1)} type="button">
            <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4M7.5 10.5h6" /></svg>
          </button>
        </div>
      </div>
    </section>
  )
}

export default ProductPreview
