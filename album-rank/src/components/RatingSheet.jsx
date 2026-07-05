import { useState } from 'react'
import BottomSheet from './BottomSheet'

function round1(n) {
  return Math.round(n * 10) / 10
}

function clamp(n) {
  return Math.min(10, Math.max(1, n))
}

export default function RatingSheet({ title, subtitle, initialScore, onSave, onClose }) {
  const [score, setScore] = useState(round1(initialScore ?? 7.0))

  const nudge = (delta) => setScore(s => round1(clamp(s + delta)))

  return (
    <BottomSheet onClose={onClose}>
      <div className="sheet-title">{title}</div>
      {subtitle && <div className="sheet-subtitle">{subtitle}</div>}

      <div className="rating-readout">
        {score.toFixed(1)}<span className="score-scale">/10</span>
      </div>

      <div className="rating-slider-row">
        <button className="stepper-btn" onClick={() => nudge(-0.1)} aria-label="Decrease">−</button>
        <input
          className="rating-slider"
          type="range"
          min="1"
          max="10"
          step="0.1"
          value={score}
          onChange={e => setScore(round1(parseFloat(e.target.value)))}
        />
        <button className="stepper-btn" onClick={() => nudge(0.1)} aria-label="Increase">+</button>
      </div>

      <button className="sheet-save-btn" onClick={() => onSave(score)}>
        Save Rating
      </button>
    </BottomSheet>
  )
}
