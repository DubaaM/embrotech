import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ImageLightbox from '../components/Lightbox'
import CtaSection from '../components/production/CtaSection'
import MachineSection from '../components/production/MachineSection'
import ProductionHero from '../components/production/ProductionHero'
import productionMachines from '../data/productionMachines'
import useScrollReveal from '../hooks/useScrollReveal'
import '../components/production/production.css'

function ProductionPage() {
  const { t } = useTranslation()
  const pageRef = useRef(null)
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [trigger, setTrigger] = useState(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  useScrollReveal(pageRef)

  const closeLightbox = useCallback(() => setIsLightboxOpen(false), [])

  function openImage(machine, button) {
    setSelectedMachine(machine)
    setTrigger(button)
    setIsLightboxOpen(true)
  }

  return (
    <div className="production-page" ref={pageRef}>
      <div className="production-inner">
        <ProductionHero />
        <div className="production-machines">
          {productionMachines.map((machine, index) => (
            <MachineSection key={machine.id} machine={machine} onOpenImage={openImage} reversed={index % 2 === 1} />
          ))}
        </div>
        <CtaSection />
      </div>
      <ImageLightbox
        captionId="production-lightbox-caption"
        isOpen={isLightboxOpen}
        labels={{ close: t('production.closePhoto') }}
        onClose={closeLightbox}
        photos={selectedMachine ? [{ src: selectedMachine.image, alt: t(selectedMachine.alt), caption: t(selectedMachine.name) }] : []}
        trigger={trigger}
      />
    </div>
  )
}

export default ProductionPage
