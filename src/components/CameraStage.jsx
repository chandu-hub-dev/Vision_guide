import { useEffect, useRef, useState } from 'react'
import { Camera, ScanLine } from 'lucide-react'

const statusLabels = {
  idle: 'CAMERA OFF',
  requesting: 'CONNECTING',
  loading: 'PREPARING MODEL',
  active: 'SCANNING LIVE',
  paused: 'PAUSED',
  error: 'CAMERA ISSUE',
}

const urgentLabels = new Set(['person', 'car', 'truck', 'bus', 'motorcycle', 'bicycle'])

export function CameraStage({ detections, status, videoRef }) {
  const stageRef = useRef(null)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return undefined
    const observer = new ResizeObserver(([entry]) => {
      setStageSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  const scale = stageSize.width && frameSize.width
    ? Math.max(stageSize.width / frameSize.width, stageSize.height / frameSize.height)
    : 0
  const offsetX = (stageSize.width - frameSize.width * scale) / 2
  const offsetY = (stageSize.height - frameSize.height * scale) / 2

  return (
    <div className={`camera-card${status === 'active' ? ' is-scanning' : ''}`}>
      <div className="camera-card-head">
        <div className="camera-title"><span className="camera-title-icon"><Camera size={17} /></span> CAMERA VIEW</div>
        <div className={`camera-status status-${status}`}><span />{statusLabels[status]}</div>
      </div>
      <div className="camera-stage" ref={stageRef}>
        <video
          ref={videoRef}
          className="camera-feed"
          autoPlay
          muted
          playsInline
          aria-label="Live camera view"
          onLoadedMetadata={(event) => setFrameSize({ width: event.currentTarget.videoWidth, height: event.currentTarget.videoHeight })}
        />
        {status !== 'active' && status !== 'paused' && (
          <div className="camera-placeholder">
            <div className="placeholder-mark"><ScanLine size={32} strokeWidth={1.35} /></div>
            <span>{status === 'loading' ? 'Getting the scene ready' : status === 'requesting' ? 'Waiting for camera access' : 'Your surroundings will appear here'}</span>
            {status === 'idle' && <small>Start assistance to begin</small>}
          </div>
        )}
        {status === 'paused' && (
          <div className="paused-overlay"><span>DETECTION PAUSED</span></div>
        )}
        {status === 'active' && scale > 0 && (
          <div className="detection-overlay" aria-hidden="true">
            {detections.map(({ class: label, score, bbox }, index) => {
              const urgent = urgentLabels.has(label)
              const [x, y, width, height] = bbox
              const left = ((x * scale + offsetX) / stageSize.width) * 100
              const top = ((y * scale + offsetY) / stageSize.height) * 100
              return (
                <div
                  className={`detection-box${urgent ? ' is-urgent' : ''}`}
                  key={`${label}-${index}`}
                  style={{ left: `${left}%`, top: `${top}%`, width: `${(width * scale / stageSize.width) * 100}%`, height: `${(height * scale / stageSize.height) * 100}%` }}
                >
                  <span className="box-label">{label} <b>{Math.round(score * 100)}%</b></span>
                </div>
              )
            })}
          </div>
        )}
        {status === 'active' && <span className="live-pill"><span /> LIVE</span>}
      </div>
      <div className="camera-card-foot">
        <span>{status === 'active' ? `${detections.length} ${detections.length === 1 ? 'object' : 'objects'} in view` : 'COCO-SSD OBJECT DETECTION'}</span>
        <span className="foot-indicator"><i /> ON-DEVICE</span>
      </div>
    </div>
  )
}