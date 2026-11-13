const MAX_EDITABLE_COLORS = 12
const SKIPPED_COLORS = new Set(['none', 'transparent', 'currentcolor'])

function parseSvgDocument(svgText) {
  const document = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const root = document.documentElement
  if (
    !root ||
    root.localName.toLowerCase() !== 'svg' ||
    document.getElementsByTagName('parsererror').length > 0
  ) {
    throw new Error('The SVG document could not be parsed.')
  }
  return document
}

function normalizeColor(value, context) {
  let color = String(value ?? '')
    .trim()
    .replace(/\s*!important\s*$/i, '')
    .toLowerCase()

  if (
    !color ||
    SKIPPED_COLORS.has(color) ||
    /^url\s*\(/i.test(color)
  ) {
    return null
  }

  const shortHex = color.match(/^#([0-9a-f]{3})$/i)
  if (shortHex) {
    color = `#${[...shortHex[1]].map((digit) => `${digit}${digit}`).join('')}`
  }
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    return color.toLowerCase()
  }
  if (!/^(?:rgba?|hsla?)\([^)]*\)$|^[a-z]+$/i.test(color)) {
    return null
  }

  let valid = false
  for (const sentinel of ['#010203', '#040506']) {
    context.fillStyle = sentinel
    context.fillStyle = color
    if (context.fillStyle !== sentinel) {
      valid = true
      break
    }
  }
  if (!valid) {
    return null
  }

  context.clearRect(0, 0, 1, 1)
  context.fillStyle = color
  context.fillRect(0, 0, 1, 1)
  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data
  if (alpha === 0) {
    return null
  }

  return `#${[red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`
}

function getColorContext() {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new Error('A 2D canvas context is unavailable for SVG color parsing.')
  }
  return context
}

function getInlinePaintValues(styleText) {
  return styleText
    .split(';')
    .flatMap((declaration) => {
      const separator = declaration.indexOf(':')
      if (separator < 0) {
        return []
      }
      const property = declaration.slice(0, separator).trim().toLowerCase()
      return property === 'fill' || property === 'stroke'
        ? [declaration.slice(separator + 1).trim()]
        : []
    })
}

function getPaintValues(element) {
  const values = []
  for (const property of ['fill', 'stroke']) {
    if (element.hasAttribute(property)) {
      values.push(element.getAttribute(property))
    }
  }
  if (element.hasAttribute('style')) {
    values.push(...getInlinePaintValues(element.getAttribute('style')))
  }
  return values
}

/* Collect editable paint colors without inserting the SVG into the page. */
export function inspectSvgColors(svgText) {
  const document = parseSvgDocument(svgText)
  const root = document.documentElement
  const elements = [root, ...Array.from(root.getElementsByTagName('*'))]
  const context = getColorContext()
  const groupedColors = new Map()

  for (const element of elements) {
    const elementColors = new Set()
    for (const value of getPaintValues(element)) {
      const color = normalizeColor(value, context)
      if (color) {
        elementColors.add(color)
      }
    }
    for (const color of elementColors) {
      const group = groupedColors.get(color) ?? new Set()
      group.add(element)
      groupedColors.set(color, group)
    }
  }

  const colors = [...groupedColors.entries()].map(([hex, groupedElements]) => ({
    elementCount: groupedElements.size,
    hex,
  }))

  return {
    colors: colors.slice(0, MAX_EDITABLE_COLORS),
    hasMoreColors: colors.length > MAX_EDITABLE_COLORS,
    hasUneditableColors:
      document.getElementsByTagName('style').length > 0 ||
      elements.some((element) => element.hasAttribute('class')),
  }
}

function replaceInlinePaints(styleText, replacements, context) {
  return styleText
    .split(';')
    .map((declaration) => {
      const separator = declaration.indexOf(':')
      if (separator < 0) {
        return declaration
      }

      const property = declaration.slice(0, separator).trim().toLowerCase()
      if (property !== 'fill' && property !== 'stroke') {
        return declaration
      }

      const value = declaration.slice(separator + 1)
      const leadingWhitespace = value.match(/^\s*/)[0]
      const trailingWhitespace = value.match(/\s*$/)[0]
      const trimmedValue = value.trim()
      const priority = trimmedValue.match(/\s*!important\s*$/i)?.[0] ?? ''
      const paint = priority
        ? trimmedValue.slice(0, -priority.length).trimEnd()
        : trimmedValue
      const replacement = replacements.get(normalizeColor(paint, context))
      if (!replacement) {
        return declaration
      }

      return `${declaration.slice(0, separator + 1)}${leadingWhitespace}${replacement}${priority}${trailingWhitespace}`
    })
    .join(';')
}

/* Replace selected fill and stroke colors and serialize the edited SVG. */
export function replaceSvgColors(svgText, colorReplacements) {
  const document = parseSvgDocument(svgText)
  const context = getColorContext()
  const replacements = new Map()

  for (const [source, target] of Object.entries(colorReplacements)) {
    const normalizedSource = normalizeColor(source, context)
    const normalizedTarget = normalizeColor(target, context)
    if (normalizedSource && normalizedTarget) {
      replacements.set(normalizedSource, normalizedTarget)
    }
  }

  const root = document.documentElement
  const elements = [root, ...Array.from(root.getElementsByTagName('*'))]
  for (const element of elements) {
    for (const property of ['fill', 'stroke']) {
      if (!element.hasAttribute(property)) {
        continue
      }
      const source = normalizeColor(element.getAttribute(property), context)
      const replacement = replacements.get(source)
      if (replacement) {
        element.setAttribute(property, replacement)
      }
    }

    if (element.hasAttribute('style')) {
      element.setAttribute(
        'style',
        replaceInlinePaints(element.getAttribute('style'), replacements, context),
      )
    }
  }

  return new XMLSerializer().serializeToString(document)
}
