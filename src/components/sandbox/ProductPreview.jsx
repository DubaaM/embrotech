import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sandboxProducts } from '../../data/sandboxProducts'
import { DEFAULT_GARMENT_COLOR, GARMENT_VIEWER_SETTINGS, isValidGarmentColor } from '../../data/garmentViewerConfig.js'
import { clampPlacement, getInitialPlacement, getSizeLimits } from '../../utils/productPlacement'
import ColorPicker from './ColorPicker.jsx'
import FullscreenButton from './FullscreenButton.jsx'
import GarmentViewer from './GarmentViewer'
import ViewerToolbar from './ViewerToolbar.jsx'

const controlButtonClass = 'min-h-11 rounded-lg border border-border bg-surface px-3 text-sm font-semibold motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50'

function ProductPreview({ artwork, color, onBack, onChange, state }) {
  const { t } = useTranslation()
  const viewerRef = useRef(null)
  const viewerHostRef = useRef(null)
  const backButtonRef = useRef(null)
  const fullscreenButtonRef = useRef(null)
  const titleRef = useRef(null)
  const [viewerStatus, setViewerStatus] = useState('loading')
  const [projectionError, setProjectionError] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false)
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false)
  const [autoRotate, setAutoRotate] = useState(GARMENT_VIEWER_SETTINGS.autoRotateByDefault)
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
  const garmentColor = isValidGarmentColor(state.garmentColor)
    ? state.garmentColor
    : isValidGarmentColor(color) ? color : DEFAULT_GARMENT_COLOR
  const isFullscreen = isNativeFullscreen || isPseudoFullscreen
  useEffect(() => { titleRef.current?.focus() }, [])

  useEffect(() => {
    function syncFullscreenState() {
      setIsNativeFullscreen(document.fullscreenElement === viewerHostRef.current)
      viewerRef.current?.resize()
    }

    document.addEventListener('fullscreenchange', syncFullscreenState)
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState)
  }, [])

  useEffect(() => {
    if (!isPseudoFullscreen) return undefined
    const previousOverflow = document.body.style.overflow
    const fullscreenButton = fullscreenButtonRef.current
    document.body.style.overflow = 'hidden'
    const focusFrame = window.requestAnimationFrame(() => backButtonRef.current?.focus())

    function handlePseudoKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsPseudoFullscreen(false)
        return
      }
      if (event.key !== 'Tab') return
      const focusable = viewerHostRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handlePseudoKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      window.removeEventListener('keydown', handlePseudoKeyDown)
      document.body.style.overflow = previousOverflow
      window.requestAnimationFrame(() => fullscreenButton?.focus())
    }
  }, [isPseudoFullscreen])

  useEffect(() => {
    viewerRef.current?.setAutoRotate(autoRotate)
  }, [autoRotate, viewerStatus])

  function updateValue(next) {
    onChange({
      ...state,
      adjustments: {
        ...state.adjustments,
        [key]: clampPlacement(product, placement, next, artwork.aspectRatio),
      },
    })
  }

  function updateGarmentColor(nextColor) {
    onChange({ ...state, garmentColor: nextColor })
  }

  async function toggleFullscreen() {
    const viewerHost = viewerHostRef.current
    if (isFullscreen) {
      if (document.fullscreenElement === viewerHost && document.exitFullscreen) {
        try {
          await document.exitFullscreen()
        } catch (error) {
          console.error('The garment viewer could not exit fullscreen.', error)
        }
      }
      setIsPseudoFullscreen(false)
      return
    }

    if (typeof viewerHost?.requestFullscreen === 'function' && typeof document.exitFullscreen === 'function') {
      try {
        await viewerHost.requestFullscreen()
        return
      } catch (error) {
        console.error('Native fullscreen is unavailable for the garment viewer; using the page overlay instead.', error)
      }
    }
    setIsPseudoFullscreen(true)
  }

  async function closeViewer() {
    if (document.fullscreenElement === viewerHostRef.current && document.exitFullscreen) {
      try {
        await document.exitFullscreen()
      } catch (error) {
        console.error('The garment viewer could not exit fullscreen.', error)
      }
    }
    setIsPseudoFullscreen(false)
  }

  async function backToEditor() {
    await closeViewer()
    onBack()
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
      <div
        aria-label={isFullscreen ? t('sandbox.product.preview3d') : undefined}
        aria-modal={isFullscreen ? 'true' : undefined}
        className={isFullscreen
          ? 'glass-strong fixed inset-0 z-[100] flex min-h-0 flex-col overflow-hidden rounded-none border-0 bg-bg/80 p-3 shadow-none backdrop-blur-2xl pt-[calc(0.75rem+env(safe-area-inset-top))] pb-[calc(0.75rem+env(safe-area-inset-bottom))] pl-[calc(0.75rem+env(safe-area-inset-left))] pr-[calc(0.75rem+env(safe-area-inset-right))] sm:pl-5 sm:pr-5 sm:pt-[calc(1.25rem+env(safe-area-inset-top))] sm:pb-[calc(1.25rem+env(safe-area-inset-bottom))]'
          : 'glass min-w-0 rounded-2xl p-6 motion-safe:transition-[transform,box-shadow] motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg motion-reduce:transition-none sm:p-8'}
        ref={viewerHostRef}
        role={isFullscreen ? 'dialog' : undefined}
        tabIndex={isPseudoFullscreen ? -1 : undefined}
      >
        <div className="flex shrink-0 items-center justify-between gap-3">
          {isFullscreen ? (
            <button
              aria-label={t('sandbox.product.viewer.backToEditor')}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-bg/75 px-3 text-sm font-semibold text-text shadow-sm backdrop-blur-md motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              onClick={() => void backToEditor()}
              ref={backButtonRef}
              title={t('sandbox.product.viewer.backToEditor')}
              type="button"
            >
              <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="m15 18-6-6 6-6M9 12h12" />
              </svg>
              <span>{t('sandbox.product.viewer.backToEditor')}</span>
            </button>
          ) : (
            <div className="min-w-0">
              <h3 className="font-semibold" id="sandbox-garment-viewer-title">{t('sandbox.product.preview3d')}</h3>
              <p className="mt-2 text-sm text-muted">{t('sandbox.product.rotateInstructions')}</p>
            </div>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <FullscreenButton buttonRef={fullscreenButtonRef} isFullscreen={isFullscreen} onClick={() => void toggleFullscreen()} />
            {isFullscreen ? (
              <button
                aria-label={t('sandbox.product.viewer.close')}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-bg/75 text-text shadow-sm backdrop-blur-md motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                onClick={() => void closeViewer()}
                title={t('sandbox.product.viewer.close')}
                type="button"
              >
                <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="m18 6-12 12M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
        <div className={isFullscreen ? 'flex min-h-0 flex-1 flex-col gap-3 pt-3 lg:flex-row' : 'min-w-0'}>
          <div className={`min-w-0 ${isFullscreen ? 'flex min-h-0 flex-1 flex-col' : 'flex flex-col'}`}>
            <GarmentViewer
              artwork={artwork}
              className={isFullscreen ? 'min-h-0 flex-1' : 'mt-3 aspect-square w-full'}
              color={garmentColor}
              label={t('sandbox.product.previewLabel', { product: t('sandbox.product.products.tshirt'), view: t(`sandbox.product.views.${placement.view}`) })}
              onError={() => setViewerStatus('error')}
              onMove={updateValue}
              onProjectionError={setProjectionError}
              onReady={() => setViewerStatus('ready')}
              placement={placement}
              value={value}
              viewerRef={viewerRef}
            />
            {viewerStatus === 'loading' ? <p className="mt-3 text-sm" role="status">{t('sandbox.product.loading3d')}</p> : null}
            {viewerStatus === 'error' ? <p className="mt-3 text-sm" role="alert">{t('sandbox.product.errors.viewer')}</p> : null}
            {projectionError ? <p className="mt-3 text-sm" role="alert">{t('sandbox.product.errors.projection')}</p> : null}
            <div className="mt-3 flex shrink-0 justify-center">
              <ViewerToolbar
                autoRotate={autoRotate}
                onReset={() => viewerRef.current?.resetCamera()}
                onRotateLeft={() => viewerRef.current?.rotate(-1)}
                onRotateRight={() => viewerRef.current?.rotate(1)}
                onToggleAutoRotate={() => setAutoRotate((current) => !current)}
                onZoomIn={() => viewerRef.current?.zoom(1)}
                onZoomOut={() => viewerRef.current?.zoom(-1)}
                viewerStatus={viewerStatus}
              />
            </div>
            {!isFullscreen ? <ColorPicker onChange={updateGarmentColor} value={garmentColor} /> : null}
          </div>
          {isFullscreen ? <ColorPicker isFullscreen onChange={updateGarmentColor} value={garmentColor} /> : null}
        </div>
      </div>
    </section>
  )
}

export default ProductPreview
