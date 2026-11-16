import { useEffect } from 'react'

function useScrollReveal(containerRef) {
  useEffect(() => {
    const container = containerRef.current
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const reveals = container.querySelectorAll('[data-reveal]')
    let observer

    function stopReveals() {
      observer?.disconnect()
      container.classList.remove('scroll-reveal-ready')
    }

    function configureReveals() {
      stopReveals()
      if (motion.matches || !('IntersectionObserver' in window)) return

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      }, { threshold: 0.1 })

      reveals.forEach((element) => {
        const bounds = element.getBoundingClientRect()
        if (bounds.top < window.innerHeight && bounds.bottom > 0) {
          element.classList.add('is-visible')
        } else {
          observer.observe(element)
        }
      })
      container.classList.add('scroll-reveal-ready')
    }

    configureReveals()
    motion.addEventListener('change', configureReveals)
    return () => {
      motion.removeEventListener('change', configureReveals)
      stopReveals()
    }
  }, [containerRef])
}

export default useScrollReveal
