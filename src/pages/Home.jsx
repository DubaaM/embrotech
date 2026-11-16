import { useRef } from 'react'
import ContactCta from '../components/home/ContactCta'
import Hero from '../components/home/Hero'
import MachineGallery from '../components/home/MachineGallery'
import useScrollReveal from '../hooks/useScrollReveal'

function Home() {
  const pageRef = useRef(null)
  useScrollReveal(pageRef)

  return (
    <div ref={pageRef}>
      <Hero />
      <MachineGallery />
      <ContactCta />
    </div>
  )
}

export default Home
