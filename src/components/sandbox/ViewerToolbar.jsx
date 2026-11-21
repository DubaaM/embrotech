import { useTranslation } from 'react-i18next'

const buttonClass = 'inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-bg/75 text-text shadow-sm backdrop-blur-md motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50'

function ViewerToolbar({ autoRotate, onReset, onRotateLeft, onRotateRight, onToggleAutoRotate, onZoomIn, onZoomOut, viewerStatus }) {
  const { t } = useTranslation()
  const actions = [
    { label: t('sandbox.product.viewer.resetCamera'), icon: <path d="M20 11a8 8 0 0 0-14.9-4L3 10m0-6v6h6m-5 3a8 8 0 0 0 14.9 4L21 14m0 6v-6h-6" />, onClick: onReset },
    { label: t('sandbox.product.rotateLeft'), icon: <path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-2" />, onClick: onRotateLeft },
    { label: t('sandbox.product.rotateRight'), icon: <path d="m15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h2" />, onClick: onRotateRight },
    { label: autoRotate ? t('sandbox.product.viewer.stopAutoRotate') : t('sandbox.product.viewer.startAutoRotate'), icon: <path d="M20 11a8 8 0 0 0-14.9-4L3 10m0-6v6h6m-5 3a8 8 0 0 0 14.9 4L21 14m0 6v-6h-6" />, onClick: onToggleAutoRotate, pressed: autoRotate },
    { label: t('sandbox.product.zoomIn'), icon: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4M10.5 7.5v6M7.5 10.5h6" /></>, onClick: onZoomIn },
    { label: t('sandbox.product.zoomOut'), icon: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4M7.5 10.5h6" /></>, onClick: onZoomOut },
  ]

  return (
    <div aria-label={t('sandbox.product.viewer.toolbarLabel')} className="glass-strong mx-auto flex max-w-full items-center justify-center gap-1.5 overflow-x-auto rounded-full border border-border p-2 shadow-lg sm:gap-2" role="group">
      {actions.map(({ icon, label, onClick, pressed }) => (
        <button
          aria-label={label}
          aria-pressed={pressed}
          className={`${buttonClass} ${pressed ? 'border-brand ring-2 ring-brand/40' : ''}`}
          disabled={viewerStatus !== 'ready'}
          key={label}
          onClick={onClick}
          title={label}
          type="button"
        >
          <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            {icon}
          </svg>
        </button>
      ))}
    </div>
  )
}

export default ViewerToolbar
