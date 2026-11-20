const shirtBody = { x: 110, y: 120, width: 180, height: 220 }

export const sandboxProducts = {
  tshirt: {
    range: [3, 30],
    pixelsPerCm: 180 / SHIRT_REGION_WIDTH_CM,
    placements: {
      leftChest: { view: 'front', x: 245, y: 155, size: 9, bounds: shirtBody },
      centerChest: { view: 'front', x: 200, y: 165, size: 16, bounds: shirtBody },
      rightChest: { view: 'front', x: 155, y: 155, size: 9, bounds: shirtBody },
      upperBack: { view: 'back', x: 200, y: 165, size: 22, bounds: shirtBody },
      backNeck: { view: 'back', x: 200, y: 125, size: 7, bounds: shirtBody },
    },
  },
}
import { SHIRT_REGION_WIDTH_CM } from '../utils/shirtProjection.js'

