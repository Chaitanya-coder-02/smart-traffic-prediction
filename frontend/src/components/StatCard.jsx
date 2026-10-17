// Reusable stat card with glowing border
export default function StatCard({ label, value, unit = '', icon, color = '#22d3ee', sub }) {
  return (
    <div className="glass glass-hover gradient-border fade-in-up" style={{
      borderRadius: 12,
      padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.5)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'Orbitron, monospace', lineHeight: 1 }}>
            {value ?? '—'}
            {unit && <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 4, color: 'rgba(226,232,240,0.6)' }}>{unit}</span>}
          </div>
          {sub && <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.4)', marginTop: 6 }}>{sub}</div>}
        </div>
        {icon && (
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: `${color}18`,
            border: `1px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>{icon}</div>
        )}
      </div>
    </div>
  )
}
