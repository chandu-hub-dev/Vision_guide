import { useCallback, useEffect, useRef, useState } from 'react'
const MIN_CONFIDENCE = 0.4
const ANNOUNCEMENT_COOLDOWN_MS = 12000
const DETECTION_INTERVAL_MS = 650
const FORGET_AFTER_FRAMES = 5

const priority = {
  person: 0,
  car: 1,
  truck: 1,
  bus: 1,
  motorcycle: 1,
  bicycle: 1,
  chair: 2,
  couch: 2,
  'dining table': 2,
  suitcase: 2,
  backpack: 3,
  handbag: 3,
  bottle: 4,
}

export function useVisionGuide() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const modelRef = useRef(null)
  const timerRef = useRef(null)
  const runningRef = useRef(false)
  const generationRef = useRef(0)
  const mutedRef = useRef(false)
  const frameRef = useRef(0)
  const lastSeenRef = useRef(new Map())
  const lastAnnouncedRef = useRef(new Map())
  const [detections, setDetections] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [muted, setMuted] = useState(false)

  const announce = useCallback((label) => {
    if (mutedRef.current || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const speech = new SpeechSynthesisUtterance(`${label} detected ahead.`)
    speech.rate = 0.94
    window.speechSynthesis.speak(speech)
  }, [])

  const detect = useCallback(async function detectFrame() {
    if (!runningRef.current) return

    const video = videoRef.current
    if (video && video.readyState >= 2 && modelRef.current) {
      try {
        const predictions = await modelRef.current.detect(video)
        if (!runningRef.current) return

        const currentFrame = ++frameRef.current
        const visible = predictions.filter(({ score }) => score >= MIN_CONFIDENCE)
        setDetections(visible)

        const labels = new Set(visible.map(({ class: label }) => label))
        let candidate = null
        for (const label of labels) {
          const previousFrame = lastSeenRef.current.get(label)
          const lastAnnouncement = lastAnnouncedRef.current.get(label) ?? 0
          if (
            (previousFrame === undefined || currentFrame - previousFrame > FORGET_AFTER_FRAMES) &&
            Date.now() - lastAnnouncement >= ANNOUNCEMENT_COOLDOWN_MS
          ) {
            const currentPriority = priority[label] ?? 5
            if (!candidate || currentPriority < candidate.currentPriority) {
              candidate = { label, currentPriority }
            }
          }
          lastSeenRef.current.set(label, currentFrame)
        }

        for (const [label, seenFrame] of lastSeenRef.current) {
          if (currentFrame - seenFrame > FORGET_AFTER_FRAMES) lastSeenRef.current.delete(label)
        }

        if (candidate) {
          lastAnnouncedRef.current.set(candidate.label, Date.now())
          announce(candidate.label)
        }
      } catch {
        runningRef.current = false
        setStatus('error')
        setError('Object detection stopped unexpectedly. Restart assistance to try again.')
        return
      }
    }

    if (runningRef.current) timerRef.current = window.setTimeout(detectFrame, DETECTION_INTERVAL_MS)
  }, [announce])

  const pause = useCallback(() => {
    runningRef.current = false
    window.clearTimeout(timerRef.current)
    setDetections([])
    setStatus('paused')
  }, [])

  const resume = useCallback(() => {
    if (!streamRef.current || !modelRef.current) return
    setError('')
    runningRef.current = true
    setStatus('active')
    void detect()
  }, [detect])

  const stop = useCallback(() => {
    generationRef.current += 1
    runningRef.current = false
    window.clearTimeout(timerRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    lastSeenRef.current.clear()
    setDetections([])
    setError('')
    setStatus('idle')
  }, [])

  const start = useCallback(async () => {
    if (streamRef.current) {
      resume()
      return
    }

    const generation = ++generationRef.current
    setError('')
    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      })
      if (generation !== generationRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      if (generation !== generationRef.current) return
      setStatus('loading')

      if (!modelRef.current) {
        const [cocoSsd, tensorflow] = await Promise.all([
          import('@tensorflow-models/coco-ssd'),
          import('@tensorflow/tfjs'),
        ])
        await tensorflow.ready()
        modelRef.current = await cocoSsd.load({ base: 'mobilenet_v2' })
      }
      if (generation !== generationRef.current) return

      frameRef.current = 0
      lastSeenRef.current.clear()
      runningRef.current = true
      setStatus('active')
      void detect()
    } catch (caughtError) {
      if (generation !== generationRef.current) return
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
      setStatus('error')
      if (caughtError?.name === 'NotAllowedError' || caughtError?.name === 'PermissionDeniedError') {
        setError('Camera access was denied. Allow camera access in your browser and try again.')
      } else if (caughtError?.name === 'NotFoundError') {
        setError('No camera was found on this device.')
      } else {
        setError('Could not start the camera or load the vision model. Check your connection and try again.')
      }
    }
  }, [detect, resume])

  const toggleMute = useCallback(() => {
    setMuted((wasMuted) => {
      mutedRef.current = !wasMuted
      if (!wasMuted && 'speechSynthesis' in window) window.speechSynthesis.cancel()
      return !wasMuted
    })
  }, [])

  useEffect(() => () => {
    generationRef.current += 1
    runningRef.current = false
    window.clearTimeout(timerRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])

  return { detections, error, muted, pause, resume, start, status, stop, toggleMute, videoRef }
}