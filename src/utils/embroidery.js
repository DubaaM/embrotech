const MAX_COLORS = 8
const MAX_SAMPLES = 5000
const ALPHA_THRESHOLD = 16
const MAX_REALISTIC_STITCHES = 150000
const MAX_REALISTIC_FILL_STITCHES = Math.floor(MAX_REALISTIC_STITCHES * 0.85)

/* Return the squared RGB distance between two colors. */
function colorDistanceSquared(first, second) {
  const red = first[0] - second[0]
  const green = first[1] - second[1]
  const blue = first[2] - second[2]

  return red * red + green * green + blue * blue
}

/* Identify near-white pixels that can be excluded as a flat background. */
function isNearWhite(red, green, blue) {
  return (
    red >= 232 &&
    green >= 232 &&
    blue >= 232 &&
    Math.max(red, green, blue) - Math.min(red, green, blue) <= 28
  )
}

/* Detect transparency so white foreground pixels in transparent logos survive. */
function hasTransparency(imageData) {
  for (let offset = 3; offset < imageData.data.length; offset += 4) {
    if (imageData.data[offset] < 255) {
      return true
    }
  }

  return false
}

/* Return the closest palette index for an RGB pixel. */
function nearestColorIndex(red, green, blue, palette) {
  let nearestIndex = 0
  let nearestDistance = Number.POSITIVE_INFINITY

  for (let index = 0; index < palette.length; index += 1) {
    const distance = colorDistanceSquared([red, green, blue], palette[index])
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = index
    }
  }

  return nearestIndex
}

/* Cluster a bounded sample into up to eight thread colors, then label every pixel. */
export function quantizeColors(
  imageData,
  k,
  treatWhiteAsBackground = true,
) {
  const pixelCount = imageData.width * imageData.height
  const transparent = hasTransparency(imageData)
  const skipWhite = treatWhiteAsBackground && !transparent
  const samples = []
  let eligibleCount = 0
  let randomState = (imageData.width * 31 + imageData.height * 17) >>> 0

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const offset = pixel * 4
    const alpha = imageData.data[offset + 3]
    const red = imageData.data[offset]
    const green = imageData.data[offset + 1]
    const blue = imageData.data[offset + 2]

    if (alpha < ALPHA_THRESHOLD || (skipWhite && isNearWhite(red, green, blue))) {
      continue
    }

    eligibleCount += 1
    const color = [red, green, blue]

    if (samples.length < MAX_SAMPLES) {
      samples.push(color)
      continue
    }

    randomState =
      (Math.imul(randomState, 1664525) + 1013904223) >>> 0
    const replacementIndex = randomState % eligibleCount
    if (replacementIndex < MAX_SAMPLES) {
      samples[replacementIndex] = color
    }
  }

  if (samples.length === 0) {
    return {
      hasTransparency: transparent,
      labels: new Uint8Array(pixelCount).fill(255),
      palette: [],
    }
  }

  const requestedColors = Math.min(
    MAX_COLORS,
    Math.max(2, Math.round(k)),
    samples.length,
  )
  const palette = [samples[0].slice()]

  while (palette.length < requestedColors) {
    let farthestSample = null
    let greatestDistance = -1

    for (const sample of samples) {
      let closestDistance = Number.POSITIVE_INFINITY
      for (const center of palette) {
        closestDistance = Math.min(
          closestDistance,
          colorDistanceSquared(sample, center),
        )
      }

      if (closestDistance > greatestDistance) {
        greatestDistance = closestDistance
        farthestSample = sample
      }
    }

    if (!farthestSample || greatestDistance === 0) {
      break
    }

    palette.push(farthestSample.slice())
  }

  for (let iteration = 0; iteration < 8; iteration += 1) {
    const sums = palette.map(() => [0, 0, 0])
    const counts = palette.map(() => 0)

    for (const sample of samples) {
      const index = nearestColorIndex(sample[0], sample[1], sample[2], palette)
      sums[index][0] += sample[0]
      sums[index][1] += sample[1]
      sums[index][2] += sample[2]
      counts[index] += 1
    }

    for (let index = 0; index < palette.length; index += 1) {
      if (counts[index] > 0) {
        palette[index] = sums[index].map((total) =>
          Math.round(total / counts[index]),
        )
      }
    }
  }

  const labels = new Uint8Array(pixelCount)
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const offset = pixel * 4
    if (imageData.data[offset + 3] < ALPHA_THRESHOLD) {
      labels[pixel] = 255
      continue
    }

    labels[pixel] = nearestColorIndex(
      imageData.data[offset],
      imageData.data[offset + 1],
      imageData.data[offset + 2],
      palette,
    )
  }

  return {
    hasTransparency: transparent,
    labels,
    palette,
  }
}

/* Build one binary mask per visible palette color, excluding background pixels. */
export function createColorMasks(imageData, quantized, treatWhiteAsBackground) {
  const { labels, palette } = quantized
  const skipWhite = treatWhiteAsBackground && !quantized.hasTransparency
  const masks = palette.map(() => new Uint8Array(imageData.width * imageData.height))
  const counts = palette.map(() => 0)
  const bounds = palette.map(() => ({
    bottom: 0,
    left: imageData.width,
    right: 0,
    top: imageData.height,
  }))

  for (let pixel = 0; pixel < labels.length; pixel += 1) {
    const offset = pixel * 4
    const red = imageData.data[offset]
    const green = imageData.data[offset + 1]
    const blue = imageData.data[offset + 2]

    if (
      imageData.data[offset + 3] < ALPHA_THRESHOLD ||
      (skipWhite && isNearWhite(red, green, blue))
    ) {
      continue
    }

    const colorIndex = labels[pixel]
    if (colorIndex < masks.length) {
      masks[colorIndex][pixel] = 1
      counts[colorIndex] += 1
      const x = pixel % imageData.width
      const y = Math.floor(pixel / imageData.width)
      bounds[colorIndex].left = Math.min(bounds[colorIndex].left, x)
      bounds[colorIndex].top = Math.min(bounds[colorIndex].top, y)
      bounds[colorIndex].right = Math.max(bounds[colorIndex].right, x + 1)
      bounds[colorIndex].bottom = Math.max(bounds[colorIndex].bottom, y + 1)
    }
  }

  return masks
    .map((mask, index) => ({
      bounds: bounds[index],
      color: palette[index],
      count: counts[index],
      mask,
    }))
    .filter(({ count }) => count > 0)
}

/* Mix an RGB color toward another RGB color. */
function mixColor(color, target, amount) {
  return color.map((channel, index) =>
    Math.round(channel * (1 - amount) + target[index] * amount),
  )
}

/* Format RGB values for Canvas stroke and fill styles. */
function colorToCss(color) {
  return `rgb(${color[0]} ${color[1]} ${color[2]})`
}

/* Create a scratch canvas matching the renderer's canvas implementation. */
function createScratchCanvas(context, width, height) {
  let canvas

  if (typeof OffscreenCanvas === 'function') {
    canvas = new OffscreenCanvas(width, height)
  } else {
    const ownerDocument = context.canvas.ownerDocument
    if (!ownerDocument) {
      throw new Error('A scratch canvas is unavailable in this browser.')
    }

    canvas = ownerDocument.createElement('canvas')
    canvas.width = width
    canvas.height = height
  }

  return canvas
}

/* Convert a binary mask to an alpha canvas for compositing thread lines. */
function maskToCanvas(context, mask) {
  const width = context.canvas.width
  const height = context.canvas.height
  const canvas = createScratchCanvas(context, width, height)
  const maskContext = canvas.getContext('2d')

  if (!maskContext) {
    throw new Error('A 2D canvas context is unavailable for the embroidery mask.')
  }

  const imageData = maskContext.createImageData(width, height)
  for (let pixel = 0; pixel < mask.length; pixel += 1) {
    if (mask[pixel]) {
      const offset = pixel * 4
      imageData.data[offset] = 255
      imageData.data[offset + 1] = 255
      imageData.data[offset + 2] = 255
      imageData.data[offset + 3] = 255
    }
  }

  maskContext.putImageData(imageData, 0, 0)
  return canvas
}

/* Draw diagonal thread lines, then clip their alpha to the current color mask. */
function drawMaskedThreadLines(
  context,
  maskCanvas,
  tones,
  angle,
  spacing,
  opacity,
  lineWidth,
) {
  const width = context.canvas.width
  const height = context.canvas.height
  const canvas = createScratchCanvas(context, width, height)
  const threadContext = canvas.getContext('2d')

  if (!threadContext) {
    throw new Error('A 2D canvas context is unavailable for the thread texture.')
  }

  const diagonal = Math.ceil(Math.hypot(width, height))
  threadContext.save()
  threadContext.translate(width / 2, height / 2)
  threadContext.rotate(angle)
  threadContext.lineWidth = lineWidth
  threadContext.lineCap = 'round'
  threadContext.globalAlpha = opacity

  let lineIndex = 0
  for (let offset = -diagonal; offset <= diagonal; offset += spacing) {
    threadContext.strokeStyle = colorToCss(tones[lineIndex % tones.length])
    threadContext.beginPath()
    threadContext.moveTo(-diagonal, offset)
    threadContext.lineTo(diagonal, offset)
    threadContext.stroke()
    lineIndex += 1
  }

  threadContext.restore()
  threadContext.globalCompositeOperation = 'destination-in'
  threadContext.drawImage(maskCanvas, 0, 0)
  context.drawImage(canvas, 0, 0)
}

/* Fill a color mask with alternating 45-degree and lighter variation threads. */
export function fillWithThread(context, mask, color, density) {
  const spacings = { 1: 2.4, 2: 3.8, 3: 5.4 }
  const spacing = spacings[density] ?? spacings[2]
  const lighter = mixColor(color, [255, 255, 255], 0.3)
  const darker = mixColor(color, [0, 0, 0], 0.28)
  const maskCanvas = maskToCanvas(context, mask)

  drawMaskedThreadLines(
    context,
    maskCanvas,
    [lighter, darker],
    -Math.PI / 4,
    spacing,
    1,
    1,
  )
  drawMaskedThreadLines(
    context,
    maskCanvas,
    [lighter],
    -Math.PI / 4 + Math.PI / 24,
    spacing * 1.5,
    0.2,
    0.7,
  )
}

/* Draw small dark dashes around pixels that touch the mask's background. */
export function stitchedBorder(context, mask, color) {
  const width = context.canvas.width
  const height = context.canvas.height
  const darker = mixColor(color, [0, 0, 0], 0.5)

  context.save()
  context.strokeStyle = colorToCss(darker)
  context.lineWidth = 1.1
  context.lineCap = 'round'

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = y * width + x
      if (!mask[pixel] || (x + y) % 3 !== 0) {
        continue
      }

      const top = y === 0 || !mask[pixel - width]
      const bottom = y === height - 1 || !mask[pixel + width]
      const left = x === 0 || !mask[pixel - 1]
      const right = x === width - 1 || !mask[pixel + 1]

      if (!(top || bottom || left || right)) {
        continue
      }

      context.beginPath()
      if (top || bottom) {
        context.moveTo(x - 0.25, y + 0.5)
        context.lineTo(x + 1.25, y + 0.5)
      } else {
        context.moveTo(x + 0.5, y - 0.25)
        context.lineTo(x + 0.5, y + 1.25)
      }
      context.stroke()
    }
  }

  context.restore()
}

/* Draw the textile base and a subtle woven grid. */
function drawFabricBackground(context, fabricColor) {
  const width = context.canvas.width
  const height = context.canvas.height

  context.fillStyle = fabricColor
  context.fillRect(0, 0, width, height)
  context.save()
  context.globalAlpha = 0.06
  context.lineWidth = 1

  for (let offset = 0; offset < width; offset += 5) {
    context.strokeStyle = offset % 10 === 0 ? '#FFFFFF' : '#000000'
    context.beginPath()
    context.moveTo(offset + 0.5, 0)
    context.lineTo(offset + 0.5, height)
    context.stroke()
  }

  for (let offset = 0; offset < height; offset += 5) {
    context.strokeStyle = offset % 10 === 0 ? '#000000' : '#FFFFFF'
    context.beginPath()
    context.moveTo(0, offset + 0.5)
    context.lineTo(width, offset + 0.5)
    context.stroke()
  }

  context.restore()
}

/* Add the soft drop shadow behind the combined embroidery silhouette. */
function drawDropShadow(
  context,
  masks,
  { blur = 5, colorOpacity = 0.22, offsetX = 1, offsetY = 2, shadowOpacity = 0.35 } = {},
) {
  const width = context.canvas.width
  const height = context.canvas.height
  const unionMask = new Uint8Array(width * height)

  for (const { mask } of masks) {
    for (let pixel = 0; pixel < mask.length; pixel += 1) {
      unionMask[pixel] |= mask[pixel]
    }
  }

  const maskCanvas = maskToCanvas(context, unionMask)
  const shadowCanvas = createScratchCanvas(context, width, height)
  const shadowContext = shadowCanvas.getContext('2d')
  if (!shadowContext) {
    throw new Error('A 2D canvas context is unavailable for the embroidery shadow.')
  }

  shadowContext.fillStyle = `rgba(0, 0, 0, ${colorOpacity})`
  shadowContext.fillRect(0, 0, width, height)
  shadowContext.globalCompositeOperation = 'destination-in'
  shadowContext.drawImage(maskCanvas, 0, 0)

  context.save()
  context.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
  context.shadowBlur = blur
  context.shadowOffsetX = offsetX
  context.shadowOffsetY = offsetY
  context.drawImage(shadowCanvas, 0, 0)
  context.restore()
}

/* Add a small white highlight to the exposed upper-left mask edges. */
function drawEdgeHighlights(context, mask) {
  const width = context.canvas.width
  const height = context.canvas.height

  context.save()
  context.strokeStyle = 'rgba(255, 255, 255, 0.55)'
  context.lineWidth = 0.7
  context.lineCap = 'round'

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = y * width + x
      if (!mask[pixel] || (x + y) % 2 !== 0) {
        continue
      }

      const top = y === 0 || !mask[pixel - width]
      const left = x === 0 || !mask[pixel - 1]
      if (!top && !left) {
        continue
      }

      context.beginPath()
      context.moveTo(x, y)
      context.lineTo(x + (top ? 1 : 0), y + (left ? 1 : 0))
      context.stroke()
    }
  }

  context.restore()
}

function createSeededRandom(seed) {
  let state = seed >>> 0 || 0x6d2b79f5
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function getProjectedBounds(bounds, angle) {
  const directionX = Math.cos(angle)
  const directionY = Math.sin(angle)
  const normalX = -directionY
  const normalY = directionX
  const corners = [
    [bounds.left, bounds.top],
    [bounds.right, bounds.top],
    [bounds.left, bounds.bottom],
    [bounds.right, bounds.bottom],
  ]
  const along = corners.map(([x, y]) => x * directionX + y * directionY)
  const across = corners.map(([x, y]) => x * normalX + y * normalY)

  return {
    maxAlong: Math.max(...along),
    maxAcross: Math.max(...across),
    minAlong: Math.min(...along),
    minAcross: Math.min(...across),
    normalX,
    normalY,
  }
}

function getDirectionalThreadTone(color, angle) {
  const lightAngle = -3 * Math.PI / 4
  const brightness = 0.72 + 0.25 * Math.abs(Math.cos(angle - lightAngle))
  const highlightStart = 0.82

  return brightness >= highlightStart
    ? mixColor(color, [255, 255, 255], (brightness - highlightStart) * 1.2)
    : mixColor(color, [0, 0, 0], (highlightStart - brightness) * 0.75)
}

function createThreadGradient(context, x, y, angle, width, color) {
  const normalX = -Math.sin(angle) * width * 0.5
  const normalY = Math.cos(angle) * width * 0.5
  const dark = mixColor(color, [0, 0, 0], 0.36)
  const light = mixColor(color, [255, 255, 255], 0.28)
  const gradient = context.createLinearGradient(
    x - normalX,
    y - normalY,
    x + normalX,
    y + normalY,
  )

  gradient.addColorStop(0, colorToCss(dark))
  gradient.addColorStop(0.32, colorToCss(color))
  gradient.addColorStop(0.5, colorToCss(light))
  gradient.addColorStop(0.68, colorToCss(color))
  gradient.addColorStop(1, colorToCss(dark))
  return gradient
}

function getRealisticStitchSettings(masks, density, preview) {
  const presets = {
    1: { rowSpacing: 1.5, stitchLength: 6 },
    2: { rowSpacing: 2, stitchLength: 7 },
    3: { rowSpacing: 3, stitchLength: 9 },
  }
  const settings = { ...(presets[density] ?? presets[2]) }
  const stitchGap = 1.25

  if (preview) {
    settings.rowSpacing *= 1.5
    settings.stitchLength *= 1.8
  }

  const visiblePixels = masks.reduce((total, { count }) => total + count, 0)
  const estimatedStitches =
    visiblePixels / (settings.rowSpacing * (settings.stitchLength + stitchGap))
  if (estimatedStitches > MAX_REALISTIC_FILL_STITCHES) {
    settings.stitchLength = Math.max(
      settings.stitchLength,
      visiblePixels /
        (MAX_REALISTIC_FILL_STITCHES * settings.rowSpacing) -
        stitchGap,
    )
  }

  return { ...settings, stitchGap }
}

function drawTatamiRows({
  bounds,
  color,
  context,
  heightContext,
  mask,
  maskCanvas,
  region,
  rowIndexOffset,
  seed,
  settings,
  stitchBudget,
  width,
  height,
}) {
  const angleJitter = (2 * Math.PI) / 180
  const lineWidth = Math.max(0.85, Math.min(1.7, settings.rowSpacing * 0.78))
  const projected = getProjectedBounds(bounds, region.angle)
  const directionX = Math.cos(region.angle)
  const directionY = Math.sin(region.angle)
  const rowCount =
    Math.ceil((projected.maxAcross - projected.minAcross) / settings.rowSpacing) + 1
  const random = createSeededRandom(seed)
  const offsetPattern = [0, 1 / 3, 2 / 3]
  let budgetReached = false

  context.save()
  context.strokeStyle = colorToCss(color)
  context.lineWidth = lineWidth
  context.lineCap = 'round'
  heightContext.save()
  heightContext.strokeStyle = 'rgba(255, 255, 255, 0.58)'
  heightContext.lineWidth = lineWidth * 1.35
  heightContext.lineCap = 'round'

  for (
    let rowIndex = 0;
    rowIndex < rowCount && !budgetReached;
    rowIndex += 1
  ) {
    const across =
      Math.floor(projected.minAcross / settings.rowSpacing) * settings.rowSpacing +
      rowIndex * settings.rowSpacing
    const stagger =
      offsetPattern[(rowIndex + rowIndexOffset) % offsetPattern.length] *
      settings.stitchLength
    const startAlong = projected.minAlong + stagger

    for (
      let along = startAlong;
      along <= projected.maxAlong;
      along += settings.stitchLength + settings.stitchGap
    ) {
      if (stitchBudget.count >= MAX_REALISTIC_FILL_STITCHES) {
        budgetReached = true
        break
      }

      const centerX =
        directionX * along + projected.normalX * across
      const centerY =
        directionY * along + projected.normalY * across
      if (
        centerX < bounds.left ||
        centerX >= bounds.right ||
        centerY < bounds.top ||
        centerY >= bounds.bottom ||
        centerX < region.left ||
        centerX >= region.right
      ) {
        continue
      }

      const pixelX = Math.floor(centerX)
      const pixelY = Math.floor(centerY)
      if (
        pixelX < 0 ||
        pixelX >= width ||
        pixelY < 0 ||
        pixelY >= height ||
        !mask[pixelY * width + pixelX]
      ) {
        continue
      }

      const variedLength =
        settings.stitchLength * (0.9 + random() * 0.2)
      const angle =
        region.angle + (random() * 2 - 1) * angleJitter
      const dx = Math.cos(angle) * variedLength * 0.5
      const dy = Math.sin(angle) * variedLength * 0.5
      const tone = getDirectionalThreadTone(color, angle)

      context.strokeStyle = createThreadGradient(
        context,
        centerX,
        centerY,
        angle,
        lineWidth,
        tone,
      )
      context.beginPath()
      context.moveTo(centerX - dx, centerY - dy)
      context.lineTo(centerX + dx, centerY + dy)
      context.stroke()

      heightContext.beginPath()
      heightContext.moveTo(centerX - dx, centerY - dy)
      heightContext.lineTo(centerX + dx, centerY + dy)
      heightContext.stroke()
      stitchBudget.count += 1
    }
  }

  heightContext.restore()
  context.restore()
  context.globalCompositeOperation = 'destination-in'
  context.drawImage(maskCanvas, 0, 0)
  context.globalCompositeOperation = 'source-over'
  heightContext.globalCompositeOperation = 'destination-in'
  heightContext.drawImage(maskCanvas, 0, 0)
  heightContext.globalCompositeOperation = 'source-over'
  return !budgetReached
}

function drawTatamiFill(
  context,
  heightContext,
  { bounds, color, count, mask },
  colorIndex,
  settings,
  stitchBudget,
) {
  const width = context.canvas.width
  const height = context.canvas.height
  const maskCanvas = maskToCanvas(context, mask)
  const stitchCanvas = createScratchCanvas(context, width, height)
  const stitchContext = stitchCanvas.getContext('2d')
  const stitchHeightCanvas = createScratchCanvas(context, width, height)
  const stitchHeightContext = stitchHeightCanvas.getContext('2d')
  if (!stitchContext || !stitchHeightContext) {
    throw new Error('A 2D canvas context is unavailable for realistic stitches.')
  }

  const regionCount = count > 60000 ? 3 : 1
  const colorAngleOffset = ((colorIndex % 3) - 1) * (5 * Math.PI) / 180
  const regionOffsets = regionCount === 3
    ? [-12, 0, 12].map((degrees) => (degrees * Math.PI) / 180)
    : [0]
  const regionWidth = (bounds.right - bounds.left) / regionCount

  for (let regionIndex = 0; regionIndex < regionCount; regionIndex += 1) {
    const completed = drawTatamiRows({
      bounds,
      color,
      context: stitchContext,
      heightContext: stitchHeightContext,
      mask,
      maskCanvas,
      region: {
        angle: Math.PI / 4 + colorAngleOffset + regionOffsets[regionIndex],
        left: bounds.left + regionIndex * regionWidth,
        right:
          regionIndex === regionCount - 1
            ? bounds.right
            : bounds.left + (regionIndex + 1) * regionWidth,
      },
      rowIndexOffset: regionIndex,
      seed:
        width * 73856093 ^
        height * 19349663 ^
        count * 83492791 ^
        colorIndex * 2654435761 ^
        regionIndex,
      settings,
      stitchBudget,
      width,
      height,
    })
    if (!completed) {
      break
    }
  }

  context.drawImage(stitchCanvas, 0, 0)
  heightContext.drawImage(stitchHeightCanvas, 0, 0)
}

function drawSatinBorder(
  context,
  heightContext,
  { bounds, color, mask },
  stitchBudget,
) {
  const width = context.canvas.width
  const height = context.canvas.height
  const darker = mixColor(color, [0, 0, 0], 0.46)

  context.save()
  context.strokeStyle = colorToCss(darker)
  context.lineWidth = 1.2
  context.lineCap = 'round'
  heightContext.save()
  heightContext.strokeStyle = 'rgba(255, 255, 255, 0.94)'
  heightContext.lineWidth = 3.2
  heightContext.lineCap = 'round'

  for (let y = bounds.top; y < bounds.bottom; y += 1) {
    for (let x = bounds.left; x < bounds.right; x += 1) {
      const pixel = y * width + x
      if (!mask[pixel]) {
        continue
      }

      const left = x === 0 ? 0 : mask[pixel - 1]
      const right = x === width - 1 ? 0 : mask[pixel + 1]
      const top = y === 0 ? 0 : mask[pixel - width]
      const bottom = y === height - 1 ? 0 : mask[pixel + width]
      const gradientX = left - right
      const gradientY = top - bottom
      const magnitude = Math.hypot(gradientX, gradientY)
      if (magnitude === 0) {
        continue
      }

      const normalX = gradientX / magnitude
      const normalY = gradientY / magnitude
      const centerX = x + 0.5
      const centerY = y + 0.5
      const halfLength = 1.5
      if (stitchBudget.count < MAX_REALISTIC_STITCHES) {
        context.beginPath()
        context.moveTo(centerX - normalX * halfLength, centerY - normalY * halfLength)
        context.lineTo(centerX + normalX * halfLength, centerY + normalY * halfLength)
        context.stroke()

        heightContext.beginPath()
        heightContext.moveTo(centerX - normalX * halfLength, centerY - normalY * halfLength)
        heightContext.lineTo(centerX + normalX * halfLength, centerY + normalY * halfLength)
        heightContext.stroke()
        stitchBudget.count += 1
      }

      context.fillStyle = 'rgba(0, 0, 0, 0.22)'
      context.fillRect(x + 0.25, y + 0.25, 0.5, 0.5)
    }
  }

  context.restore()
  heightContext.restore()
}

function drawRealisticFabric(context, fabricColor) {
  const width = context.canvas.width
  const height = context.canvas.height
  const gradient = context.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)')
  gradient.addColorStop(0.52, 'rgba(255, 255, 255, 0)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.08)')
  context.fillStyle = fabricColor
  context.fillRect(0, 0, width, height)
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)

  context.save()
  context.globalAlpha = 0.045
  context.lineWidth = 0.6
  for (let offset = 0; offset < width; offset += 4) {
    context.strokeStyle = offset % 8 === 0 ? '#FFFFFF' : '#000000'
    context.beginPath()
    context.moveTo(offset + 0.5, 0)
    context.lineTo(offset + 0.5, height)
    context.stroke()
  }
  for (let offset = 0; offset < height; offset += 4) {
    context.strokeStyle = offset % 8 === 0 ? '#000000' : '#FFFFFF'
    context.beginPath()
    context.moveTo(0, offset + 0.5)
    context.lineTo(width, offset + 0.5)
    context.stroke()
  }
  context.restore()

  const noiseCanvas = createScratchCanvas(context, 64, 64)
  const noiseContext = noiseCanvas.getContext('2d')
  if (!noiseContext) {
    throw new Error('A 2D canvas context is unavailable for fabric texture.')
  }
  const noise = noiseContext.createImageData(64, 64)
  const random = createSeededRandom(width * 31 + height * 17)
  for (let pixel = 0; pixel < 64 * 64; pixel += 1) {
    const offset = pixel * 4
    const value = Math.floor(random() * 256)
    noise.data[offset] = value
    noise.data[offset + 1] = value
    noise.data[offset + 2] = value
    noise.data[offset + 3] = 15
  }
  noiseContext.putImageData(noise, 0, 0)
  const pattern = context.createPattern(noiseCanvas, 'repeat')
  if (pattern) {
    context.fillStyle = pattern
    context.fillRect(0, 0, width, height)
  }
}

function applyRelief(context, heightCanvas, intensity) {
  if (intensity <= 0) {
    return
  }

  const width = context.canvas.width
  const height = context.canvas.height
  const pixels = context.getImageData(0, 0, width, height)
  const heights = heightCanvas.getContext('2d')?.getImageData(0, 0, width, height)
  if (!heights) {
    throw new Error('A 2D canvas context is unavailable for the relief map.')
  }
  const amount = Math.min(1, intensity / 100) * 0.62

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const pixel = y * width + x
      const offset = pixel * 4
      const heightValue = heights.data[offset + 3]
      if (heightValue < 8) {
        continue
      }

      const left = heights.data[(pixel - 1) * 4 + 3]
      const right = heights.data[(pixel + 1) * 4 + 3]
      const top = heights.data[(pixel - width) * 4 + 3]
      const bottom = heights.data[(pixel + width) * 4 + 3]
      const slope = ((right - left) + (bottom - top)) / (2 * 255)
      const light = Math.max(-0.45, Math.min(0.45, slope * amount))
      if (light > 0) {
        for (let channel = 0; channel < 3; channel += 1) {
          pixels.data[offset + channel] +=
            (255 - pixels.data[offset + channel]) * light
        }
      } else {
        const shade = 1 + light
        for (let channel = 0; channel < 3; channel += 1) {
          pixels.data[offset + channel] *= shade
        }
      }
    }
  }

  context.putImageData(pixels, 0, 0)
}

function renderRealisticEmbroidery(context, masks, options) {
  const width = context.canvas.width
  const height = context.canvas.height
  const heightCanvas = createScratchCanvas(context, width, height)
  const heightContext = heightCanvas.getContext('2d')
  if (!heightContext) {
    throw new Error('A 2D canvas context is unavailable for the stitch height map.')
  }

  if (!options.transparentBackground) {
    drawRealisticFabric(context, options.fabricColor)
  }
  if (!masks.length) {
    return
  }

  drawDropShadow(context, masks, {
    blur: 6,
    colorOpacity: 0.35,
    offsetX: 3,
    offsetY: 4,
    shadowOpacity: 0.35,
  })

  const settings = getRealisticStitchSettings(masks, options.density, options.preview)
  const stitchBudget = { count: 0 }
  masks.forEach((mask, colorIndex) => {
    drawTatamiFill(
      context,
      heightContext,
      mask,
      colorIndex,
      settings,
      stitchBudget,
    )
  })
  for (const mask of masks) {
    drawSatinBorder(context, heightContext, mask, stitchBudget)
  }

  applyRelief(context, heightCanvas, options.relief ?? 55)
}

/* Render the complete fabric and embroidery layers onto the supplied canvas. */
export function renderEmbroidery(context, imageData, options) {
  const quantized = quantizeColors(
    imageData,
    options.threadColors,
    options.treatWhiteAsBackground,
  )
  const masks = createColorMasks(
    imageData,
    quantized,
    options.treatWhiteAsBackground,
  )

  if (options.quality === 'simple') {
    if (!options.transparentBackground) {
      drawFabricBackground(context, options.fabricColor)
    }
    if (masks.length === 0) {
      return
    }

    drawDropShadow(context, masks)
    for (const { color, mask } of masks) {
      fillWithThread(context, mask, color, options.density)
    }
    for (const { color, mask } of masks) {
      stitchedBorder(context, mask, color)
      drawEdgeHighlights(context, mask)
    }
    return
  }

  renderRealisticEmbroidery(context, masks, options)
}

/* Resize ImageData with nearest-neighbor sampling for the main-thread fallback. */
export function resizeImageData(imageData, maxSide) {
  const longestSide = Math.max(imageData.width, imageData.height)
  if (longestSide <= maxSide) {
    return new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height,
    )
  }

  const scale = maxSide / longestSide
  const width = Math.max(1, Math.round(imageData.width * scale))
  const height = Math.max(1, Math.round(imageData.height * scale))
  const data = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    const sourceY = Math.min(
      imageData.height - 1,
      Math.floor(y / scale),
    )
    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(
        imageData.width - 1,
        Math.floor(x / scale),
      )
      const sourceOffset = (sourceY * imageData.width + sourceX) * 4
      const targetOffset = (y * width + x) * 4
      data[targetOffset] = imageData.data[sourceOffset]
      data[targetOffset + 1] = imageData.data[sourceOffset + 1]
      data[targetOffset + 2] = imageData.data[sourceOffset + 2]
      data[targetOffset + 3] = imageData.data[sourceOffset + 3]
    }
  }

  return new ImageData(data, width, height)
}

const RASTER_IMAGE_MAX_SIDE = 700
const SVG_IMAGE_MAX_SIDE = 1400

/* Preserve an error code so the upload UI can show a localized message. */
function imageLoadingError(code, message) {
  const error = new Error(message)
  error.name = code
  return error
}

/* Read pixel dimensions from SVG width/height, falling back to its viewBox. */
function getSvgDimensions(svgRoot) {
  const parseDimension = (value) => {
    const match =
      /^\s*((?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*(px|in|cm|mm|pt|pc)?\s*$/i.exec(
        value ?? '',
      )
    const unitScale = {
      px: 1,
      in: 96,
      cm: 96 / 2.54,
      mm: 96 / 25.4,
      pt: 96 / 72,
      pc: 16,
    }
    const dimension = match
      ? Number(match[1]) * unitScale[(match[2] ?? 'px').toLowerCase()]
      : 0
    return Number.isFinite(dimension) && dimension > 0 ? dimension : 0
  }

  const width = parseDimension(svgRoot.getAttribute('width'))
  const height = parseDimension(svgRoot.getAttribute('height'))
  if (width && height) {
    return { height, width }
  }

  const viewBox = (svgRoot.getAttribute('viewBox') ?? '')
    .trim()
    .split(/[\s,]+/)
    .map(Number)
  if (
    viewBox.length === 4 &&
    viewBox.every(Number.isFinite) &&
    viewBox[2] > 0 &&
    viewBox[3] > 0
  ) {
    return { height: viewBox[3], width: viewBox[2] }
  }

  throw imageLoadingError(
    'svg-dimensions',
    'The SVG has no usable dimensions or viewBox.',
  )
}

/* Rasterize an image at a bounded size while preserving its aspect ratio. */
function rasterizeImage(
  image,
  sourceWidth,
  sourceHeight,
  maxSide,
  errorCode,
  allowUpscale = false,
) {
  if (!sourceWidth || !sourceHeight) {
    throw imageLoadingError(errorCode, 'The image has invalid dimensions.')
  }

  const scale = allowUpscale
    ? maxSide / Math.max(sourceWidth, sourceHeight)
    : Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw imageLoadingError(errorCode, 'A 2D canvas context is unavailable.')
  }

  try {
    context.clearRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)
    return context.getImageData(0, 0, width, height)
  } catch (error) {
    throw imageLoadingError(errorCode, error.message)
  }
}

/* Load a temporary object URL as an image without inserting SVG markup into the DOM. */
function loadImageElement(url, errorCode) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () =>
      reject(imageLoadingError(errorCode, 'The image could not be decoded.'))
    image.src = url
  })
}

/* Remove harmless XML prologues and any external DTD before image loading. */
function stripSvgPrologue(svgText) {
  let content = svgText.replace(/^\uFEFF/, '').trimStart()

  if (/^<\?xml(?:\s|\?>)/i.test(content)) {
    const declarationEnd = content.indexOf('?>')
    if (declarationEnd < 0) {
      throw imageLoadingError('svg-invalid', 'The XML declaration is malformed.')
    }
    content = content.slice(declarationEnd + 2).trimStart()
  }

  let hasDoctype = false
  while (content.startsWith('<!--') || (!hasDoctype && /^<!DOCTYPE\b/i.test(content))) {
    if (content.startsWith('<!--')) {
      const commentEnd = content.indexOf('-->')
      if (commentEnd < 0) {
        throw imageLoadingError('svg-invalid', 'The SVG has an unclosed comment.')
      }
      content = content.slice(commentEnd + 3).trimStart()
      continue
    }

    let quote = ''
    let subsetDepth = 0
    let hasInternalSubset = false
    let doctypeEnd = -1
    for (let index = 0; index < content.length; index += 1) {
      const character = content[index]
      if (quote) {
        if (character === quote) {
          quote = ''
        }
      } else if (character === '"' || character === "'") {
        quote = character
      } else if (character === '[') {
        subsetDepth += 1
        hasInternalSubset = true
      } else if (character === ']') {
        subsetDepth = Math.max(0, subsetDepth - 1)
      } else if (character === '>' && subsetDepth === 0) {
        doctypeEnd = index
        break
      }
    }

    if (doctypeEnd < 0) {
      throw imageLoadingError('svg-invalid', 'The SVG doctype is malformed.')
    }
    if (!/^<!DOCTYPE\s+svg\b/i.test(content.slice(0, doctypeEnd + 1))) {
      throw imageLoadingError('svg-invalid', 'The SVG doctype does not match its root.')
    }
    if (hasInternalSubset) {
      throw imageLoadingError(
        'svg-unsupported',
        'SVG documents with custom entity declarations are not supported.',
      )
    }

    content = content.slice(doctypeEnd + 1).trimStart()
    hasDoctype = true
  }

  return content
}

/* Check SVG source before rasterization to block active content and remote loads. */
function validateSvgSource(svgText) {
  const svgContent = stripSvgPrologue(svgText)

  if (!/^<svg(?:\s|>)/i.test(svgContent)) {
    throw imageLoadingError('svg-invalid', 'The file does not start with an SVG element.')
  }

  // These checks prevent uploaded SVGs from running active content or loading remote resources.
  const unsupportedContent =
    /<\s*(?:script|foreignObject|iframe|embed)\b/i.test(svgContent) ||
    /\bon[a-z0-9:_-]*\s*=/i.test(svgContent) ||
    /\b(?:xlink:)?href\s*=\s*(["'])\s*(?:https?:\/\/|\/\/)/i.test(svgContent) ||
    /\burl\s*\(\s*(["']?)\s*(?:https?:\/\/|\/\/)/i.test(svgContent) ||
    /@import\b/i.test(svgContent)

  if (unsupportedContent) {
    throw imageLoadingError(
      'svg-unsupported',
      'The SVG contains unsupported elements or references.',
    )
  }

  return svgContent
}

/* Safely rasterize an SVG to 1400px, then supply the existing 700px pipeline input. */
async function loadSvgImageData(file) {
  let svgText
  try {
    svgText = validateSvgSource(await file.text())
  } catch (error) {
    if (
      ['svg-invalid', 'svg-unsupported'].includes(error?.name)
    ) {
      throw error
    }
    throw imageLoadingError('svg-invalid', 'The SVG file could not be read.')
  }

  let svgDocument
  try {
    svgDocument = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  } catch (error) {
    throw imageLoadingError('svg-invalid', error.message)
  }

  const svgRoot = svgDocument.documentElement
  if (
    !svgRoot ||
    svgRoot.localName.toLowerCase() !== 'svg' ||
    svgDocument.getElementsByTagName('parsererror').length > 0
  ) {
    throw imageLoadingError('svg-invalid', 'The SVG document is malformed.')
  }

  const hasExternalReference = [
    svgRoot,
    ...Array.from(svgRoot.getElementsByTagName('*')),
  ].some((element) =>
    Array.from(element.attributes).some((attribute) => {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim()
      return (
        ((name === 'href' || name === 'xlink:href') &&
          /^(?:https?:\/\/|\/\/)/i.test(value)) ||
        /\burl\s*\(\s*(["']?)\s*(?:https?:\/\/|\/\/)/i.test(value)
      )
    }),
  )
  if (hasExternalReference) {
    throw imageLoadingError(
      'svg-unsupported',
      'The SVG contains unsupported elements or references.',
    )
  }

  const { height, width } = getSvgDimensions(svgRoot)
  const hasText = Array.from(svgRoot.getElementsByTagName('*')).some(
    (element) => element.localName.toLowerCase() === 'text',
  )
  const svgUrl = URL.createObjectURL(
    new Blob([svgText], { type: 'image/svg+xml' }),
  )

  try {
    const image = await loadImageElement(svgUrl, 'svg-render')
    const highResolutionImageData = rasterizeImage(
      image,
      width,
      height,
      SVG_IMAGE_MAX_SIDE,
      'svg-render',
      true,
    )
    let hasVisiblePixels = false
    for (let offset = 3; offset < highResolutionImageData.data.length; offset += 4) {
      if (highResolutionImageData.data[offset] > 0) {
        hasVisiblePixels = true
        break
      }
    }
    if (!hasVisiblePixels) {
      throw imageLoadingError('svg-render', 'The SVG rendered an empty image.')
    }

    return {
      hasText,
      imageData: resizeImageData(highResolutionImageData, RASTER_IMAGE_MAX_SIDE),
      isSvg: true,
    }
  } catch (error) {
    if (error.name === 'svg-render') {
      throw error
    }
    throw imageLoadingError('svg-render', error.message)
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}

/* Decode SVG and raster uploads into the ImageData consumed by the preview renderer. */
export async function loadImageData(file) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'svg') {
    return loadSvgImageData(file)
  }

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      try {
        return {
          hasText: false,
          imageData: rasterizeImage(
            bitmap,
            bitmap.width,
            bitmap.height,
            RASTER_IMAGE_MAX_SIDE,
            'image-read',
          ),
          isSvg: false,
        }
      } finally {
        bitmap.close()
      }
    } catch (error) {
      if (error.name === 'image-read') {
        throw error
      }
      throw imageLoadingError('image-read', error.message)
    }
  }

  const imageUrl = URL.createObjectURL(file)
  try {
    const image = await loadImageElement(imageUrl, 'image-read')
    return {
      hasText: false,
      imageData: rasterizeImage(
        image,
        image.naturalWidth,
        image.naturalHeight,
        RASTER_IMAGE_MAX_SIDE,
        'image-read',
      ),
      isSvg: false,
    }
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}
