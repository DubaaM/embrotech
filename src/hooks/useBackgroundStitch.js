import { useEffect } from 'react'

const SPACING = 3
const HALF_WIDTH = 4
const SEW_TIME = 120
const LIFETIME = 2000
export function createBackgroundStitch(canvas) {
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)')
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let context
  let frame = null
  let canvasRatio = null
  let stitches = []
  let points = []
  let lastTip = null
  let side = 1

  function progressAt(stitch, time) {
    if (time <= stitch.startTime) return stitch.progress
    if (time >= stitch.endTime) return 1
    return stitch.progress + (1 - stitch.progress) * (time - stitch.startTime) / (stitch.endTime - stitch.startTime)
  }

  function scheduleStitches(time) {
    const pending = stitches.filter((stitch) => progressAt(stitch, time) < 1)
    pending.forEach((stitch, index) => {
      stitch.progress = progressAt(stitch, time)
      stitch.startTime = time + SEW_TIME * index / pending.length
      stitch.endTime = time + SEW_TIME * (index + 1) / pending.length
    })
  }

  function resetPath() {
    points = []
    lastTip = null
    side = 1
  }

  function resizeCanvas() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const ratio = window.devicePixelRatio || 1
    const pixelWidth = Math.round(width * ratio)
    const pixelHeight = Math.round(height * ratio)
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight || canvasRatio !== ratio) {
      canvas.width = pixelWidth
      canvas.height = pixelHeight
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      canvasRatio = ratio
    }
    return { width, height }
  }

  function draw(time) {
    frame = null
    const { width, height } = resizeCanvas()
    context.clearRect(0, 0, width, height)
    context.lineCap = 'round'
    const styles = window.getComputedStyle(canvas)
    const color = styles.getPropertyValue('--stitch-color').trim()
    const highlight = styles.getPropertyValue('--stitch-highlight').trim()
    stitches = stitches.filter((stitch) => time - stitch.time < LIFETIME)
    for (const stitch of stitches) {
      const progress = progressAt(stitch, time)
      if (progress <= 0) continue
      const alpha = Math.max(0, 1 - (time - stitch.time) / LIFETIME)
      context.beginPath()
      context.moveTo(stitch.from.x, stitch.from.y)
      context.lineTo(
        stitch.from.x + (stitch.to.x - stitch.from.x) * progress,
        stitch.from.y + (stitch.to.y - stitch.from.y) * progress,
      )
      context.globalAlpha = alpha
      context.strokeStyle = color
      context.lineWidth = 1.6
      context.stroke()
      context.globalAlpha = alpha * 0.7
      context.strokeStyle = highlight
      context.lineWidth = 0.45
      context.stroke()
    }
    context.globalAlpha = 1

    if (stitches.length) {
      frame = window.requestAnimationFrame(draw)
    } else {
      canvas.width = 0
      canvas.height = 0
      canvasRatio = null
    }
  }

  function handleMouseMove(event) {
    const point = { x: event.clientX, y: event.clientY }
    if (!points.length) {
      points.push(point)
      return
    }

    let last = points[points.length - 1]
    let dx = point.x - last.x
    let dy = point.y - last.y
    let distance = Math.hypot(dx, dy)
    if (distance < SPACING) return
    const time = window.performance.now()

    while (distance >= SPACING) {
      const next = { x: last.x + dx / distance * SPACING, y: last.y + dy / distance * SPACING }
      const oldest = points[Math.max(0, points.length - 3)]
      const directionX = next.x - oldest.x
      const directionY = next.y - oldest.y
      const length = Math.hypot(directionX, directionY)
      const normalX = length > 0.001 ? -directionY / length : -dy / distance
      const normalY = length > 0.001 ? directionX / length : dx / distance
      if (!lastTip) {
        lastTip = { x: last.x - normalX * HALF_WIDTH, y: last.y - normalY * HALF_WIDTH }
      }
      const tip = { x: next.x + normalX * HALF_WIDTH * side, y: next.y + normalY * HALF_WIDTH * side }
      stitches.push({ from: lastTip, to: tip, time, progress: 0, startTime: time, endTime: time + SEW_TIME })
      lastTip = tip
      side *= -1
      points.push(next)
      if (points.length > 4) points.shift()
      last = next
      dx = point.x - last.x
      dy = point.y - last.y
      distance = Math.hypot(dx, dy)
    }

    scheduleStitches(time)
    if (frame === null) frame = window.requestAnimationFrame(draw)
  }

  function handleResize() {
    if (stitches.length) resizeCanvas()
  }

  function stop() {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('resize', handleResize)
    document.removeEventListener('mouseleave', resetPath)
    document.removeEventListener('mouseenter', resetPath)
    if (frame !== null) window.cancelAnimationFrame(frame)
    frame = null
    stitches = []
    resetPath()
    canvas.width = 0
    canvas.height = 0
    canvasRatio = null
  }

  function configure() {
    stop()
    if (!pointer.matches || motion.matches) return
    context = canvas.getContext('2d')
    if (!context) {
      console.error('Could not create the background stitch canvas.')
      return
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)
    document.addEventListener('mouseleave', resetPath)
    document.addEventListener('mouseenter', resetPath)
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

function useBackgroundStitch(canvasRef) {
  useEffect(() => createBackgroundStitch(canvasRef.current), [canvasRef])
}

export default useBackgroundStitch
