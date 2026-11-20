import { useRef } from 'react'
import { matchPath, useLocation } from 'react-router-dom'
import useBackgroundStitch from '../hooks/useBackgroundStitch'

function StitchCanvas() {
  const canvasRef = useRef(null)
  useBackgroundStitch(canvasRef)

  return <canvas aria-hidden="true" className="background-stitch" height="0" ref={canvasRef} width="0" />
}

function BackgroundStitch() {
  const { pathname } = useLocation()
  const isSandbox = matchPath('/:language/skusobna', pathname) || matchPath('/:language/try-it', pathname)
  return isSandbox ? null : <StitchCanvas />
}

export default BackgroundStitch
