import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { usePrediction } from '../context/PredictionContext'
import CongestionBadge from '../components/CongestionBadge'

const WEATHER_OPTIONS = ['Clear', 'Clouds', 'Rain', 'Snow', 'Mist', 'Fog', 'Drizzle', 'Thunderstorm', 'Haze', 'Smoke']

const defaultForm = {
  date_str: new Date().toISOString().split('T')[0],
  hour: 8,
  temp: 15,
  rain_1h: 0,
  snow_1h: 0,
  clouds_all: 20,
  weather_main: 'Clear',
  is_holiday: 0,
}

export default function PredictionPage() {
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { prediction, setPrediction } = usePrediction()
  const navigate = useNavigate()

  function handleChange(e) {
    const { name, value, type } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = await api.predict({
        ...form,
        hour: parseInt(form.hour),
        clouds_all: parseInt(form.clouds_all),
        is_holiday: parseInt(form.is_holiday),
      })
      setPrediction(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fieldStyle = { padding: '10px 14px', fontSize: 14 }

  return (
    <div className="fade-in-up" style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="font-orbitron" style={{ fontSize: 24, color: '#22d3ee', fontWeight: 700 }}>
          Traffic Prediction
        </h1>
        <p style={{ color: 'rgba(226,232,240,0.5)', marginTop: 6, fontSize: 13 }}>
          Enter scenario parameters to get an ML prediction from the trained model.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* ── Form ── */}
        <div className="glass gradient-border" style={{ borderRadius: 16, padding: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 22 }}>
            🔧 Scenario Parameters
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <Row label="Date">
              <input className="input-field" style={fieldStyle} type="date"
                name="date_str" value={form.date_str} onChange={handleChange} required />
            </Row>

            <Row label={`Hour: ${form.hour}:00`}>
              <input className="input-field" style={{ ...fieldStyle, padding: '6px 14px' }}
                type="range" name="hour" min={0} max={23} step={1}
                value={form.hour} onChange={handleChange} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(226,232,240,0.4)', marginTop: 2 }}>
                <span>0:00</span><span>12:00</span><span>23:00</span>
              </div>
            </Row>

            <Row label="Temperature (°C)">
              <input className="input-field" style={fieldStyle} type="number"
                name="temp" min={-40} max={50} step={0.5}
                value={form.temp} onChange={handleChange} required />
            </Row>

            <Row label="Rainfall (mm)">
              <input className="input-field" style={fieldStyle} type="number"
                name="rain_1h" min={0} max={200} step={0.1}
                value={form.rain_1h} onChange={handleChange} />
            </Row>

            <Row label="Snowfall (mm)">
              <input className="input-field" style={fieldStyle} type="number"
                name="snow_1h" min={0} max={100} step={0.1}
                value={form.snow_1h} onChange={handleChange} />
            </Row>

            <Row label={`Cloud Cover: ${form.clouds_all}%`}>
              <input className="input-field" style={{ ...fieldStyle, padding: '6px 14px' }}
                type="range" name="clouds_all" min={0} max={100} step={5}
                value={form.clouds_all} onChange={handleChange} />
            </Row>

            <Row label="Weather">
              <select className="input-field" style={fieldStyle}
                name="weather_main" value={form.weather_main} onChange={handleChange}>
                {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </Row>

            <Row label="Public Holiday">
              <select className="input-field" style={fieldStyle}
                name="is_holiday" value={form.is_holiday} onChange={handleChange}>
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </Row>

            {error && (
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171' }}>
                ⚠️ {error}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading}
              style={{ padding: '13px 20px', fontSize: 15, marginTop: 4 }}>
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                    <span className="spinner" style={{ width: 18, height: 18 }} /> Predicting...
                  </span>
                : '◎  Predict Traffic Volume'}
            </button>
          </form>
        </div>

        {/* ── Result panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {prediction ? (
            <>
              <div className="glass gradient-border" style={{ borderRadius: 16, padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>📊 Prediction Result</h2>
                  <span style={{ fontSize: 10, color: 'rgba(226,232,240,0.4)', background: 'rgba(34,211,238,0.08)', padding: '3px 8px', borderRadius: 20, border: '1px solid rgba(34,211,238,0.15)' }}>
                    ML prediction · not live traffic
                  </span>
                </div>

                {/* Main volume */}
                <div style={{ textAlign: 'center', padding: '20px 0', marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.45)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                    Predicted Volume
                  </div>
                  <div className="font-orbitron" style={{ fontSize: 52, fontWeight: 900, color: '#22d3ee', textShadow: '0 0 30px rgba(34,211,238,0.5)', lineHeight: 1 }}>
                    {Math.round(prediction.predicted_volume).toLocaleString()}
                  </div>
                  <div style={{ color: 'rgba(226,232,240,0.5)', fontSize: 14, marginTop: 6 }}>vehicles per hour</div>
                </div>

                <CongestionBadge level={prediction.congestion_category} volume={prediction.predicted_volume} large />
              </div>

              {/* Details */}
              <div className="glass" style={{ borderRadius: 16, padding: 22 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#22d3ee', marginBottom: 14 }}>Input Echo & Model</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['Model', prediction.model_name],
                    ['Date', prediction.input_echo?.date_str],
                    ['Hour', `${prediction.input_echo?.hour}:00`],
                    ['Temp', `${prediction.input_echo?.temp_celsius}°C`],
                    ['Rain', `${prediction.input_echo?.rain_1h} mm`],
                    ['Snow', `${prediction.input_echo?.snow_1h} mm`],
                    ['Clouds', `${prediction.input_echo?.clouds_all}%`],
                    ['Weather', prediction.input_echo?.weather_main],
                    ['Holiday', prediction.input_echo?.is_holiday ? 'Yes' : 'No'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 6 }}>
                      <span style={{ color: 'rgba(226,232,240,0.45)' }}>{k}</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{v ?? '—'}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: 'rgba(226,232,240,0.35)', marginTop: 12, lineHeight: 1.6 }}>
                  {prediction.prediction_note}
                </p>
              </div>

              {/* City link */}
              <button className="btn-primary" style={{ padding: '13px 20px', fontSize: 14 }}
                onClick={() => navigate('/city')}>
                ◈ &nbsp;View in 3D City
              </button>
            </>
          ) : (
            <div className="glass" style={{ borderRadius: 16, padding: 40, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🏙️</div>
              <p style={{ color: 'rgba(226,232,240,0.5)', fontSize: 14 }}>
                Fill in the form and hit <strong style={{ color: '#22d3ee' }}>Predict</strong> to see real ML output.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: 'rgba(226,232,240,0.5)', marginBottom: 6, letterSpacing: 0.5 }}>
        {label}
      </label>
      {children}
    </div>
  )
}
