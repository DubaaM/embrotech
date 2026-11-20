import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import * as THREE from 'three'
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { sandboxProducts } from '../data/sandboxProducts.js'
import { getInitialPlacement } from './productPlacement.js'
import { fromShirtPosition, getShirtRegion, SHIRT_REGION_WIDTH_CM, toShirtPosition } from './shirtProjection.js'

test('front and back positions round-trip through the shirt coordinate system', () => {
  const region = { width: 0.3, top: 0.2, bottom: -0.3 }
  const value = { x: 240, y: 180 }
  const front = toShirtPosition(value, 'front', region)
  const back = toShirtPosition(value, 'back', region)
  assert.equal(front.x, -back.x)
  for (const [point, view] of [[front, 'front'], [back, 'back']]) {
    const restored = fromShirtPosition(point, view, region)
    assert.ok(Math.abs(restored.x - value.x) < 1e-9)
    assert.ok(Math.abs(restored.y - value.y) < 1e-9)
  }
})

test('each T-shirt preset projects embroidery onto the supplied 3D surface', async () => {
  const bytes = await readFile(new URL('../../public/models/sandbox/High+Neck+T-shirt.glb', import.meta.url))
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  const model = (await new GLTFLoader().parseAsync(buffer, '')).scene
  const originalBox = new THREE.Box3().setFromObject(model)
  model.position.sub(originalBox.getCenter(new THREE.Vector3()))
  model.updateMatrixWorld(true)
  const region = getShirtRegion(new THREE.Box3().setFromObject(model))
  const product = sandboxProducts.tshirt
  const raycaster = new THREE.Raycaster()

  for (const [name, placement] of Object.entries(product.placements)) {
    const value = getInitialPlacement(product, placement, 1)
    const back = placement.view === 'back'
    const surface = model.getObjectByName(back ? 'Cloth_mesh_3' : 'Cloth_mesh_24')
    assert.ok(surface, `${name} surface exists`)
    const point = toShirtPosition(value, placement.view, region)
    raycaster.set(new THREE.Vector3(point.x, point.y, back ? -2 : 2), new THREE.Vector3(0, 0, back ? 1 : -1))
    const hit = raycaster.intersectObject(surface)[0]
    assert.ok(hit, `${name} intersects the shirt`)
    const width = value.size * region.width / SHIRT_REGION_WIDTH_CM
    const decal = new DecalGeometry(surface, hit.point, new THREE.Euler(0, back ? Math.PI : 0, 0), new THREE.Vector3(width, width, 0.08))
    assert.ok(decal.getAttribute('position').count > 0, `${name} produces a visible decal`)
    decal.dispose()
  }
})
