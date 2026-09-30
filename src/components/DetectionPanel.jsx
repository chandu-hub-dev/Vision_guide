import { Eye, ScanSearch } from 'lucide-react'

const urgentLabels = new Set(['person', 'car', 'truck', 'bus', 'motorcycle', 'bicycle'])

export function DetectionPanel({ detections, status }) {
  const active = status === 'active'

  return (
    <aside className="detection-panel" aria-labelledby="detection-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow panel-eyebrow">IN YOUR SURROUNDINGS</p>
          <h2 id="detection-heading">What I see<span className="heading-period">.</span></h2>
        </div>
        <div className="panel-icon"><Eye size={19} /></div>
      </div>

      <div className="detection-summary" aria-live="polite">
        <span className="summary-count">{active ? String(detections.length).padStart(2, '0') : '--'}</span>
        <span className="summary-copy">{active ? 'objects detected' : 'waiting for camera'}</span>
      </div>

      <div className="object-list" aria-live="polite">
        {!active || detections.length === 0 ? (
          <div className="empty-state">
            <ScanSearch size={23} strokeWidth={1.5} />
            <p>{active ? 'Nothing in view just yet.' : 'Detected objects will appear here.'}</p>
          </div>
        ) : (
          [...detections]
            .sort((first, second) => Number(urgentLabels.has(second.class)) - Number(urgentLabels.has(first.class)) || second.score - first.score)
            .map(({ class: label, score, bbox }, index) => (
              <div className={`object-row${urgentLabels.has(label) ? ' is-urgent' : ''}`} key={`${label}-${bbox[0]}-${bbox[1]}-${index}`}>
                <span className="object-order">{String(index + 1).padStart(2, '0')}</span>
                <span className="object-name">{label}</span>
                {urgentLabels.has(label) && <span className="object-priority">AHEAD</span>}
                <span className="object-confidence">{Math.round(score * 100)}%</span>
              </div>
            ))
        )}
      </div>

      <div className="speech-note">
        <span className="speech-note-dot" />
        <p>Important obstacles are announced first. Repeat alerts are spaced out.</p>
      </div>
    </aside>
  )
}