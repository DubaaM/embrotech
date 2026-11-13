import { renderEmbroidery } from '../utils/embroidery.js'

self.addEventListener('message', (event) => {
  const { data, height, options, preview = false, requestId, width } = event.data

  if (typeof OffscreenCanvas !== 'function') {
    self.postMessage({ preview, requestId, type: 'fallback' })
    return
  }

  try {
    const canvas = new OffscreenCanvas(width, height)
    if (typeof canvas.transferToImageBitmap !== 'function') {
      self.postMessage({ preview, requestId, type: 'fallback' })
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('A worker 2D canvas context is unavailable.')
    }

    const imageData = new ImageData(new Uint8ClampedArray(data), width, height)
    renderEmbroidery(context, imageData, { ...options, preview })
    const bitmap = canvas.transferToImageBitmap()

    self.postMessage(
      { bitmap, height, preview, requestId, type: 'result', width },
      [bitmap],
    )
  } catch (error) {
    self.postMessage({
      message: error instanceof Error ? error.message : String(error),
      preview,
      requestId,
      type: 'error',
    })
  }
})
