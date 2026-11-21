export const DEFAULT_GARMENT_COLOR = '#FEF3E2'

export const GARMENT_VIEWER_SETTINGS = {
  autoRotateByDefault: false,
  cameraDistance: 1.65,
  colorTransitionMs: 300,
  maxPixelRatio: 2,
  maxZoomDistance: 3,
  minZoomDistance: 0.8,
  shirtFabricMaterialName: 'FABRIC 1_FRONT_2458',
}

export const GARMENT_COLORS = [
  { id: 'white', hex: '#FFFFFF' },
  { id: 'black', hex: '#171717' },
  { id: 'cream', hex: '#FEF3E2' },
  { id: 'orange', hex: '#D4621A' },
  { id: 'brown', hex: '#2A1A0E' },
  { id: 'red', hex: '#B42318' },
  { id: 'blue', hex: '#2563EB' },
  { id: 'green', hex: '#16834A' },
  { id: 'gray', hex: '#808080' },
  { id: 'navy', hex: '#14263F' },
]

export function isValidGarmentColor(color) {
  return typeof color === 'string' && /^#[\da-f]{6}$/i.test(color)
}
