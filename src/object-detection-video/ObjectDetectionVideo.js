import React, { useRef, useCallback } from 'react'

import useWebcam from './useWebcam'
import { getRetinaContext } from './retina-canvas'
import { renderPredictions } from './render-predictions'

const ObjectDetectionVideo = React.memo(
  ({ model, model2, onPrediction, fit, mirrored, render }) => {
    const videoRef = useRef()
    const canvasRef = useRef()
    const plateRef = useRef()


    useWebcam(videoRef, () => {
      detectFrame()
    })

    const detectFrame = useCallback(async () => {
      const predictions = await model.detect(videoRef.current)

      if (onPrediction) {
        onPrediction(predictions, videoRef, plateRef, model2)
      }

      const wantedWidth = videoRef.current.offsetWidth
      const wantedHeight = videoRef.current.offsetHeight
      const videoWidth = videoRef.current.videoWidth
      const videoHeight = videoRef.current.videoHeight

      const scaleX = wantedWidth / videoWidth
      const scaleY = wantedHeight / videoHeight

      let scale
      if (fit === 'aspectFit') {
        scale = Math.min(scaleX, scaleY)
      } else {
        scale = Math.max(scaleX, scaleY)
      }

      const xOffset = (wantedWidth - videoWidth * scale) / 2
      const yOffset = (wantedHeight - videoHeight * scale) / 2

      const ctx = getRetinaContext(canvasRef.current)

      ctx.setWidth(wantedWidth)
      ctx.setHeight(wantedHeight)
      ctx.clearAll()

      // Update predictions to match canvas.
      const offsetPredictions = predictions.map((prediction) => {
        let x = prediction.bbox[0] * scale + xOffset
        const y = prediction.bbox[1] * scale + yOffset
        const width = prediction.bbox[2] * scale
        const height = prediction.bbox[3] * scale

        if (mirrored) {
          x = wantedWidth - x - width
        }
        return { ...prediction, bbox: [x, y, width, height] }
      })

      const renderFunction = render || renderPredictions

      renderFunction(ctx, offsetPredictions)
      requestAnimationFrame(() => {
        detectFrame()
      })
    }, [fit, mirrored, model, model2, onPrediction, render])

    if (canvasRef.current) {
      canvasRef.current.style.position = 'absolute'
      canvasRef.current.style.left = '0'
      canvasRef.current.style.top = '0'
    }
    
    if (plateRef.current) {
      plateRef.current.style.position = 'absolute'
      plateRef.current.style.left = '0'
      plateRef.current.style.top = '100%'
    }

    if (videoRef.current) {
      videoRef.current.style.width = '100%'
      videoRef.current.style.height = '100%'
      if (fit === 'aspectFit') {
        videoRef.current.style.objectFit = 'contain'
      } else {
        videoRef.current.style.objectFit = 'cover'
      }

      if (mirrored) {
        videoRef.current.style.transform = 'scaleX(-1)'
      } else {
        videoRef.current.style.transform = 'scaleX(1)'
      }
    }

    return (
      <div style={{ position: 'relative' }}>
        <video autoPlay playsInline muted ref={videoRef} />
        <canvas ref={canvasRef} />
        <canvas ref={plateRef} hidden/>
      </div>
    )
  }
)

export default ObjectDetectionVideo
