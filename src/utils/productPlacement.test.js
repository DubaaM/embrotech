import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sandboxProducts } from '../data/sandboxProducts.js'
import { clampPlacement, getInitialPlacement, getSizeLimits } from './productPlacement.js'

test('all presets fit within their garment region for wide and tall artwork', () => {
  for (const product of Object.values(sandboxProducts)) {
    for (const placement of Object.values(product.placements)) {
      for (const ratio of [0.2, 1, 3]) {
        const value = getInitialPlacement(product, placement, ratio)
        const width = value.size * product.pixelsPerCm
        const height = width / ratio
        const bounds = placement.bounds
        assert.ok(value.x - width / 2 >= bounds.x - 1e-9)
        assert.ok(value.x + width / 2 <= bounds.x + bounds.width + 1e-9)
        assert.ok(value.y - height / 2 >= bounds.y - 1e-9)
        assert.ok(value.y + height / 2 <= bounds.y + bounds.height + 1e-9)
      }
    }
  }
})

test('clamps a dragged and resized logo while retaining the requested width where possible', () => {
  const product = sandboxProducts.tshirt
  const placement = product.placements.centerChest
  const value = clampPlacement(product, placement, { x: -100, y: 1000, size: 15 }, 2)
  const width = 15 * product.pixelsPerCm
  assert.equal(value.size, 15)
  assert.equal(value.x, placement.bounds.x + width / 2)
  assert.equal(value.y, placement.bounds.y + placement.bounds.height - width / 4)
})

test('limits unusually tall logos without producing zero-sized or out-of-bounds output', () => {
  const product = sandboxProducts.tshirt
  const placement = product.placements.backNeck
  const ratio = 1 / 700
  const limits = getSizeLimits(product, placement, ratio)
  const value = clampPlacement(product, placement, { x: 200, y: 200, size: 12 }, ratio)
  assert.ok(limits.max > 0)
  assert.equal(value.size, limits.max)
  assert.ok(value.size * product.pixelsPerCm / ratio <= placement.bounds.height + 1e-9)
})
