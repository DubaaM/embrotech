import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { createBackgroundStitch } from './useBackgroundStitch.js'

const originalWindow = globalThis.window
const originalDocument = globalThis.document

afterEach(() => {
  if (originalWindow === undefined) delete globalThis.window
  else globalThis.window = originalWindow
  if (originalDocument === undefined) delete globalThis.document
  else globalThis.document = originalDocument
})

function media(matches) {
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

function createHarness({ hover = true, reducedMotion = false } = {}) {
  const pointer = media(hover)
  const motion = media(reducedMotion)
  const handlers = new Map()
  const documentHandlers = new Map()
  const frames = new Map()
  const lines = []
  const transforms = []
  let now = 0
  let nextFrame = 0
  let start
  const context = {
    setTransform(...args) { transforms.push(args) },
    clearRect() {},
    beginPath() {},
    moveTo(x, y) { start = { x, y } },
    lineTo(x, y) { this.end = { x, y } },
    stroke() { lines.push({ start, end: this.end, alpha: this.globalAlpha, color: this.strokeStyle, width: this.lineWidth }) },
  }
  const canvas = {
    width: 0,
    height: 0,
    clientWidth: 140,
    clientHeight: 70,
    getContext: () => context,
  }
  globalThis.document = {
    addEventListener(type, handler) { documentHandlers.set(type, handler) },
    removeEventListener(type) { documentHandlers.delete(type) },
  }
  globalThis.window = {
    devicePixelRatio: 2,
    performance: { now: () => now },
    getComputedStyle: () => ({
      getPropertyValue: (name) => name === '--stitch-color' ? '#D4621A' : '#F6AE78',
    }),
    addEventListener(type, handler) { handlers.set(type, handler) },
    removeEventListener(type) { handlers.delete(type) },
    matchMedia(query) {
      if (query.includes('reduced-motion')) return motion
      assert.equal(query, '(hover: hover) and (pointer: fine)')
      return pointer
    },
    requestAnimationFrame(callback) {
      frames.set(++nextFrame, callback)
      return nextFrame
    },
    cancelAnimationFrame(id) { frames.delete(id) },
  }
  const cleanup = createBackgroundStitch(canvas)
  return {
    canvas, cleanup, documentHandlers, frames, handlers, lines, motion, pointer, transforms,
    move(x, y, target = {}) {
      handlers.get('mousemove')?.({ clientX: x, clientY: y, target })
    },
    step(time) {
      now = time
      lines.length = 0
      const pending = [...frames.values()]
      frames.clear()
      pending.forEach((callback) => callback(time))
    },
    setTime(time) { now = time },
  }
}

test('samples every 3px and sews a connected 8px zigzag in sequence', () => {
  const trail = createHarness()
  trail.move(10, 20)
  trail.move(12, 20)
  assert.equal(trail.frames.size, 0)
  trail.move(19, 20)
  trail.step(20)
  assert.deepEqual(trail.lines[0].start, { x: 10, y: 16 })
  assert.deepEqual(trail.lines[0].end, { x: 11.5, y: 20 })
  assert.equal(trail.lines.length, 2)
  assert.equal(trail.lines[0].color, '#D4621A')
  assert.equal(trail.lines[1].color, '#F6AE78')
  assert.deepEqual(trail.transforms.at(-1), [2, 0, 0, 2, 0, 0])
  trail.step(120)
  const segments = trail.lines.filter((line) => line.color === '#D4621A')
  assert.deepEqual(segments.map(({ start, end }) => [start, end]), [
    [{ x: 10, y: 16 }, { x: 13, y: 24 }],
    [{ x: 13, y: 24 }, { x: 16, y: 16 }],
    [{ x: 16, y: 16 }, { x: 19, y: 24 }],
  ])
  trail.cleanup()
})

test('smooths the direction around bends and keeps the ribbon connected', () => {
  const trail = createHarness()
  trail.move(10, 10)
  trail.move(19, 10)
  trail.move(19, 19)
  trail.step(120)
  const segments = trail.lines.filter((line) => line.color === '#D4621A')
  assert.equal(segments.length, 6)
  segments.slice(1).forEach((line, index) => assert.deepEqual(line.start, segments[index].end))
  assert.ok(segments[3].end.x > 19 && segments[3].end.x < 23)
  assert.ok(segments[3].end.y < 13 && segments[3].end.y > 9)
  assert.deepEqual(segments[5].end, { x: 23, y: 19 })
  trail.cleanup()
})

test('fades from older stitches, adapts to pixel ratio, and stops when empty', () => {
  const trail = createHarness()
  trail.move(10, 20)
  trail.move(13, 20)
  trail.step(500)
  trail.move(16, 20)
  globalThis.window.devicePixelRatio = 3
  trail.step(1000)
  const segments = trail.lines.filter((line) => line.color === '#D4621A')
  assert.equal(segments[0].alpha, 0.5)
  assert.equal(segments[1].alpha, 0.75)
  assert.equal(trail.canvas.width, 420)
  trail.step(2000)
  assert.equal(trail.lines.filter((line) => line.color === '#D4621A').length, 1)
  trail.step(2500)
  assert.equal(trail.frames.size, 0)
  assert.equal(trail.canvas.width, 0)
  trail.cleanup()
})

test('keeps the path connected over content and after stitches have faded', () => {
  const trail = createHarness()
  trail.move(10, 20, { tagName: 'DIV' })
  trail.move(13, 20, { tagName: 'BUTTON' })
  trail.move(16, 20, { tagName: 'IMG' })
  trail.move(19, 20, { tagName: 'NAV' })
  trail.step(120)
  let segments = trail.lines.filter((line) => line.color === '#D4621A')
  assert.equal(segments.length, 3)
  segments.slice(1).forEach((line, index) => assert.deepEqual(line.start, segments[index].end))
  const lastEnd = segments.at(-1).end
  trail.step(2000)
  assert.equal(trail.frames.size, 0)
  trail.move(22, 20, { tagName: 'P' })
  trail.step(2120)
  segments = trail.lines.filter((line) => line.color === '#D4621A')
  assert.deepEqual(segments[0].start, lastEnd)
  trail.cleanup()
})

test('disables and clears stitches when hover or motion preferences change', () => {
  const trail = createHarness({ hover: false })
  assert.equal(trail.handlers.size, 0)
  trail.pointer.setMatches(true)
  trail.move(10, 20)
  trail.move(13, 20)
  trail.motion.setMatches(true)
  assert.equal(trail.frames.size, 0)
  assert.equal(trail.handlers.size, 0)
  assert.equal(trail.documentHandlers.size, 0)
  assert.equal(trail.canvas.width, 0)
  trail.motion.setMatches(false)
  assert.ok(trail.handlers.has('mousemove'))
  trail.pointer.setMatches(false)
  assert.equal(trail.handlers.size, 0)
  trail.cleanup()
  assert.equal(trail.pointer.listeners.size, 0)
  assert.equal(trail.motion.listeners.size, 0)
})

test('resizes without breaking the path and starts a new section after leaving the document', () => {
  const trail = createHarness()
  trail.move(10, 20)
  trail.move(13, 20)
  trail.canvas.clientWidth = 200
  trail.handlers.get('resize')()
  assert.equal(trail.canvas.width, 400)
  trail.move(16, 20)
  trail.documentHandlers.get('mouseleave')()
  trail.documentHandlers.get('mouseenter')()
  trail.move(30, 30)
  trail.move(33, 30)
  trail.step(120)
  const segments = trail.lines.filter((line) => line.color === '#D4621A')
  assert.equal(segments.length, 3)
  assert.deepEqual(segments[1].start, segments[0].end)
  assert.deepEqual(segments[2].start, { x: 30, y: 26 })
  assert.equal(trail.canvas.width, 400)
  trail.cleanup()
  assert.equal(trail.documentHandlers.size, 0)
})

test('updates the pixel transform even when resized dimensions keep the same backing size', () => {
  const trail = createHarness()
  trail.move(10, 20)
  trail.move(13, 20)
  trail.step(10)
  trail.canvas.clientWidth = 70
  trail.canvas.clientHeight = 35
  globalThis.window.devicePixelRatio = 4
  trail.handlers.get('resize')()
  assert.equal(trail.canvas.width, 280)
  assert.deepEqual(trail.transforms.at(-1), [4, 0, 0, 4, 0, 0])
  trail.cleanup()
})

test('keeps partially sewn stitches when new points arrive', () => {
  const trail = createHarness()
  trail.move(10, 20)
  trail.move(13, 20)
  trail.step(60)
  const firstEnd = trail.lines[0].end
  trail.setTime(60)
  trail.move(16, 20)
  trail.step(61)
  assert.ok(trail.lines[0].end.x > firstEnd.x)
  trail.step(180)
  assert.equal(trail.lines.filter((line) => line.color === '#D4621A').length, 2)
  trail.cleanup()
})
