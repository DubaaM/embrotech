import { useEffect } from 'react'

const STITCH_SPACING = 14
const STITCH_LENGTH = 9
const STITCH_LIFETIME = 1600

export function createStitchTrail(card, canvas) {
  const pointer = window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)')
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let context
  let frame = null
  let stitches = []
  let previousPoint = null
  let distanceSinceStitch = 0

  function resizeCanvas() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const pixelRatio = window.devicePixelRatio || 1
    const pixelWidth = Math.round(width * pixelRatio)
    const pixelHeight = Math.round(height * pixelRatio)

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth
      canvas.height = pixelHeight
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    return { width, height }
  }

  function draw(time) {
    frame = null
    const { width, height } = resizeCanvas()
    context.clearRect(0, 0, width, height)
    stitches = stitches.filter((stitch) => time - stitch.time < STITCH_LIFETIME)
    context.strokeStyle = '#D4621A'
    context.lineWidth = 1.6
    context.lineCap = 'round'

    stitches.forEach((stitch) => {
      context.globalAlpha = Math.max(0, 1 - (time - stitch.time) / STITCH_LIFETIME)
      context.beginPath()
      context.moveTo(
        stitch.x - stitch.dx * STITCH_LENGTH / 2,
        stitch.y - stitch.dy * STITCH_LENGTH / 2,
      )
      context.lineTo(
        stitch.x + stitch.dx * STITCH_LENGTH / 2,
        stitch.y + stitch.dy * STITCH_LENGTH / 2,
      )
      context.stroke()
    })
    context.globalAlpha = 1

    if (stitches.length > 0) {
      frame = window.requestAnimationFrame(draw)
    } else {
      canvas.width = 0
      canvas.height = 0
    }
  }

  function handlePointerMove(event) {
    if (event.pointerType !== 'mouse') return

    const bounds = canvas.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return

    const point = {
      x: (event.clientX - bounds.left) * canvas.clientWidth / bounds.width,
      y: (event.clientY - bounds.top) * canvas.clientHeight / bounds.height,
    }

    if (previousPoint) {
      const dx = point.x - previousPoint.x
      const dy = point.y - previousPoint.y
      const length = Math.hypot(dx, dy)

      if (length > 0) {
        const directionX = dx / length
        const directionY = dy / length
        const time = window.performance.now()

        for (let distance = STITCH_SPACING - distanceSinceStitch; distance <= length; distance += STITCH_SPACING) {
          stitches.push({
            x: previousPoint.x + directionX * distance,
            y: previousPoint.y + directionY * distance,
            dx: directionX,
            dy: directionY,
            time,
          })
        }

        distanceSinceStitch = (distanceSinceStitch + length) % STITCH_SPACING
        if (stitches.length && frame === null) {
          frame = window.requestAnimationFrame(draw)
        }
      }
    }

    previousPoint = point
  }

  function handlePointerLeave() {
    previousPoint = null
    distanceSinceStitch = 0
  }

  function stop() {
    card.removeEventListener('pointermove', handlePointerMove)
    card.removeEventListener('pointerleave', handlePointerLeave)
    window.cancelAnimationFrame(frame)
    frame = null
    stitches = []
    previousPoint = null
    distanceSinceStitch = 0
    canvas.width = 0
    canvas.height = 0
  }

  function configure() {
    stop()
    if (!pointer.matches || motion.matches) return

    context = canvas.getContext('2d')
    if (!context) {
      console.error('Could not create the glass card stitch canvas.')
      return
    }

    card.addEventListener('pointermove', handlePointerMove)
    card.addEventListener('pointerleave', handlePointerLeave)
  }

  pointer.addEventListener('change', configure)
  motion.addEventListener('change', configure)
  configure()

  return () => {
    pointer.removeEventListener('change', configure)
    motion.removeEventListener('change', configure)
    stop()
  }
}

function useStitchTrail(cardRef, canvasRef, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined
    return createStitchTrail(cardRef.current, canvasRef.current)
  }, [cardRef, canvasRef, enabled])
}

export default useStitchTrail
