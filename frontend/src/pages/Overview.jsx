import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { usePrediction } from '../context/PredictionContext'
import StatCard from '../components/StatCard'
import CongestionBadge from '../components/CongestionBadge'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass" style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
        <div style={{ color: '#22d3ee' }}>Hour {label}:00</div>
        <div style={{ color: '#e2e8f0' }}>{Math.round(payload[0].value).toLocaleString()} vehicles</div>
      </div>
    )
  }
  return null
}

export default function Overview() {
  const [dash, setDash] = useState(null)
  const [hourly, setHourly] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { prediction } = usePrediction()
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([api.dashboard(), api.hourlyAnalytics()])
      .then(([d, h]) => { setDash(d); setHourly(h) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />
  if (error) return <ErrorBox msg={error} />

  const metrics = dash?.best_model_metrics || {}
  const stats = dash?.dataset_stats || {}

  return (
    <div className="fade-in-up">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="font-orbitron" style={{ fontSize: 26, color: '#22d3ee', fontWeight: 700, textShadow: '0 0 20px rgba(34,211,238,0.4)' }}>
          System Overview
        </h1>
        <p style={{ color: 'rgba(226,232,240,0.5)', marginTop: 6, fontSize: 14 }}>
          Metro Interstate I-94 · Minnesota, USA · {stats.date_range_start} – {stats.date_range_end}
        </p>
      </div>

      {/* Top stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Dataset Records" value={stats.total_records?.toLocaleString()} icon="📊" color="#22d3ee" />
        <StatCard label="Best Model" value={dash?.best_model} icon="🤖" color="#a855f7" />
        <StatCard label="MAE" value={metrics.mae} unit="veh/hr" icon="📉" color="#4ade80" sub="Mean Absolute Error" />
        <StatCard label="RMSE" value={metrics.rmse} unit="veh/hr" icon="📈" color="#facc15" sub="Root Mean Sq. Error" />
        <StatCard label="R² Score" value={metrics.r2} icon="🎯" color="#fb923c" sub="Variance explained" />
        <StatCard label="Avg Volume" value={stats.avg_traffic_volume} unit="veh/hr" icon="🚗" color="#60a5fa" />
      </div>

      {/* Current prediction summary */}
      {prediction ? (
        <div className="glass gradient-border" style={{ borderRadius: 16, padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ color: '#22d3ee', fontWeight: 700, fontSize: 16 }}>Latest Prediction</h2>
            <span style={{ fontSize: 11, color: 'rgba(226,232,240,0.4)', background: 'rgba(34,211,238,0.08)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(34,211,238,0.2)' }}>
              ML prediction — not live traffic
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <CongestionBadge level={prediction.congestion_category} volume={prediction.predicted_volume} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Info label="Date" value={`${prediction.input_echo?.date_str} @ ${prediction.input_echo?.hour}:00`} />
              <Info label="Weather" value={prediction.input_echo?.weather_main} />
              <Info label="Temp" value={`${prediction.input_echo?.temp_celsius}°C`} />
              <Info label="Model" value={prediction.model_name} />
            </div>
          </div>
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: 16, padding: 24, marginBottom: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🚦</div>
          <p style={{ color: 'rgba(226,232,240,0.5)', fontSize: 14 }}>No prediction yet.</p>
          <button className="btn-primary" style={{ marginTop: 14, padding: '10px 24px', fontSize: 13 }}
            onClick={() => navigate('/predict')}>
            Make a Prediction
          </button>
        </div>
      )}

      {/* Hourly traffic trend */}
      <div className="glass" style={{ borderRadius: 16, padding: 24, marginBottom: 28 }}>
        <h2 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
          📈 Average Traffic by Hour of Day
        </h2>
        {hourly.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={hourly} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" stroke="rgba(226,232,240,0.3)" tick={{ fontSize: 11 }}
                tickFormatter={h => `${h}:00`} />
              <YAxis stroke="rgba(226,232,240,0.3)" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="avg_volume" stroke="#22d3ee" strokeWidth={2}
                fill="url(#cyanGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: 'rgba(226,232,240,0.4)', fontSize: 13, textAlign: 'center' }}>
            Train the model to see analytics.
          </p>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: 'Make Prediction', icon: '◎', path: '/predict', color: '#22d3ee' },
          { label: 'View 3D City', icon: '◈', path: '/city', color: '#a855f7' },
          { label: 'Analytics', icon: '◇', path: '/analytics', color: '#fb923c' },
          { label: 'About Project', icon: '◻', path: '/about', color: '#4ade80' },
        ].map(({ label, icon, path, color }) => (
          <button key={path} onClick={() => navigate(path)}
            className="glass glass-hover"
            style={{
              borderRadius: 12, padding: '18px 16px',
              cursor: 'pointer', border: `1px solid ${color}20`,
              textAlign: 'left', transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
            <span style={{ fontSize: 22, color }}>{icon}</span>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: 'rgba(226,232,240,0.45)' }}>{label}</span>
      <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  )
}

function Loader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <span style={{ color: 'rgba(226,232,240,0.4)', fontSize: 14 }}>Loading dashboard...</span>
    </div>
  )
}

function ErrorBox({ msg }) {
  return (
    <div className="glass" style={{ borderRadius: 12, padding: 24, border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.05)' }}>
      <div style={{ color: '#f87171', fontWeight: 700, marginBottom: 8 }}>⚠️ Backend Unavailable</div>
      <div style={{ color: 'rgba(226,232,240,0.6)', fontSize: 13 }}>{msg}</div>
      <div style={{ color: 'rgba(226,232,240,0.4)', fontSize: 12, marginTop: 10 }}>
        Start Flask: <code style={{ color: '#22d3ee' }}>python backend/app.py</code>
      </div>
    </div>
  )
}
