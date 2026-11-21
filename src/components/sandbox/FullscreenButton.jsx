import { useTranslation } from 'react-i18next'

function FullscreenButton({ buttonRef, isFullscreen, onClick }) {
  const { t } = useTranslation()
  const label = t(isFullscreen ? 'sandbox.product.viewer.exitFullscreen' : 'sandbox.product.viewer.fullscreen')

  return (
    <button
      aria-label={label}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-bg/75 text-text shadow-sm backdrop-blur-md motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      onClick={onClick}
      ref={buttonRef}
      title={label}
      type="button"
    >
      {isFullscreen ? (
        <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M8 3v5H3M16 3v5h5M8 21v-5H3m13 5v-5h5" />
        </svg>
      ) : (
        <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />
        </svg>
      )}
    </button>
  )
}

export default FullscreenButton
