import { useVisionGuide } from './hooks/useVisionGuide'
import { CameraStage } from './components/CameraStage'
import { DetectionPanel } from './components/DetectionPanel'
import {
  Camera,
  CircleAlert,
  Eye,
  LoaderCircle,
  Pause,
  Play,
  ShieldCheck,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import './App.css'

function App() {
  const {
    detections,
    error,
    muted,
    pause,
    resume,
    start,
    status,
    stop,
    toggleMute,
    videoRef,
  } = useVisionGuide()
  const isBusy = status === 'requesting' || status === 'loading'
  const isActive = status === 'active'
  const isPaused = status === 'paused'

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="VisionGuide home">
          <span className="brand-mark"><Eye size={19} strokeWidth={2.4} /></span>
          <span>vision<span className="brand-light">guide</span></span>
        </a>
        <div className="prototype-tag"><span /> BROWSER PROTOTYPE</div>
      </header>

      <div className="workspace" id="top">
        <section className="intro" aria-labelledby="page-title">
          <div className="intro-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> SEE WHAT'S AHEAD</p>
            <h1 id="page-title">A little more<br /><em>aware</em> of your world.</h1>
            <p className="intro-text">Live object awareness, right from your camera. Listen for what matters as you move through a space.</p>
          </div>
          <div className="privacy-note"><ShieldCheck size={17} /><span>Camera stays on this device</span></div>
        </section>

        <section className="guide-layout" aria-label="Vision assistance">
          <div className="camera-column">
            <CameraStage detections={detections} status={status} videoRef={videoRef} />

            {error && (
              <div className="error-note" role="alert">
                <CircleAlert size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="control-row">
              {status === 'idle' || status === 'error' ? (
                <button className="button button-primary start-button" onClick={start}>
                  <Camera size={19} /> Start assistance
                </button>
              ) : isBusy ? (
                <>
                  <button className="button button-primary" disabled>
                    <LoaderCircle className="spin" size={19} />
                    {status === 'requesting' ? 'Waiting for camera' : 'Loading vision model'}
                  </button>
                  <button className="button button-secondary" onClick={stop}><X size={18} /> Cancel</button>
                </>
              ) : (
                <>
                  <button className="button button-primary" onClick={isActive ? pause : resume}>
                    {isActive ? <Pause size={18} /> : <Play size={18} />}
                    {isActive ? 'Pause detection' : 'Start detection'}
                  </button>
                  <button className="button button-secondary" onClick={stop}><X size={18} /> Stop assistance</button>
                </>
              )}
              <button
                className={`button button-mute${muted ? ' is-muted' : ''}`}
                onClick={toggleMute}
                aria-pressed={muted}
                aria-label={muted ? 'Unmute voice feedback' : 'Mute voice feedback'}
                title={muted ? 'Unmute voice feedback' : 'Mute voice feedback'}
              >
                {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
                <span>{muted ? 'Muted' : 'Voice on'}</span>
              </button>
            </div>
            {isPaused && <p className="control-hint">Camera is on. Detection and voice feedback are paused.</p>}
          </div>

          <DetectionPanel detections={detections} status={status} />
        </section>

        <footer className="page-footer">
          <span>VISIONGUIDE <span className="footer-separator">/</span> ASSISTIVE VISION</span>
          <span>Prototype detection can miss objects. Use alongside your usual mobility tools.</span>
        </footer>
      </div>
    </main>
  )
}

export default App