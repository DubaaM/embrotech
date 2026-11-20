import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import machinePhotos from '../../data/machine'
import GlassCard from '../about/GlassCard'
import Lightbox from '../Lightbox'

function MachineGallery() {
  const { t } = useTranslation()
  const { language } = useParams()
  const [selectedImage, setSelectedImage] = useState(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [trigger, setTrigger] = useState(null)

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false)
  }, [])

  function openLightbox(image, event) {
    setTrigger(event.currentTarget)
    setSelectedImage(image)
    setIsLightboxOpen(true)
  }

  return (
    <section
      aria-labelledby="machine-gallery-title"
      className="px-4 py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center" data-reveal>
          <h2
            className="text-3xl font-bold tracking-tight text-text sm:text-4xl"
            id="machine-gallery-title"
          >
            {t('home.gallery.title')}
          </h2>
          <p className="mt-4 text-lg leading-7 text-muted">
            {t('home.gallery.description')}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-6 lg:mt-12 lg:grid-cols-3">
          {machinePhotos.map((image, index) => (
            <div className="min-w-0" data-reveal key={image.id} style={{ '--reveal-order': index % 3 }}>
              <GlassCard as="figure" className="home-gallery-card rounded-2xl p-2" surfaceClassName="glass">
                <button
                  aria-label={t('home.gallery.openPhoto', {
                    caption: t(image.captionKey),
                  })}
                  className="group block w-full overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  onClick={(event) => openLightbox(image, event)}
                  type="button"
                >
                  <img
                    alt={t(image.altKey)}
                    className="block aspect-[4/3] w-full object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:scale-[1.02] motion-reduce:transition-none"
                    decoding="async"
                    loading="lazy"
                    src={image.src}
                  />
                </button>
              </GlassCard>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center" data-reveal>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border bg-surface px-6 py-3 font-semibold text-text motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:hover:shadow-md motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            to={`/${language}/examples`}
          >
            {t('home.gallery.allExamples')}
          </Link>
        </div>
      </div>

      <Lightbox
        captionId="machine-lightbox-caption"
        labels={{
          close: t('home.gallery.closeLightbox'),
          next: t('examples.lightbox.next'),
          previous: t('examples.lightbox.previous'),
        }}
        photos={
          selectedImage
            ? [
                {
                  src: selectedImage.src,
                  alt: t(selectedImage.altKey),
                  caption: t(selectedImage.captionKey),
                },
              ]
            : []
        }
        isOpen={isLightboxOpen}
        onClose={closeLightbox}
        trigger={trigger}
      />
    </section>
  )
}

export default MachineGallery
