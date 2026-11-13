import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Lightbox from '../Lightbox'

function PhotoGallery({ example, title }) {
  const { t } = useTranslation()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isPhotoVisible, setIsPhotoVisible] = useState(true)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0)
  const [trigger, setTrigger] = useState(null)
  const [failedPhotoSource, setFailedPhotoSource] = useState(null)
  const selectedPhoto = example.photos[selectedIndex]
  const selectedAngle = selectedPhoto?.angleKey || 'front'
  const isImageUnavailable =
    !selectedPhoto?.src || selectedPhoto.src === failedPhotoSource
  const lightboxPhotos = example.photos.map((photo) => {
    const angle = t(`examples.angles.${photo.angleKey}`)
    return {
      src: photo.src,
      alt: t('examples.photoAlt', { title, angle }),
      caption: `${title} — ${angle}`,
    }
  })

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsPhotoVisible(true))
    return () => window.cancelAnimationFrame(frame)
  }, [selectedIndex])

  function changePhoto(index) {
    if (example.photos.length === 0) {
      return
    }

    setIsPhotoVisible(false)
    setSelectedIndex((index + example.photos.length) % example.photos.length)
  }

  function handleKeyDown(event) {
    if (isLightboxOpen) {
      return
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      changePhoto(selectedIndex - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      changePhoto(selectedIndex + 1)
    }
  }

  function handleTouchStart(event) {
    if (isLightboxOpen) {
      return
    }

    event.currentTarget.dataset.touchStartX = String(event.touches[0].clientX)
  }

  function handleTouchEnd(event) {
    if (isLightboxOpen) {
      return
    }

    const touchStartX = Number(event.currentTarget.dataset.touchStartX)
    const swipeDistance = event.changedTouches[0].clientX - touchStartX

    if (Math.abs(swipeDistance) >= 40) {
      changePhoto(selectedIndex + (swipeDistance < 0 ? 1 : -1))
    }

    delete event.currentTarget.dataset.touchStartX
  }

  function openLightbox(event) {
    setTrigger(event.currentTarget)
    setLightboxStartIndex(selectedIndex)
    setIsLightboxOpen(true)
  }

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false)
  }, [])

  const hasMultiplePhotos = example.photos.length > 1

  return (
    <section
      aria-label={t('examples.gallery.label', { title })}
      aria-roledescription="carousel"
      className="min-w-0"
      onKeyDown={handleKeyDown}
      onTouchEnd={handleTouchEnd}
      onTouchStart={handleTouchStart}
      role="group"
    >
      <div className="group/photo stitch-frame relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-bg">
        <button
          aria-label={t('examples.openPhoto', {
            title,
            angle: t(`examples.angles.${selectedAngle}`),
          })}
          className="block size-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          onClick={openLightbox}
          disabled={isImageUnavailable}
          type="button"
        >
          {isImageUnavailable ? (
            <span aria-hidden="true" className="block size-full bg-surface" />
          ) : (
            <img
              alt={t('examples.photoAlt', {
                title,
                angle: t(`examples.angles.${selectedPhoto.angleKey}`),
              })}
              className={`size-full object-cover motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none ${
                isPhotoVisible ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              onError={() => setFailedPhotoSource(selectedPhoto.src)}
              src={selectedPhoto.src}
            />
          )}
        </button>

        {hasMultiplePhotos && (
          <>
            <button
              aria-label={t('examples.gallery.previous')}
              className="absolute left-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:size-9"
              onClick={() => changePhoto(selectedIndex - 1)}
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
                  d="m15 18-6-6 6-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
            <button
              aria-label={t('examples.gallery.next')}
              className="absolute right-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:size-9"
              onClick={() => changePhoto(selectedIndex + 1)}
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
                  d="m9 18 6-6-6-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
            <span
              aria-hidden="true"
              className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-2 py-1 text-xs text-white"
            >
              {t('examples.gallery.photoCounter', {
                current: selectedIndex + 1,
                total: example.photos.length,
              })}
            </span>
          </>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {t('examples.gallery.photoAnnouncement', {
          current: selectedIndex + 1,
          total: example.photos.length,
        })}
      </p>

      <Lightbox
        captionId={`example-lightbox-${example.id}-caption`}
        key={`${example.id}-${lightboxStartIndex}`}
        labels={{
          close: t('examples.lightbox.close'),
          counter: (current, total) =>
            t('examples.lightbox.counter', { current, total }),
          next: t('examples.lightbox.next'),
          previous: t('examples.lightbox.previous'),
        }}
        onClose={closeLightbox}
        onIndexChange={setSelectedIndex}
        photos={lightboxPhotos}
        startIndex={lightboxStartIndex}
        isOpen={isLightboxOpen}
        trigger={trigger}
      />
    </section>
  )
}

export default PhotoGallery
