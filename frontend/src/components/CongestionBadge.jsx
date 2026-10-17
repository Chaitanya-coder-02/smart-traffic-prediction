const LEVEL_META = {
  Low:       { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)',  icon: '🟢', bar: '25%'  },
  Moderate:  { color: '#facc15', bg: 'rgba(250,204,21,0.1)',  border: 'rgba(250,204,21,0.3)',  icon: '🟡', bar: '50%'  },
  High:      { color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.3)',  icon: '🟠', bar: '75%'  },
  'Very High':{ color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', icon: '🔴', bar: '100%' },
}

export default function CongestionBadge({ level, volume, large = false }) {
  const meta = LEVEL_META[level] || LEVEL_META['Low']

  return (
    <div style={{
      background: meta.bg,
      border: `1px solid ${meta.border}`,
      borderRadius: 12,
      padding: large ? '24px 28px' : '14px 18px',
      display: 'flex',
      flexDirection: large ? 'column' : 'row',
      alignItems: large ? 'flex-start' : 'center',
      gap: large ? 12 : 10,
    }}>
      <div style={{ fontSize: large ? 36 : 20 }}>{meta.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: large ? 14 : 11, color: 'rgba(226,232,240,0.5)', letterSpacing: 1, textTransform: 'uppercase' }}>
          Congestion Level
        </div>
        <div style={{ fontSize: large ? 32 : 18, fontWeight: 800, color: meta.color, fontFamily: 'Orbitron, monospace', textShadow: `0 0 15px ${meta.color}60` }}>
          {level}
        </div>
        {volume !== undefined && (
          <div style={{ fontSize: 13, color: 'rgba(226,232,240,0.6)', marginTop: 4 }}>
            {Math.round(volume).toLocaleString()} vehicles/hour
          </div>
        )}

        {/* Bar */}
        {large && (
          <div style={{ marginTop: 12 }}>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: meta.bar,
                background: `linear-gradient(90deg, ${meta.color}80, ${meta.color})`,
                borderRadius: 3,
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
