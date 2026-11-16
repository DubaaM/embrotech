import { useRef } from 'react'
import useStitchTrail from '../../hooks/useStitchTrail'
import './about.css'

function GlassCard({ as: Element = 'div', children, className = '', surfaceClassName = 'about-glass', stitchTrail = true, onPointerMove, onPointerLeave, ...props }) {
  const cardRef = useRef(null)
  const canvasRef = useRef(null)
  useStitchTrail(cardRef, canvasRef, stitchTrail)

  function handlePointerMove(event) {
    if (event.pointerType === 'mouse' && window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) {
      const card = event.currentTarget
      const bounds = card.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width))
      const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height))
      card.style.setProperty('--light-x', `${x * 100}%`)
      card.style.setProperty('--light-y', `${y * 100}%`)
      card.style.setProperty('--tilt-x', `${(0.5 - y) * 6}deg`)
      card.style.setProperty('--tilt-y', `${(x - 0.5) * 6}deg`)
    }
    onPointerMove?.(event)
  }

  function handlePointerLeave(event) {
    const style = event.currentTarget.style
    style.removeProperty('--light-x')
    style.removeProperty('--light-y')
    style.removeProperty('--tilt-x')
    style.removeProperty('--tilt-y')
    onPointerLeave?.(event)
  }

  return (
    <Element className={`interactive-glass ${surfaceClassName} ${className}`} ref={cardRef} onPointerLeave={handlePointerLeave} onPointerMove={handlePointerMove} {...props}>
      {children}
      {stitchTrail && <canvas aria-hidden="true" className="about-glass-stitches" height="0" ref={canvasRef} width="0" />}
    </Element>
  )
}

export default GlassCard
