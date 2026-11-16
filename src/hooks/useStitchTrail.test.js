import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { createStitchTrail } from './useStitchTrail.js'

const originalWindow = globalThis.window

afterEach(() => {
  if (originalWindow === undefined) {
    delete globalThis.window
  } else {
    globalThis.window = originalWindow
  }
})

function createMedia(matches) {
  const listeners = new Set()
  return {
    matches,
    addEventListener(_type, listener) { listeners.add(listener) },
    removeEventListener(_type, listener) { listeners.delete(listener) },
    setMatches(value) {
      this.matches = value
      listeners.forEach((listener) => listener())
    },
    listeners,
  }
}

function createHarness({ finePointer = true, reducedMotion = false } = {}) {
  const pointer = createMedia(finePointer)
  const motion = createMedia(reducedMotion)
  const handlers = new Map()
  const frames = new Map()
  const lines = []
  const transforms = []
  let nextFrame = 0
  let now = 0
  let start
  const context = {
    setTransform(...args) { transforms.push(args) },
    clearRect() {},
    beginPath() {},
    moveTo(x, y) { start = { x, y } },
    lineTo(x, y) { this.end = { x, y } },
    stroke() {
      lines.push({ start, end: this.end, alpha: this.globalAlpha, color: this.strokeStyle, width: this.lineWidth })
    },
  }
  const card = {
    addEventListener(type, handler) { handlers.set(type, handler) },
    removeEventListener(type, handler) {
      if (handlers.get(type) === handler) handlers.delete(type)
    },
  }
  const canvas = {
    width: 0,
    height: 0,
    clientWidth: 200,
    clientHeight: 100,
    getBoundingClientRect: () => ({ left: 10, top: 20, width: 200, height: 100 }),
    getContext: () => context,
  }
  globalThis.window = {
    devicePixelRatio: 2,
    performance: { now: () => now },
    matchMedia(query) {
      if (query.includes('reduced-motion')) return motion
      assert.equal(query, '(min-width: 768px) and (hover: hover) and (pointer: fine)')
      return pointer
    },
    requestAnimationFrame(callback) {
      nextFrame += 1
      frames.set(nextFrame, callback)
      return nextFrame
    },
    cancelAnimationFrame(id) { frames.delete(id) },
  }
  const cleanup = createStitchTrail(card, canvas)

  return {
    canvas,
    cleanup,
    frames,
    handlers,
    lines,
    motion,
    pointer,
    transforms,
    move(x, y, pointerType = 'mouse') {
      handlers.get('pointermove')?.({ clientX: x + 10, clientY: y + 20, pointerType })
    },
    step(time) {
      now = time
      lines.length = 0
      const pending = [...frames.values()]
      frames.clear()
      pending.forEach((callback) => callback(time))
    },
  }
}

test('draws spaced directional stitches that fade and adapt to device pixel ratio', () => {
  const trail = createHarness()
  trail.move(0, 10)
  trail.move(10, 10)
  assert.equal(trail.frames.size, 0)
  trail.move(35, 10)
  trail.step(0)
  assert.deepEqual(trail.lines.map(({ start, end }) => [start.x, end.x]), [[9.5, 18.5], [23.5, 32.5]])
  assert.ok(trail.lines.every((line) => line.color === '#D4621A' && line.width === 1.6 && line.alpha === 1))
  assert.deepEqual(trail.transforms.at(-1), [2, 0, 0, 2, 0, 0])
  assert.equal(trail.canvas.width, 400)
  assert.equal(trail.canvas.height, 200)

  globalThis.window.devicePixelRatio = 3
  trail.step(800)
  assert.ok(trail.lines.every((line) => line.alpha === 0.5))
  assert.equal(trail.canvas.width, 600)
  trail.step(1600)
  assert.equal(trail.lines.length, 0)
  assert.equal(trail.frames.size, 0)
  assert.equal(trail.canvas.width, 0)
  trail.cleanup()
})

test('does not connect separate pointer visits or draw for touch input', () => {
  const trail = createHarness()
  trail.move(0, 0, 'touch')
  trail.move(50, 0, 'touch')
  assert.equal(trail.frames.size, 0)
  trail.move(0, 0)
  trail.move(14, 0)
  trail.handlers.get('pointerleave')()
  trail.move(100, 50)
  trail.move(100, 64)
  trail.step(0)
  assert.equal(trail.lines.length, 2)
  assert.deepEqual(trail.lines[0].start, { x: 9.5, y: 0 })
  assert.deepEqual(trail.lines[1].start, { x: 100, y: 59.5 })
  assert.deepEqual(trail.lines[1].end, { x: 100, y: 68.5 })
  trail.cleanup()
})

test('disables and cleans up the trail for coarse pointers and reduced motion', () => {
  const trail = createHarness({ finePointer: false })
  assert.equal(trail.handlers.size, 0)
  trail.pointer.setMatches(true)
  trail.move(0, 0)
  trail.move(28, 0)
  assert.equal(trail.frames.size, 1)
  trail.motion.setMatches(true)
  assert.equal(trail.frames.size, 0)
  assert.equal(trail.handlers.size, 0)
  assert.equal(trail.canvas.width, 0)
  trail.motion.setMatches(false)
  assert.ok(trail.handlers.has('pointermove'))
  trail.cleanup()
  assert.equal(trail.handlers.size, 0)
  assert.equal(trail.pointer.listeners.size, 0)
  assert.equal(trail.motion.listeners.size, 0)
})
