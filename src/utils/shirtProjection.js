export const SHIRT_REGION_WIDTH_CM = 29.5

export function getShirtRegion(box) {
  const width = box.max.x - box.min.x
  const height = box.max.y - box.min.y
  return {
    width: width * 0.55,
    top: box.max.y - height * 0.24,
    bottom: box.min.y + height * 0.1,
  }
}

export function toShirtPosition(value, view, region) {
  const sign = view === 'back' ? -1 : 1
  return {
    x: sign * (value.x - 200) * region.width / 180,
    y: region.top - (value.y - 120) * (region.top - region.bottom) / 220,
  }
}

export function fromShirtPosition(point, view, region) {
  const sign = view === 'back' ? -1 : 1
  return {
    x: 200 + sign * point.x * 180 / region.width,
    y: 120 + (region.top - point.y) * 220 / (region.top - region.bottom),
  }
}
