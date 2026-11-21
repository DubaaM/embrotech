import { useEffect, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { GARMENT_VIEWER_SETTINGS } from '../../data/garmentViewerConfig.js'
import { fromShirtPosition, getShirtRegion, SHIRT_REGION_WIDTH_CM, toShirtPosition } from '../../utils/shirtProjection.js'

const MODEL_URL = `${import.meta.env.BASE_URL}models/sandbox/High+Neck+T-shirt.glb`

function GarmentViewer({ artwork, className = '', color, label, onError, onMove, onProjectionError, onReady, placement, value, viewerRef }) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const propsRef = useRef({ artwork, color, onError, onMove, onProjectionError, onReady, placement, value })

  useImperativeHandle(viewerRef, () => ({
    rotate(direction) {
      const viewer = sceneRef.current
      if (!viewer) return
      const offset = viewer.camera.position.clone().sub(viewer.controls.target)
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), direction * Math.PI / 4)
      viewer.camera.position.copy(viewer.controls.target).add(offset)
      viewer.controls.update()
      viewer.render()
    },
    resetCamera() {
      const viewer = sceneRef.current
      if (!viewer) return
      viewer.controls.target.set(0, 0, 0)
      viewer.camera.position.set(0, 0.04, viewer.activeView === 'back' ? -GARMENT_VIEWER_SETTINGS.cameraDistance : GARMENT_VIEWER_SETTINGS.cameraDistance)
      viewer.controls.update()
      viewer.render()
    },
    setAutoRotate(enabled) {
      sceneRef.current?.setAutoRotate(enabled)
    },
    resize() {
      sceneRef.current?.resize()
    },
    zoom(direction) {
      const viewer = sceneRef.current
      if (!viewer) return
      const offset = viewer.camera.position.clone().sub(viewer.controls.target)
      const distance = THREE.MathUtils.clamp(
        offset.length() * (direction > 0 ? 0.8 : 1.25),
        viewer.controls.minDistance,
        viewer.controls.maxDistance,
      )
      viewer.camera.position.copy(viewer.controls.target).add(offset.setLength(distance))
      viewer.controls.update()
      viewer.render()
    },
    download() {
      const viewer = sceneRef.current
      if (!viewer?.ready) return Promise.reject(new Error('The 3D preview is not ready.'))
      viewer.render(true)
      return new Promise((resolve, reject) => {
        viewer.renderer.domElement.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('The 3D preview PNG could not be created.')),
          'image/png',
        )
      })
    },
  }), [])

  useEffect(() => {
    propsRef.current = { artwork, color, onError, onMove, onProjectionError, onReady, placement, value }
    sceneRef.current?.update()
  }, [artwork, color, onError, onMove, onProjectionError, onReady, placement, value])

  useEffect(() => {
    const container = containerRef.current
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    } catch (error) {
      console.error('The 3D preview could not start.', error)
      propsRef.current.onError()
      return undefined
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, GARMENT_VIEWER_SETTINGS.maxPixelRatio))
    renderer.setClearColor(0xf3e9dc)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 20)
    camera.position.set(0, 0.04, GARMENT_VIEWER_SETTINGS.cameraDistance)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.minDistance = GARMENT_VIEWER_SETTINGS.minZoomDistance
    controls.maxDistance = GARMENT_VIEWER_SETTINGS.maxZoomDistance
    controls.minPolarAngle = Math.PI * 0.3
    controls.maxPolarAngle = Math.PI * 0.7
    scene.add(new THREE.HemisphereLight(0xffffff, 0x91857c, 2))
    const light = new THREE.DirectionalLight(0xffffff, 2)
    light.position.set(1, 2, 3)
    scene.add(light)
    const backLight = new THREE.DirectionalLight(0xffffff, 1.4)
    backLight.position.set(-1, 1, -3)
    scene.add(backLight)

    const decals = new THREE.Group()
    scene.add(decals)
    let model = null
    let body = null
    let garmentMaterials = []
    let box = null
    let texture = null
    let textureUrl = ''
    let textureRequest = 0
    let activeView = ''
    let disposed = false
    let dragging = false
    let activeColor = ''
    let colorFrame = 0
    let rotationFrame = 0
    let viewer = null
    let visibilityObserver = null
    let themeObserver = null
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    function render(force = false) {
      if (!disposed && (force || (viewer?.visible && !document.hidden))) renderer.render(scene, camera)
    }

    function updateBodyColor(nextColor) {
      if (!garmentMaterials.length || !nextColor) return
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!activeColor || reduceMotion) {
        garmentMaterials.forEach((material) => material.color.set(nextColor))
        activeColor = nextColor
        render()
        return
      }
      if (activeColor.toLowerCase() === nextColor.toLowerCase()) return
      if (colorFrame) window.cancelAnimationFrame(colorFrame)
      const startColors = garmentMaterials.map((material) => material.color.clone())
      const targetColor = new THREE.Color(nextColor)
      const startedAt = performance.now()
      activeColor = nextColor

      function animateColor(now) {
        const progress = Math.min((now - startedAt) / GARMENT_VIEWER_SETTINGS.colorTransitionMs, 1)
        garmentMaterials.forEach((material, index) => {
          material.color.copy(startColors[index]).lerp(targetColor, progress)
        })
        render()
        if (progress < 1) colorFrame = window.requestAnimationFrame(animateColor)
        else colorFrame = 0
      }

      colorFrame = window.requestAnimationFrame(animateColor)
    }

    function clearDecals() {
      while (decals.children.length) {
        const mesh = decals.children[0]
        decals.remove(mesh)
        mesh.geometry.dispose()
        mesh.material.dispose()
      }
    }

    function updateDecal() {
      clearDecals()
      if (!body || !texture) return
      const { artwork: currentArtwork, placement: currentPlacement, value: currentValue } = propsRef.current
      const back = currentPlacement.view === 'back'
      const surface = body.getObjectByName(back ? 'Cloth_mesh_3' : 'Cloth_mesh_24')
      if (!surface) throw new Error('The shirt surface is missing from the model.')
      const region = getShirtRegion(box)
      const mapped = toShirtPosition(currentValue, currentPlacement.view, region)
      const position = new THREE.Vector3(mapped.x, mapped.y, 0)
      raycaster.set(new THREE.Vector3(position.x, position.y, back ? -2 : 2), new THREE.Vector3(0, 0, back ? 1 : -1))
      const hit = raycaster.intersectObject(surface)[0]
      if (!hit) {
        propsRef.current.onProjectionError(true)
        render()
        return
      }
      position.z = hit.point.z
      const decalWidth = currentValue.size * region.width / SHIRT_REGION_WIDTH_CM
      const geometry = new DecalGeometry(
        surface,
        position,
        new THREE.Euler(0, back ? Math.PI : 0, 0),
        new THREE.Vector3(decalWidth, decalWidth / currentArtwork.aspectRatio, 0.08),
      )
      if (!geometry.getAttribute('position').count) {
        geometry.dispose()
        propsRef.current.onProjectionError(true)
        render()
        return
      }
      propsRef.current.onProjectionError(false)
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
      })
      decals.add(new THREE.Mesh(geometry, material))
      render()
    }

    function rotateFrame() {
      rotationFrame = 0
      if (disposed || !viewer?.visible || !viewer.autoRotate) return
      controls.update()
      rotationFrame = window.requestAnimationFrame(rotateFrame)
    }

    function syncAutoRotate() {
      if (viewer?.visible && !document.hidden && viewer.autoRotate && !rotationFrame) {
        rotationFrame = window.requestAnimationFrame(rotateFrame)
      } else if ((!viewer?.visible || document.hidden || !viewer.autoRotate) && rotationFrame) {
        window.cancelAnimationFrame(rotationFrame)
        rotationFrame = 0
      }
    }

    function handleDocumentVisibility() {
      if (!document.hidden) render()
      syncAutoRotate()
    }

    function setAutoRotate(enabled) {
      if (!viewer) return
      viewer.autoRotate = enabled
      controls.autoRotate = enabled
      syncAutoRotate()
    }

    function resetCamera() {
      controls.target.set(0, 0, 0)
      camera.position.set(0, 0.04, activeView === 'back' ? -GARMENT_VIEWER_SETTINGS.cameraDistance : GARMENT_VIEWER_SETTINGS.cameraDistance)
      controls.update()
      render()
    }

    function updateThemeBackground() {
      const background = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
      if (background) {
        renderer.setClearColor(new THREE.Color(background))
        render()
      }
    }

    function update() {
      if (!model || disposed) return
      const current = propsRef.current
      model.traverse((object) => {
        if (object.isMesh) {
          object.material.metalness = 0
          object.material.roughness = 0.9
        }
      })
      updateBodyColor(current.color)
      if (activeView !== current.placement.view) {
        activeView = current.placement.view
        viewer.activeView = activeView
        const distance = camera.position.distanceTo(controls.target)
        camera.position.set(0, 0.04, activeView === 'back' ? -distance : distance)
        controls.update()
      }
      if (textureUrl !== current.artwork.url) {
        textureUrl = current.artwork.url
        const request = ++textureRequest
        new THREE.TextureLoader().load(textureUrl, (loaded) => {
          if (disposed || request !== textureRequest) {
            loaded.dispose()
            return
          }
          texture?.dispose()
          texture = loaded
          texture.colorSpace = THREE.SRGBColorSpace
          updateDecal()
          viewer.ready = true
          propsRef.current.onReady()
        }, undefined, (error) => {
          if (!disposed && request === textureRequest) {
            console.error('The embroidery texture could not be loaded.', error)
            current.onError()
          }
        })
      }
      updateDecal()
    }

    function updatePointer(event) {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
    }

    function startDrag(event) {
      if (!body || event.button !== 0) return
      updatePointer(event)
      if (!raycaster.intersectObjects(decals.children).length) return
      event.preventDefault()
      event.stopImmediatePropagation()
      dragging = true
      controls.enabled = false
      renderer.domElement.setPointerCapture(event.pointerId)
    }

    function moveDrag(event) {
      if (!dragging) return
      event.preventDefault()
      updatePointer(event)
      const view = propsRef.current.placement.view
      const point = new THREE.Vector3()
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), view === 'back' ? 0.08 : -0.08)
      if (!raycaster.ray.intersectPlane(plane, point)) return
      propsRef.current.onMove({
        ...propsRef.current.value,
        ...fromShirtPosition(point, view, getShirtRegion(box)),
      })
    }

    function endDrag() {
      dragging = false
      controls.enabled = true
    }

    function resize() {
      const width = container.clientWidth
      const height = container.clientHeight
      if (!width || !height) return
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, GARMENT_VIEWER_SETTINGS.maxPixelRatio))
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      render()
    }

    function contextLost(event) {
      event.preventDefault()
      console.error('The 3D preview lost its WebGL context.')
      propsRef.current.onError()
    }

    const canvas = renderer.domElement
    canvas.style.touchAction = 'none'
    canvas.addEventListener('pointerdown', startDrag, true)
    canvas.addEventListener('pointermove', moveDrag)
    canvas.addEventListener('pointerup', endDrag)
    canvas.addEventListener('pointercancel', endDrag)
    canvas.addEventListener('webglcontextlost', contextLost)
    controls.addEventListener('change', render)
    document.addEventListener('visibilitychange', handleDocumentVisibility)
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    viewer = {
      activeView,
      autoRotate: false,
      camera,
      controls,
      render,
      renderer,
      resetCamera,
      resize,
      setAutoRotate,
      update,
      visible: false,
      ready: false,
    }
    sceneRef.current = viewer
    resize()
    updateThemeBackground()

    themeObserver = new MutationObserver(updateThemeBackground)
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] })
    if ('IntersectionObserver' in window) {
      visibilityObserver = new IntersectionObserver(([entry]) => {
        viewer.visible = entry.isIntersecting
        if (viewer.visible) render()
        syncAutoRotate()
      })
      visibilityObserver.observe(container)
    } else {
      viewer.visible = true
    }

    new GLTFLoader().load(MODEL_URL, (gltf) => {
      if (disposed) {
        gltf.scene.traverse((object) => {
          if (object.isMesh) {
            object.geometry.dispose()
            object.material.dispose()
          }
        })
        return
      }
      model = gltf.scene
      body = model.getObjectByName('Cloth')
      if (!body || !body.getObjectByName('Cloth_mesh_3') || !body.getObjectByName('Cloth_mesh_24')) {
        console.error('The supplied shirt model has an unexpected structure.')
        propsRef.current.onError()
        return
      }
      const garmentMaterialSet = new Set()
      body.traverse((object) => {
        if (!object.isMesh) return
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.forEach((material) => {
          if (material.name === GARMENT_VIEWER_SETTINGS.shirtFabricMaterialName && material.color) {
            garmentMaterialSet.add(material)
          }
        })
      })
      garmentMaterials = [...garmentMaterialSet]
      if (!garmentMaterials.length) {
        console.error('The supplied shirt model has no matching fabric material.')
        propsRef.current.onError()
        return
      }
      const originalBox = new THREE.Box3().setFromObject(model)
      model.position.sub(originalBox.getCenter(new THREE.Vector3()))
      scene.add(model)
      model.updateMatrixWorld(true)
      box = new THREE.Box3().setFromObject(model)
      update()
    }, undefined, (error) => {
      if (!disposed) {
        console.error('The shirt model could not be loaded.', error)
        propsRef.current.onError()
      }
    })

    return () => {
      disposed = true
      sceneRef.current = null
      observer.disconnect()
      visibilityObserver?.disconnect()
      themeObserver?.disconnect()
      if (colorFrame) window.cancelAnimationFrame(colorFrame)
      if (rotationFrame) window.cancelAnimationFrame(rotationFrame)
      controls.dispose()
      document.removeEventListener('visibilitychange', handleDocumentVisibility)
      canvas.removeEventListener('pointerdown', startDrag, true)
      canvas.removeEventListener('pointermove', moveDrag)
      canvas.removeEventListener('pointerup', endDrag)
      canvas.removeEventListener('pointercancel', endDrag)
      canvas.removeEventListener('webglcontextlost', contextLost)
      clearDecals()
      texture?.dispose()
      model?.traverse((object) => {
        if (object.isMesh) {
          object.geometry.dispose()
          object.material.dispose()
        }
      })
      renderer.dispose()
      canvas.remove()
    }
  }, [])

  return <div aria-label={label} className={`min-w-0 overflow-hidden rounded-xl bg-bg ${className || 'mt-3 aspect-square w-full'}`} ref={containerRef} role="img" />
}

export default GarmentViewer
