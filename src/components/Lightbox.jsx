import { useCallback, useEffect, useRef, useState } from 'react'
import './Lightbox.css'

function Lightbox({
  photos,
  startIndex = 0,
  isOpen,
  onClose,
  onIndexChange,
  trigger,
  labels,
  captionId = 'lightbox-caption',
}) {
  const closeButtonRef = useRef(null)
  const previousButtonRef = useRef(null)
  const nextButtonRef = useRef(null)
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const [failedPhotoSource, setFailedPhotoSource] = useState(null)
  const currentPhoto = photos[currentIndex]
  const isImageUnavailable =
    !currentPhoto?.src || currentPhoto.src === failedPhotoSource
  const activeLabels = labels || {}
  const showPhoto = useCallback((index) => {
    const nextIndex = (index + photos.length) % photos.length
    setCurrentIndex(nextIndex)
    onIndexChange?.(nextIndex)
  }, [onIndexChange, photos.length])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowLeft' && photos.length > 1) {
        event.preventDefault()
        showPhoto(currentIndex - 1)
      } else if (event.key === 'ArrowRight' && photos.length > 1) {
        event.preventDefault()
        showPhoto(currentIndex + 1)
      } else if (event.key === 'Tab') {
        const buttons = [
          closeButtonRef.current,
          ...(photos.length > 1
            ? [previousButtonRef.current, nextButtonRef.current]
            : []),
        ].filter(Boolean)
        const firstButton = buttons[0]
        const lastButton = buttons[buttons.length - 1]

        if (event.shiftKey && document.activeElement === firstButton) {
          event.preventDefault()
          lastButton.focus()
        } else if (
          !event.shiftKey &&
          document.activeElement === lastButton
        ) {
          event.preventDefault()
          firstButton.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentIndex, isOpen, onClose, photos.length, showPhoto])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      trigger?.focus()
    }
  }, [isOpen, trigger])

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      aria-hidden={!isOpen}
      aria-labelledby={captionId}
      aria-modal="true"
      className="lightbox fixed inset-0 z-[100] flex items-center justify-center bg-bg/95 p-4"
      data-open={isOpen}
      inert={!isOpen}
      onClick={handleBackdropClick}
      role="dialog"
    >
      {currentPhoto && (
        <div className="lightbox-content relative flex max-h-full w-full max-w-6xl items-center justify-center gap-2 sm:gap-6">
          <button
            aria-label={activeLabels.previous}
            className={`glass inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              photos.length > 1 ? '' : 'invisible'
            }`}
            onClick={() => showPhoto(currentIndex - 1)}
            ref={previousButtonRef}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M15 18l-6-6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>

          <div className="relative flex max-h-full min-w-0 flex-1 flex-col items-center">
            <button
              aria-label={activeLabels.close}
              className="glass absolute -top-12 right-0 inline-flex size-10 items-center justify-center rounded-full border border-border text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              onClick={onClose}
              ref={closeButtonRef}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
            <figure className="flex max-h-[85vh] w-full flex-col items-center">
              {isImageUnavailable ? (
                <div
                  aria-hidden="true"
                  className="aspect-[4/3] w-full max-w-4xl rounded-lg bg-surface"
                />
              ) : (
                <img
                  alt={currentPhoto.alt}
                  className="max-h-[75vh] max-w-full rounded-lg object-contain"
                  loading="lazy"
                  onError={() => setFailedPhotoSource(currentPhoto.src)}
                  src={currentPhoto.src}
                />
              )}
              <figcaption className="mt-4 text-center text-text" id={captionId}>
                {currentPhoto.caption}
              </figcaption>
              {photos.length > 1 && (
                <p className="mt-2 text-sm text-muted">
                  {activeLabels.counter?.(currentIndex + 1, photos.length)}
                </p>
              )}
            </figure>
          </div>

          <button
            aria-label={activeLabels.next}
            className={`glass inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              photos.length > 1 ? '' : 'invisible'
            }`}
            onClick={() => showPhoto(currentIndex + 1)}
            ref={nextButtonRef}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M9 18l6-6-6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default Lightbox
