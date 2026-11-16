import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import GlassCard from './GlassCard'

function StatCounter({ value, label }) {
  const { i18n } = useTranslation()
  const locale = i18n.resolvedLanguage
  const formattedValue = new Intl.NumberFormat(locale).format(value)
  const countRef = useRef(null)

  useEffect(() => {
    const element = countRef.current
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches || !('IntersectionObserver' in window)) return undefined

    const formatter = new Intl.NumberFormat(locale)
    let frame = 0
    let startTime
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      function tick(time) {
        if (startTime === undefined) startTime = time
        const progress = Math.min((time - startTime) / 1200, 1)
        const eased = 1 - (1 - progress) ** 3
        element.textContent = formatter.format(Math.round(value * eased))
        if (progress < 1) frame = window.requestAnimationFrame(tick)
      }
      frame = window.requestAnimationFrame(tick)
    }, { threshold: 0.25 })

    function handleMotionChange() {
      if (motion.matches) {
        observer.disconnect()
        window.cancelAnimationFrame(frame)
        element.textContent = formattedValue
      }
    }

    observer.observe(element)
    motion.addEventListener('change', handleMotionChange)
    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(frame)
      motion.removeEventListener('change', handleMotionChange)
    }
  }, [formattedValue, locale, value])

  return (
    <GlassCard as="div" className="about-stat">
      <p className="about-stat-number">
        <span aria-hidden="true" ref={countRef}>{formattedValue}</span>
        <span className="sr-only">{formattedValue}</span>
      </p>
      <p className="about-stat-label">{label}</p>
    </GlassCard>
  )
}

export default StatCounter
