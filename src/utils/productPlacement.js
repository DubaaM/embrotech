export function getSizeLimits(product, placement, aspectRatio) {
  const { bounds } = placement
  const maxWidth = Math.min(bounds.width, bounds.height * aspectRatio)
  const max = Math.min(product.range[1], maxWidth / product.pixelsPerCm)
  return { min: Math.min(product.range[0], max), max }
}

export function clampPlacement(product, placement, value, aspectRatio) {
  const limits = getSizeLimits(product, placement, aspectRatio)
  const size = Math.max(limits.min, Math.min(limits.max, value.size))
  const width = size * product.pixelsPerCm
  const height = width / aspectRatio
  const { bounds } = placement
  return {
    size,
    x: Math.max(bounds.x + width / 2, Math.min(bounds.x + bounds.width - width / 2, value.x)),
    y: Math.max(bounds.y + height / 2, Math.min(bounds.y + bounds.height - height / 2, value.y)),
  }
}

export function getInitialPlacement(product, placement, aspectRatio) {
  return clampPlacement(product, placement, placement, aspectRatio)
}

export function cropEmbroidery(canvas) {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('A 2D canvas context is unavailable for the embroidery layer.')
  const { width, height } = canvas
  const pixels = context.getImageData(0, 0, width, height).data
  let left = width
  let top = height
  let right = -1
  let bottom = -1
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] > 8) {
        left = Math.min(left, x)
        right = Math.max(right, x)
        top = Math.min(top, y)
        bottom = Math.max(bottom, y)
      }
    }
  }
  if (right < left) throw new Error('The embroidery layer is empty.')
  const cropped = document.createElement('canvas')
  cropped.width = right - left + 1
  cropped.height = bottom - top + 1
  const croppedContext = cropped.getContext('2d')
  if (!croppedContext) throw new Error('A 2D canvas context is unavailable for the cropped embroidery.')
  croppedContext.drawImage(canvas, left, top, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height)
  return { url: cropped.toDataURL('image/png'), aspectRatio: cropped.width / cropped.height }
}
