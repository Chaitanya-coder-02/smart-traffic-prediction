import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { usePrediction } from '../context/PredictionContext'
import { api } from '../services/api'

export default function Layout() {
  const { setModelStatus } = usePrediction()
  const [health, setHealth] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.health()
      .then(d => { setHealth(d); setModelStatus(d) })
      .catch(() => setHealth({ status: 'error', model_ready: false }))
  }, [setModelStatus])

  const navItems = [
    { to: '/', label: 'Overview', icon: '⬡' },
    { to: '/predict', label: 'Predict', icon: '◎' },
    { to: '/city', label: '3D City', icon: '◈' },
    { to: '/analytics', label: 'Analytics', icon: '◇' },
    { to: '/about', label: 'About', icon: '◻' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--navy-950)' }}>
      {/* Top nav */}
      <nav style={{
        background: 'rgba(6,13,35,0.95)',
        borderBottom: '1px solid rgba(34,211,238,0.15)',
        backdropFilter: 'blur(20px)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #06b6d4, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 0 20px rgba(34,211,238,0.4)',
          }}>🚦</div>
          <div>
            <div className="font-orbitron" style={{ color: '#22d3ee', fontSize: 13, fontWeight: 700, letterSpacing: 2, lineHeight: 1.2, textShadow: '0 0 15px rgba(34,211,238,0.5)' }}>
              SMARTFLOW
            </div>
            <div style={{ color: 'rgba(226,232,240,0.4)', fontSize: 10, letterSpacing: 1 }}>
              TRAFFIC PREDICTION ML
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 4 }}>
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span style={{ marginRight: 5 }}>{icon}</span>{label}
            </NavLink>
          ))}
        </div>

        {/* Status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`status-dot ${health?.model_ready ? 'online' : 'offline'}`} />
          <span style={{ fontSize: 12, color: 'rgba(226,232,240,0.6)' }}>
            {health === null ? 'Connecting...' : health.model_ready ? 'Model Ready' : 'No Model'}
          </span>
        </div>
      </nav>

      {/* Educational disclaimer banner */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(168,85,247,0.1), rgba(34,211,238,0.1))',
        borderBottom: '1px solid rgba(168,85,247,0.2)',
        padding: '6px 24px',
        textAlign: 'center',
        fontSize: 11,
        color: 'rgba(226,232,240,0.6)',
        letterSpacing: 0.5,
      }}>
        ⚠️ &nbsp;EDUCATIONAL PROJECT — ML Predictions from I-94 Minnesota Dataset · Not a live traffic monitoring service
      </div>

      {/* Page content */}
      <main style={{ flex: 1, padding: '28px 24px' }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(34,211,238,0.1)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: 12,
        color: 'rgba(226,232,240,0.35)',
      }}>
        SmartFlow Traffic Prediction System · College ML Project · I-94 Interstate Dataset · Predictions are illustrative
      </footer>
    </div>
  )
}
