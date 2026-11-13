import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import sampleLogo from '../assets/sandbox/sample-logo.svg'
import ColorEditor from '../components/sandbox/ColorEditor.jsx'
import {
  loadImageData,
  renderEmbroidery,
  resizeImageData,
} from '../utils/embroidery.js'
import { inspectSvgColors, replaceSvgColors } from '../utils/svgColors.js'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_SVG_FILE_SIZE = 2 * 1024 * 1024
const FALLBACK_IMAGE_SIDE = 600
const PREVIEW_IMAGE_SIDE = 480
const FILE_TYPES = {
  svg: { mimeType: 'image/svg+xml', isSvg: true },
  png: { mimeType: 'image/png', isSvg: false },
  jpg: { mimeType: 'image/jpeg', isSvg: false },
  jpeg: { mimeType: 'image/jpeg', isSvg: false },
  webp: { mimeType: 'image/webp', isSvg: false },
}
const IMAGE_ERROR_KEYS = {
  'svg-unsupported': 'sandbox.errors.svgUnsupported',
  'svg-invalid': 'sandbox.errors.svgInvalid',
  'svg-dimensions': 'sandbox.errors.svgDimensions',
  'svg-render': 'sandbox.errors.svgRender',
  'image-read': 'sandbox.errors.imageRead',
}

const FABRICS = [
  { id: 'cream', color: '#FEF3E2' },
  { id: 'black', color: '#000000' },
  { id: 'navy', color: '#14263F' },
  { id: 'white', color: '#FFFFFF' },
  { id: 'brown', color: '#2A1A0E' },
]

function validateFile(file, t) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  const fileType = FILE_TYPES[extension]
  const mimeType = (file.type ?? '').toLowerCase().split(';')[0].trim()

  if (!fileType || mimeType !== fileType.mimeType) {
    return { error: t('sandbox.errors.fileType'), isSvg: false }
  }
  if (file.size > (fileType.isSvg ? MAX_SVG_FILE_SIZE : MAX_FILE_SIZE)) {
    return {
      error: t(
        fileType.isSvg
          ? 'sandbox.errors.svgFileSize'
          : 'sandbox.errors.rasterFileSize',
      ),
      isSvg: fileType.isSvg,
    }
  }

  return { error: '', isSvg: fileType.isSvg }
}

function createThumbnailUrl(imageData) {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('A 2D canvas context is unavailable for the SVG thumbnail.')
  }

  context.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

function Sandbox() {
  const { t } = useTranslation()
  const { language } = useParams()
  const [sourceImageData, setSourceImageData] = useState(null)
  const [sourceFile, setSourceFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isSvgFile, setIsSvgFile] = useState(false)
  const [svgHasText, setSvgHasText] = useState(false)
  const [svgColorInfo, setSvgColorInfo] = useState(null)
  const [colorReplacements, setColorReplacements] = useState({})
  const [isColorPreviewUpdate, setIsColorPreviewUpdate] = useState(false)
  const [status, setStatus] = useState('empty')
  const [errorMessage, setErrorMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [threadColors, setThreadColors] = useState(4)
  const [fabricId, setFabricId] = useState('cream')
  const [density, setDensity] = useState(2)
  const [treatWhiteAsBackground, setTreatWhiteAsBackground] = useState(true)
  const [quality, setQuality] = useState('realistic')
  const [relief, setRelief] = useState(55)
  const [hasPreview, setHasPreview] = useState(false)

  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)
  const workerRef = useRef(null)
  const latestRequestRef = useRef(0)
  const uploadRequestRef = useRef(0)
  const colorRequestRef = useRef(0)
  const colorEditTimerRef = useRef(0)
  const originalSvgTextRef = useRef('')
  const colorReplacementsRef = useRef({})
  const sourceImageDataRef = useRef(null)
  const optionsRef = useRef(null)
  const fallbackRenderRef = useRef(null)
  const translateRef = useRef(t)
  const objectUrlRef = useRef('')

  const selectedFabric = FABRICS.find((fabric) => fabric.id === fabricId)

  function showProcessingError(error) {
    console.error('Embroidery preview could not be rendered.', error)
    setErrorMessage(translateRef.current('sandbox.errors.processing'))
    setStatus('error')
  }

  function clearSvgColorEditor() {
    colorRequestRef.current += 1
    window.clearTimeout(colorEditTimerRef.current)
    colorEditTimerRef.current = 0
    originalSvgTextRef.current = ''
    colorReplacementsRef.current = {}
    setSvgColorInfo(null)
    setColorReplacements({})
    setIsColorPreviewUpdate(false)
  }

  function renderFallback(requestId, preview = false) {
    const imageData = sourceImageDataRef.current
    if (!imageData || requestId !== latestRequestRef.current) {
      return
    }

    try {
      const smallerImage = resizeImageData(
        imageData,
        preview ? PREVIEW_IMAGE_SIDE : FALLBACK_IMAGE_SIDE,
      )
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }

      canvas.width = smallerImage.width
      canvas.height = smallerImage.height
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('A 2D canvas context is unavailable for the preview.')
      }

      renderEmbroidery(context, smallerImage, {
        ...optionsRef.current,
        preview,
      })
      if (requestId === latestRequestRef.current) {
        setHasPreview(true)
        if (!preview) {
          setStatus('done')
        }
      }
    } catch (error) {
      if (requestId === latestRequestRef.current) {
        showProcessingError(error)
      }
    }
  }

  function clearPreview() {
    clearSvgColorEditor()
    uploadRequestRef.current += 1
    latestRequestRef.current += 1
    sourceImageDataRef.current = null
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = ''
    }

    setSourceImageData(null)
    setSourceFile(null)
    setPreviewUrl('')
    setIsSvgFile(false)
    setSvgHasText(false)
    setErrorMessage('')
    setStatus('empty')
    setTreatWhiteAsBackground(true)
    setThreadColors(4)
    setFabricId('cream')
    setDensity(2)
    setQuality('realistic')
    setRelief(55)
    setHasPreview(false)
  }

  function beginReprocessing() {
    if (sourceImageDataRef.current) {
      setIsColorPreviewUpdate(false)
      setErrorMessage('')
      setStatus('processing')
    }
  }

  function scheduleSvgColorUpdate(nextReplacements) {
    colorReplacementsRef.current = nextReplacements
    setColorReplacements(nextReplacements)
    setIsColorPreviewUpdate(true)
    setErrorMessage('')
    setStatus('processing')
    latestRequestRef.current += 1
    colorRequestRef.current += 1
    const requestId = colorRequestRef.current
    window.clearTimeout(colorEditTimerRef.current)
    colorEditTimerRef.current = window.setTimeout(async () => {
      try {
        const editedSvg = replaceSvgColors(
          originalSvgTextRef.current,
          nextReplacements,
        )
        const editedFile = new File([editedSvg], sourceFile?.name ?? 'edited.svg', {
          type: 'image/svg+xml',
        })
        const { imageData } = await loadImageData(editedFile)
        if (requestId !== colorRequestRef.current) {
          return
        }

        setPreviewUrl(createThumbnailUrl(imageData))
        sourceImageDataRef.current = imageData
        setSourceImageData(imageData)
      } catch (error) {
        if (requestId === colorRequestRef.current) {
          console.error('The edited SVG could not be loaded.', error)
          const errorKey =
            IMAGE_ERROR_KEYS[error?.name] ?? 'sandbox.errors.svgRender'
          setErrorMessage(t(errorKey))
          setStatus('error')
        }
      }
    }, 250)
  }

  function handleSvgColorChange(sourceColor, replacement) {
    const nextReplacements = { ...colorReplacementsRef.current }
    if (!replacement || replacement.toLowerCase() === sourceColor.toLowerCase()) {
      delete nextReplacements[sourceColor]
    } else {
      nextReplacements[sourceColor] = replacement
    }
    scheduleSvgColorUpdate(nextReplacements)
  }

  function resetSvgColors() {
    if (Object.keys(colorReplacementsRef.current).length) {
      scheduleSvgColorUpdate({})
    }
  }

  async function handleFile(file) {
    if (!file) {
      return
    }

    const wasSvgFile = isSvgFile
    clearSvgColorEditor()
    const uploadRequest = uploadRequestRef.current + 1
    uploadRequestRef.current = uploadRequest
    latestRequestRef.current += 1
    sourceImageDataRef.current = null

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = ''
    }

    setSourceImageData(null)
    setSourceFile(null)
    setPreviewUrl('')
    setIsSvgFile(false)
    setSvgHasText(false)
    setHasPreview(false)
    setErrorMessage('')

    const validation = validateFile(file, t)
    if (validation.error) {
      if (wasSvgFile) {
        setTreatWhiteAsBackground(true)
      }
      setErrorMessage(validation.error)
      setStatus('error')
      return
    }

    setIsSvgFile(validation.isSvg)
    if (validation.isSvg) {
      setTreatWhiteAsBackground(false)
    } else if (wasSvgFile) {
      setTreatWhiteAsBackground(true)
    }

    if (!validation.isSvg) {
      const imageUrl = URL.createObjectURL(file)
      objectUrlRef.current = imageUrl
      setPreviewUrl(imageUrl)
    }
    setSourceFile(file)
    setStatus('processing')

    try {
      const { hasText, imageData } = await loadImageData(file)
      if (uploadRequest !== uploadRequestRef.current) {
        return
      }

      if (validation.isSvg) {
        const svgText = await file.text()
        const colorInfo = inspectSvgColors(svgText)
        if (uploadRequest !== uploadRequestRef.current) {
          return
        }
        originalSvgTextRef.current = svgText
        setSvgColorInfo(colorInfo)
        setPreviewUrl(createThumbnailUrl(imageData))
        setSvgHasText(hasText)
      }
      sourceImageDataRef.current = imageData
      setSourceImageData(imageData)
    } catch (error) {
      if (uploadRequest === uploadRequestRef.current) {
        console.error('The selected image could not be loaded.', error)
        const errorKey =
          IMAGE_ERROR_KEYS[error?.name] ??
          (validation.isSvg
            ? 'sandbox.errors.svgRender'
            : 'sandbox.errors.imageRead')
        setErrorMessage(t(errorKey))
        setStatus('error')
      }
    }
  }

  async function loadSample() {
    clearSvgColorEditor()
    const uploadRequest = uploadRequestRef.current + 1
    uploadRequestRef.current = uploadRequest
    latestRequestRef.current += 1
    setSourceImageData(null)
    sourceImageDataRef.current = null
    setSourceFile(null)
    setPreviewUrl('')
    setIsSvgFile(false)
    setSvgHasText(false)
    setHasPreview(false)
    setErrorMessage('')
    setStatus('processing')
    setTreatWhiteAsBackground(true)

    try {
      const response = await fetch(sampleLogo)
      if (!response.ok) {
        throw new Error(`Sample image request failed with status ${response.status}.`)
      }

      const file = new File([await response.blob()], 'sample-logo.svg', {
        type: 'image/svg+xml',
      })
      if (uploadRequest === uploadRequestRef.current) {
        await handleFile(file)
      }
    } catch (error) {
      if (uploadRequest === uploadRequestRef.current) {
        console.error('The sample embroidery image could not be loaded.', error)
        setErrorMessage(t('sandbox.errors.sample'))
        setStatus('error')
      }
    }
  }

  useEffect(() => {
    optionsRef.current = {
      density,
      fabricColor: selectedFabric.color,
      quality,
      relief,
      threadColors,
      treatWhiteAsBackground,
    }
    translateRef.current = t
    fallbackRenderRef.current = renderFallback
  })

  useEffect(() => {
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') {
      return undefined
    }

    let worker
    try {
      worker = new Worker(
        new URL('../workers/embroidery.worker.js', import.meta.url),
        { type: 'module' },
      )
    } catch (error) {
      console.error('The embroidery worker could not be started.', error)
      return undefined
    }

    workerRef.current = worker
    worker.addEventListener('message', (event) => {
      const result = event.data
      if (result.requestId !== latestRequestRef.current) {
        result.bitmap?.close()
        return
      }

      if (result.type === 'fallback') {
        worker.terminate()
        if (workerRef.current === worker) {
          workerRef.current = null
        }
        fallbackRenderRef.current?.(result.requestId, result.preview)
        return
      }

      if (result.type === 'error') {
        console.error('The embroidery worker could not render the preview.', result.message)
        worker.terminate()
        if (workerRef.current === worker) {
          workerRef.current = null
        }
        fallbackRenderRef.current?.(result.requestId, result.preview)
        return
      }

      if (result.type === 'result') {
        const canvas = canvasRef.current
        const context = canvas?.getContext('2d')
        if (!canvas || !context) {
          result.bitmap.close()
          showProcessingError(new Error('A 2D canvas context is unavailable for the preview.'))
          return
        }

        canvas.width = result.width
        canvas.height = result.height
        canvas.getContext('2d')?.drawImage(result.bitmap, 0, 0)
        result.bitmap.close()
        setHasPreview(true)
        if (!result.preview) {
          setStatus('done')
        }
      }
    })
    worker.addEventListener('error', (event) => {
      console.error('The embroidery worker encountered an error.', event.message)
      if (workerRef.current === worker) {
        workerRef.current = null
      }
      worker.terminate()
      fallbackRenderRef.current?.(latestRequestRef.current)
    })

    return () => {
      worker.terminate()
      if (workerRef.current === worker) {
        workerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!sourceImageData) {
      return undefined
    }

    const requestId = latestRequestRef.current + 1
    latestRequestRef.current = requestId
    function sendRender(imageData, preview) {
      const worker = workerRef.current
      if (!worker) {
        fallbackRenderRef.current?.(requestId, preview)
        return
      }

      try {
        const data = imageData.data.slice()
        worker.postMessage(
          {
            data: data.buffer,
            height: imageData.height,
            options: { ...optionsRef.current, preview },
            preview,
            requestId,
            width: imageData.width,
          },
          [data.buffer],
        )
      } catch (error) {
        console.error('The embroidery worker request could not be sent.', error)
        worker.terminate()
        if (workerRef.current === worker) {
          workerRef.current = null
        }
        fallbackRenderRef.current?.(requestId, preview)
      }
    }

    sendRender(resizeImageData(sourceImageData, PREVIEW_IMAGE_SIDE), true)
    const timeoutId = window.setTimeout(() => {
      if (requestId === latestRequestRef.current) {
        sendRender(sourceImageData, false)
      }
    }, 400)

    return () => {
      window.clearTimeout(timeoutId)
      latestRequestRef.current += 1
    }
  }, [
    density,
    fabricId,
    quality,
    relief,
    sourceImageData,
    threadColors,
    treatWhiteAsBackground,
  ])

  useEffect(
    () => () => {
      uploadRequestRef.current += 1
      colorRequestRef.current += 1
      latestRequestRef.current += 1
      window.clearTimeout(colorEditTimerRef.current)
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    },
    [],
  )

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    void handleFile(event.dataTransfer.files[0])
  }

  function downloadPreview() {
    const canvas = canvasRef.current
    if (!canvas || status !== 'done') {
      return
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        setErrorMessage(t('sandbox.errors.download'))
        setStatus('error')
        return
      }

      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = 'embroidery-preview.png'
      document.body.append(link)
      link.click()
      window.setTimeout(() => {
        link.remove()
        URL.revokeObjectURL(downloadUrl)
      }, 1000)
    }, 'image/png')
  }

  const statusText =
    status === 'processing'
      ? t('sandbox.status.processing')
      : status === 'done'
        ? t(
            isColorPreviewUpdate
              ? 'sandbox.status.previewUpdated'
              : 'sandbox.status.done',
          )
        : status === 'error'
          ? errorMessage
          : ''
  const email = t('contact.info.emailValue').trim()

  return (
    <section
      aria-labelledby="sandbox-title"
      className="px-4 py-16 sm:py-20 lg:py-24 motion-safe:animate-fade-in-up motion-reduce:animate-none"
    >
      <div className="mx-auto max-w-7xl">
        <header className="mx-auto max-w-3xl text-center">
          <h1
            className="text-4xl font-bold tracking-tight text-text sm:text-5xl"
            id="sandbox-title"
          >
            {t('sandbox.title')}
          </h1>
          <p className="mt-4 text-lg leading-7 text-muted">
            {t('sandbox.description')}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            {t('sandbox.illustrationNote')}
          </p>
        </header>

        <div className="mt-10 grid items-stretch gap-8 lg:grid-cols-2">
          <section
            aria-labelledby="sandbox-upload-title"
            className="glass rounded-2xl p-6 sm:p-8"
          >
            <h2 className="text-xl font-bold text-text" id="sandbox-upload-title">
              {t('sandbox.upload.title')}
            </h2>
            <input
              accept=".svg,image/svg+xml,.png,image/png,.jpg,.jpeg,image/jpeg,.webp,image/webp"
              className="hidden"
              onChange={(event) => {
                void handleFile(event.target.files[0])
                event.target.value = ''
              }}
              ref={fileInputRef}
              type="file"
            />
            <button
              className={`mt-4 flex min-h-36 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-6 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                isDragging
                  ? 'border-brand bg-brand/10'
                  : 'border-border bg-surface/40 hover:border-brand'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(event) => {
                event.preventDefault()
                setIsDragging(false)
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              type="button"
            >
              <span className="font-semibold text-text">
                {isDragging
                  ? t('sandbox.upload.dropActive')
                  : t('sandbox.upload.dropPrompt')}
              </span>
              <span className="mt-2 text-sm font-semibold leading-6 text-brand">
                {t('sandbox.upload.bestResult')}
              </span>
              <span className="text-sm leading-6 text-muted">
                {t('sandbox.upload.transparentPngTip')}
              </span>
              <span className="text-xs leading-5 text-muted">
                {t('sandbox.upload.fileHint')}
              </span>
              <span className="text-xs leading-5 text-muted">
                {t('sandbox.upload.rasterQualityHint')}
              </span>
            </button>

            {previewUrl && sourceFile ? (
              <div className="mt-4 flex items-center gap-4 rounded-xl border border-border bg-surface/40 p-3">
                <img
                  alt={t('sandbox.upload.thumbnailAlt')}
                  className="size-16 rounded-lg bg-white object-contain"
                  height="64"
                  src={previewUrl}
                  width="64"
                />
                <p className="min-w-0 break-all text-sm font-medium text-text">
                  {sourceFile.name}
                </p>
              </div>
            ) : null}

            {isSvgFile && svgColorInfo ? (
              <ColorEditor
                colors={svgColorInfo.colors}
                hasMoreColors={svgColorInfo.hasMoreColors}
                hasUneditableColors={svgColorInfo.hasUneditableColors}
                onChange={handleSvgColorChange}
                onReset={resetSvgColors}
                replacements={colorReplacements}
              />
            ) : null}

            <div className="mt-6 space-y-6">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <label
                    className="font-semibold text-text"
                    htmlFor="sandbox-thread-colors"
                  >
                    {t('sandbox.controls.threadColors')}
                  </label>
                  <output
                    className="min-w-8 text-right font-semibold text-brand"
                    htmlFor="sandbox-thread-colors"
                  >
                    {threadColors}
                  </output>
                </div>
                <input
                  className="mt-3 w-full accent-brand"
                  id="sandbox-thread-colors"
                  max="8"
                  min="2"
                  onChange={(event) => {
                    beginReprocessing()
                    setThreadColors(Number(event.target.value))
                  }}
                  type="range"
                  value={threadColors}
                />
                <div
                  aria-hidden="true"
                  className="flex justify-between text-xs text-muted"
                >
                  <span>2</span>
                  <span>8</span>
                </div>
              </div>

              <fieldset>
                <legend className="font-semibold text-text">
                  {t('sandbox.controls.fabric')}
                </legend>
                <div className="mt-3 flex flex-wrap gap-3">
                  {FABRICS.map((fabric) => (
                    <button
                      aria-label={t(`sandbox.fabrics.${fabric.id}`)}
                      aria-pressed={fabricId === fabric.id}
                      className={`flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                        fabricId === fabric.id
                          ? 'border-brand ring-2 ring-brand/40'
                          : 'border-border'
                      }`}
                      key={fabric.id}
                      onClick={() => {
                        beginReprocessing()
                        setFabricId(fabric.id)
                      }}
                      type="button"
                    >
                      <span
                        aria-hidden="true"
                        className="size-5 rounded-full border border-black/20"
                        style={{ backgroundColor: fabric.color }}
                      />
                      {t(`sandbox.fabrics.${fabric.id}`)}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="font-semibold text-text">
                  {t('sandbox.controls.density')}
                </legend>
                <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface/50 p-1">
                  {['fine', 'medium', 'coarse'].map((option, index) => (
                    <label className="cursor-pointer" key={option}>
                      <input
                        checked={density === index + 1}
                        className="peer sr-only"
                        name="sandbox-density"
                        onChange={() => {
                          beginReprocessing()
                          setDensity(index + 1)
                        }}
                        type="radio"
                        value={index + 1}
                      />
                      <span className="flex min-h-11 items-center justify-center rounded-lg px-2 text-center text-sm font-medium text-text transition-all duration-200 motion-reduce:transition-none peer-checked:bg-brand peer-checked:text-on-brand peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
                        {t(`sandbox.controls.densityOptions.${option}`)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="font-semibold text-text">
                  {t('sandbox.controls.quality')}
                </legend>
                <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface/50 p-1">
                  {['simple', 'realistic'].map((option) => (
                    <label className="cursor-pointer" key={option}>
                      <input
                        checked={quality === option}
                        className="peer sr-only"
                        name="sandbox-quality"
                        onChange={() => {
                          beginReprocessing()
                          setQuality(option)
                        }}
                        type="radio"
                        value={option}
                      />
                      <span className="flex min-h-11 items-center justify-center rounded-lg px-3 text-center font-medium text-text transition-all duration-200 motion-reduce:transition-none peer-checked:bg-brand peer-checked:text-on-brand peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
                        {t(`sandbox.controls.qualityOptions.${option}`)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <label
                    className="font-semibold text-text"
                    htmlFor="sandbox-relief"
                  >
                    {t('sandbox.controls.relief')}
                  </label>
                  <output
                    className="text-sm font-semibold text-brand"
                    htmlFor="sandbox-relief"
                  >
                    {relief}%
                  </output>
                </div>
                <input
                  aria-describedby={
                    quality === 'simple'
                      ? 'sandbox-relief-simple-note'
                      : undefined
                  }
                  className="mt-3 w-full accent-brand"
                  disabled={quality === 'simple'}
                  id="sandbox-relief"
                  max="100"
                  min="0"
                  onChange={(event) => {
                    beginReprocessing()
                    setRelief(Number(event.target.value))
                  }}
                  type="range"
                  value={relief}
                />
                {quality === 'simple' ? (
                  <p
                    className="mt-1 text-sm leading-6 text-muted"
                    id="sandbox-relief-simple-note"
                  >
                    {t('sandbox.controls.reliefSimpleNote')}
                  </p>
                ) : null}
              </div>

              <label
                className={`flex min-h-11 items-center gap-3 text-sm font-medium ${
                  isSvgFile ? 'text-muted' : 'text-text'
                }`}
              >
                <input
                  aria-describedby={
                    isSvgFile ? 'sandbox-svg-white-note' : undefined
                  }
                  checked={treatWhiteAsBackground}
                  className="size-4 accent-brand"
                  disabled={isSvgFile}
                  onChange={(event) => {
                    beginReprocessing()
                    setTreatWhiteAsBackground(event.target.checked)
                  }}
                  type="checkbox"
                />
                {t('sandbox.controls.whiteBackground')}
              </label>
              {isSvgFile ? (
                <p
                  className="-mt-4 text-sm leading-6 text-muted"
                  id="sandbox-svg-white-note"
                >
                  {t('sandbox.controls.svgWhiteBackgroundNote')}
                </p>
              ) : null}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 py-2.5 font-semibold text-on-brand shadow-sm motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:hover:shadow-lg motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                onClick={() => void loadSample()}
                type="button"
              >
                {t('sandbox.upload.sampleButton')}
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface px-5 py-2.5 font-semibold text-text motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:hover:shadow-md motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                onClick={clearPreview}
                type="button"
              >
                {t('sandbox.controls.reset')}
              </button>
            </div>
          </section>

          <section
            aria-labelledby="sandbox-result-title"
            className="glass rounded-2xl p-6 sm:p-8 lg:sticky lg:top-24 lg:self-start"
          >
            <h2 className="text-xl font-bold text-text" id="sandbox-result-title">
              {t('sandbox.result.title')}
            </h2>
            <p
              aria-live="polite"
              className={`mt-2 min-h-6 text-sm ${
                status === 'error' ? 'font-medium text-text' : 'text-muted'
              }`}
              role="status"
            >
              {statusText}
            </p>
            <div className="mt-4 flex min-h-72 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface/40 p-3 sm:min-h-96">
              <canvas
                aria-hidden={!hasPreview || status === 'error'}
                aria-label={t('sandbox.result.canvasLabel', {
                  fabric: t(`sandbox.fabrics.${fabricId}`),
                })}
                className={`h-auto max-w-full rounded-lg ${
                  hasPreview && status !== 'error' ? '' : 'hidden'
                }`}
                ref={canvasRef}
                role="img"
              />
              {!hasPreview && status !== 'processing' ? (
                <p className="max-w-sm text-center text-sm leading-6 text-muted">
                  {t('sandbox.result.empty')}
                </p>
              ) : null}
            </div>
            {isSvgFile && svgHasText ? (
              <p className="mt-3 text-sm leading-6 text-muted">
                {t('sandbox.result.svgTextNote')}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 py-2.5 font-semibold text-on-brand shadow-sm motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:hover:shadow-lg motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
                disabled={status !== 'done'}
                onClick={downloadPreview}
                type="button"
              >
                {t('sandbox.controls.download')}
              </button>
              {status === 'done' ? (
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface px-5 py-2.5 font-semibold text-text motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:hover:shadow-md motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  to={`/${language}/contact`}
                >
                  {t('sandbox.quoteButton')}
                </Link>
              ) : null}
            </div>

            {status === 'done' ? (
              <p className="mt-4 text-sm leading-6 text-muted">
                {t('sandbox.emailNoteBefore')}{' '}
                <a
                  className="font-semibold text-brand underline underline-offset-2"
                  href={`mailto:${email}`}
                >
                  {email}
                </a>
                {t('sandbox.emailNoteAfter')}
              </p>
            ) : null}
          </section>
        </div>

        <p className="glass mx-auto mt-7 max-w-3xl rounded-xl px-5 py-3 text-center text-sm leading-6 text-muted">
          {t('sandbox.privacyNote')}
        </p>
      </div>
    </section>
  )
}

export default Sandbox
