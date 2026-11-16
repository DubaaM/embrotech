import { useEffect } from 'react'
import useScrollReveal from '../../hooks/useScrollReveal'

function useAboutMotion(pageRef) {
  useScrollReveal(pageRef)

  useEffect(() => {
    const page = pageRef.current
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const stitches = page.querySelector('.about-stitches')
    let frame = 0

    function updateStitches() {
      frame = 0
      const pageBounds = page.getBoundingClientRect()
      const top = `${Math.max(0, pageBounds.top + window.scrollY)}px`
      if (page.style.getPropertyValue('--stitch-top') !== top) {
        page.style.setProperty('--stitch-top', top)
      }
      if (motion.matches) return

      const bounds = stitches.getBoundingClientRect()
      const anchor = window.innerHeight * 0.55
      const initialProgress = Math.max(0, Math.min(1, (anchor - bounds.top) / Math.max(bounds.height, 1)))
      const endProgress = Math.max(0, Math.min(1, 1 - (bounds.bottom - window.innerHeight) / (window.innerHeight - anchor)))
      const progress = initialProgress + (1 - initialProgress) * endProgress
      page.style.setProperty('--stitch-progress', `${progress * 100}%`)
    }

    function scheduleStitches() {
      if (!frame) {
        frame = window.requestAnimationFrame(updateStitches)
      }
    }

    function stopMotion() {
      window.removeEventListener('scroll', scheduleStitches)
      window.removeEventListener('resize', scheduleStitches)
      window.cancelAnimationFrame(frame)
      frame = 0
      page.style.removeProperty('--stitch-progress')
      page.style.removeProperty('--stitch-top')
    }

    function configureMotion() {
      stopMotion()
      updateStitches()
      window.addEventListener('resize', scheduleStitches)
      if (motion.matches) return

      window.addEventListener('scroll', scheduleStitches, { passive: true })
    }

    configureMotion()
    motion.addEventListener('change', configureMotion)
    return () => {
      motion.removeEventListener('change', configureMotion)
      stopMotion()
    }
  }, [pageRef])
}

export default useAboutMotion
