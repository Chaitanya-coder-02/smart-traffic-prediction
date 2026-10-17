import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrediction } from '../context/PredictionContext'
import CityCanvas from '../city3d/CityCanvas'

const CONGESTION_META = {
  Low:        { color: '#22c55e', desc: '< 2,000 veh/hr', icon: '🟢' },
  Moderate:   { color: '#eab308', desc: '2,000–4,000 veh/hr', icon: '🟡' },
  High:       { color: '#f97316', desc: '4,000–5,500 veh/hr', icon: '🟠' },
  'Very High':{ color: '#ef4444', desc: '> 5,500 veh/hr', icon: '🔴' },
}

export default function CityPage() {
  const { prediction } = usePrediction()
  const navigate = useNavigate()
  const [canvasReady, setCanvasReady] = useState(false)
  const level = prediction?.congestion_category || 'Low'
  const meta  = CONGESTION_META[level] || CONGESTION_META['Low']

  return (
    <div style={{ height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h1 className="font-orbitron" style={{ fontSize: 22, color: '#22d3ee', fontWeight: 700 }}>
            3D Smart City
          </h1>
          <p style={{ color: 'rgba(226,232,240,0.45)', fontSize: 12, marginTop: 3 }}>
            Orbit · Pan · Zoom  ·  Simulated visualization driven by ML prediction
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" style={{ padding: '9px 18px', fontSize: 13 }}
            onClick={() => navigate('/predict')}>
            ◎ New Prediction
          </button>
          <button onClick={() => navigate('/')}
            style={{ padding: '9px 18px', fontSize: 13, background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 8, color: '#22d3ee', cursor: 'pointer' }}>
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Canvas + overlay */}
      <div style={{ flex: 1, position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(34,211,238,0.15)' }}>

        {/* Loading overlay */}
        {!canvasReady && (
          <div style={{ position: 'absolute', inset: 0, background: 'var(--navy-900)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, gap: 16 }}>
            <div className="spinner" style={{ width: 44, height: 44 }} />
            <div className="font-orbitron" style={{ color: '#22d3ee', fontSize: 13, letterSpacing: 2 }}>LOADING CITY...</div>
          </div>
        )}

        <CityCanvas congestionLevel={level} onLoad={() => setCanvasReady(true)} />

        {/* ── Floating info panel ── */}
        <div className="glass" style={{
          position: 'absolute', top: 16, left: 16,
          borderRadius: 12, padding: '16px 20px',
          border: `1px solid ${meta.color}30`,
          minWidth: 240, zIndex: 5,
        }}>
          <div style={{ fontSize: 10, color: 'rgba(226,232,240,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
            ML Prediction — Not Live Traffic
          </div>

          {prediction ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>{meta.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.45)' }}>Congestion</div>
                  <div className="font-orbitron" style={{ fontSize: 16, color: meta.color, fontWeight: 700 }}>{level}</div>
                </div>
              </div>
              <div className="font-orbitron" style={{ fontSize: 28, color: '#22d3ee', fontWeight: 900, lineHeight: 1 }}>
                {Math.round(prediction.predicted_volume).toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.4)', marginBottom: 10 }}>vehicles / hour</div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 10 }} />
              <InfoRow label="Date" value={prediction.input_echo?.date_str} />
              <InfoRow label="Hour" value={`${prediction.input_echo?.hour}:00`} />
              <InfoRow label="Weather" value={prediction.input_echo?.weather_main} />
              <InfoRow label="Model" value={prediction.model_name} />
            </>
          ) : (
            <div style={{ color: 'rgba(226,232,240,0.45)', fontSize: 13 }}>
              No prediction yet.<br />
              <span style={{ color: '#22d3ee', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => navigate('/predict')}>Make one →</span>
            </div>
          )}
        </div>

        {/* ── Congestion legend ── */}
        <div className="glass" style={{
          position: 'absolute', bottom: 16, right: 16,
          borderRadius: 12, padding: '14px 18px', zIndex: 5,
          minWidth: 200,
        }}>
          <div style={{ fontSize: 10, color: 'rgba(226,232,240,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
            Legend
          </div>
          {Object.entries(CONGESTION_META).map(([lvl, m]) => (
            <div key={lvl} style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7,
              opacity: lvl === level ? 1 : 0.5,
              transition: 'opacity 0.3s',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, flexShrink: 0, boxShadow: lvl === level ? `0 0 8px ${m.color}` : 'none' }} />
              <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: lvl === level ? 700 : 400 }}>{lvl}</span>
              <span style={{ fontSize: 11, color: 'rgba(226,232,240,0.35)', marginLeft: 'auto' }}>{m.desc}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: 'rgba(226,232,240,0.3)', marginTop: 10, lineHeight: 1.5 }}>
            Car speed &amp; density reflect<br />predicted congestion level.
          </div>
        </div>

        {/* ── Model status badge ── */}
        <div style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(6,13,35,0.85)',
          border: '1px solid rgba(34,211,238,0.2)',
          borderRadius: 8, padding: '6px 12px',
          fontSize: 11, color: 'rgba(226,232,240,0.5)',
          display: 'flex', alignItems: 'center', gap: 6, zIndex: 5,
        }}>
          <span className="status-dot online" />
          {prediction?.model_name || 'Awaiting prediction'}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ flexShrink: 0, textAlign: 'center', fontSize: 11, color: 'rgba(226,232,240,0.3)', lineHeight: 1.6 }}>
        ⚠️ This 3D city is a simulated visualization. Vehicle animations are illustrative — they are NOT real observed traffic data.
        The training dataset represents a single section of I-94 in Minnesota, not multiple intersections.
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
      <span style={{ color: 'rgba(226,232,240,0.4)' }}>{label}</span>
      <span style={{ color: '#e2e8f0' }}>{value || '—'}</span>
    </div>
  )
}
