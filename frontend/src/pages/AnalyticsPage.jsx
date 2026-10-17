import { useEffect, useState } from 'react'
import { api } from '../services/api'
import {
  AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts'

const TT = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass" style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
      <div style={{ color: '#22d3ee', marginBottom: 4 }}>{prefix}{label}{suffix}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#e2e8f0' }}>
          {p.name}: {typeof p.value === 'number' ? Math.round(p.value).toLocaleString() : p.value}
        </div>
      ))}
    </div>
  )
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MODEL_COLORS = ['#22d3ee', '#a855f7', '#fb923c']

export default function AnalyticsPage() {
  const [hourly, setHourly]   = useState([])
  const [weekly, setWeekly]   = useState([])
  const [avp,    setAvp]      = useState([])
  const [fi,     setFi]       = useState([])
  const [metrics,setMetrics]  = useState(null)
  const [loading,setLoading]  = useState(true)
  const [error,  setError]    = useState(null)

  useEffect(() => {
    Promise.all([
      api.hourlyAnalytics(),
      api.weeklyAnalytics(),
      api.actualsVsPredicted(),
      api.featureImportance(),
      api.modelMetrics(),
    ])
      .then(([h, w, a, f, m]) => {
        setHourly(h); setWeekly(w.map(d => ({ ...d, day: DAYS[d.day_of_week] })))
        setAvp(a); setFi(f.slice(0, 12)); setMetrics(m)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />
  if (error) return <ErrBox msg={error} />

  const noData = !hourly.length

  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 28 }}>
        <h1 className="font-orbitron" style={{ fontSize: 24, color: '#22d3ee', fontWeight: 700 }}>
          Analytics &amp; Model Evaluation
        </h1>
        <p style={{ color: 'rgba(226,232,240,0.5)', fontSize: 13, marginTop: 5 }}>
          All metrics computed on held-out test set (20%) via chronological split. Regression metrics only — not classification accuracy.
        </p>
      </div>

      {noData ? (
        <NoDataBox />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Model comparison table */}
          {metrics?.all_model_metrics && (
            <Section title="🤖 Model Comparison">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(34,211,238,0.2)' }}>
                      {['Model', 'MAE (veh/hr)', 'RMSE (veh/hr)', 'R²', 'Status'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#22d3ee', fontWeight: 600, fontSize: 12, letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.all_model_metrics.map((m, i) => {
                      const isBest = m.model_name === metrics.best_model
                      return (
                        <tr key={m.model_name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isBest ? 'rgba(34,211,238,0.05)' : 'transparent' }}>
                          <td style={{ padding: '12px 16px', color: isBest ? '#22d3ee' : '#e2e8f0', fontWeight: isBest ? 700 : 400 }}>
                            {m.model_name}
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'Orbitron, monospace', color: MODEL_COLORS[i] }}>{m.mae.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'Orbitron, monospace', color: MODEL_COLORS[i] }}>{m.rmse.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'Orbitron, monospace', color: MODEL_COLORS[i] }}>{m.r2}</td>
                          <td style={{ padding: '12px 16px' }}>
                            {isBest && <span style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee', fontSize: 11, padding: '2px 10px', borderRadius: 20 }}>✓ Selected</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(226,232,240,0.35)', marginTop: 10 }}>
                {metrics.evaluation_method}
              </p>
            </Section>
          )}

          {/* Actuals vs Predicted */}
          {avp.length > 0 && (
            <Section title="📊 Actual vs Predicted Traffic Volume (Test Set)">
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="actual" name="Actual" stroke="rgba(226,232,240,0.3)" tick={{ fontSize: 11 }}
                    label={{ value: 'Actual (veh/hr)', position: 'insideBottom', offset: -2, fill: 'rgba(226,232,240,0.4)', fontSize: 11 }} />
                  <YAxis dataKey="predicted" name="Predicted" stroke="rgba(226,232,240,0.3)" tick={{ fontSize: 11 }}
                    label={{ value: 'Predicted', angle: -90, position: 'insideLeft', fill: 'rgba(226,232,240,0.4)', fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<TT />} />
                  <Scatter data={avp} fill="#22d3ee" fillOpacity={0.4} />
                </ScatterChart>
              </ResponsiveContainer>
            </Section>
          )}

          {/* Hourly trend */}
          <Section title="⏱ Average Traffic Volume by Hour">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={hourly} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" stroke="rgba(226,232,240,0.3)" tick={{ fontSize: 11 }} tickFormatter={h => `${h}h`} />
                <YAxis stroke="rgba(226,232,240,0.3)" tick={{ fontSize: 11 }} />
                <Tooltip content={<TT prefix="Hour " />} />
                <Area type="monotone" dataKey="avg_volume" name="Avg Volume" stroke="#22d3ee" strokeWidth={2} fill="url(#g1)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          {/* Weekly comparison */}
          <Section title="📅 Average Traffic Volume by Weekday">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekly} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="rgba(226,232,240,0.3)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(226,232,240,0.3)" tick={{ fontSize: 11 }} />
                <Tooltip content={<TT />} />
                <Bar dataKey="avg_volume" name="Avg Volume" radius={[4, 4, 0, 0]}>
                  {weekly.map((_, i) => (
                    <Cell key={i} fill={i >= 5 ? '#a855f7' : '#22d3ee'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12 }}>
              <LegDot color="#22d3ee" label="Weekday" />
              <LegDot color="#a855f7" label="Weekend" />
            </div>
          </Section>

          {/* Feature importance */}
          {fi.length > 0 && (
            <Section title="🎯 Feature Importance (Top 12)">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={fi} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(226,232,240,0.3)" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="feature" stroke="rgba(226,232,240,0.3)" tick={{ fontSize: 11 }} width={95} />
                  <Tooltip content={<TT />} />
                  <Bar dataKey="importance" name="Importance" radius={[0, 4, 4, 0]}>
                    {fi.map((_, i) => (
                      <Cell key={i} fill={`hsl(${185 + i * 8}, 80%, ${60 - i * 2}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="glass" style={{ borderRadius: 16, padding: 24 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>{title}</h2>
      {children}
    </div>
  )
}

function LegDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
      <span style={{ color: 'rgba(226,232,240,0.5)' }}>{label}</span>
    </div>
  )
}

function Loader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <span style={{ color: 'rgba(226,232,240,0.4)' }}>Loading analytics...</span>
    </div>
  )
}

function ErrBox({ msg }) {
  return (
    <div className="glass" style={{ borderRadius: 12, padding: 24, border: '1px solid rgba(248,113,113,0.3)' }}>
      <div style={{ color: '#f87171', fontWeight: 700 }}>⚠️ {msg}</div>
    </div>
  )
}

function NoDataBox() {
  return (
    <div className="glass" style={{ borderRadius: 16, padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
      <p style={{ color: 'rgba(226,232,240,0.5)', fontSize: 14 }}>
        No analytics data yet. Train the model first:
      </p>
      <code style={{ color: '#22d3ee', fontSize: 13, display: 'block', marginTop: 10 }}>python backend/train.py</code>
    </div>
  )
}
