export default function AboutPage() {
  return (
    <div className="fade-in-up" style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="font-orbitron" style={{ fontSize: 24, color: '#22d3ee', fontWeight: 700 }}>
          About This Project
        </h1>
        <p style={{ color: 'rgba(226,232,240,0.5)', marginTop: 6, fontSize: 13 }}>
          SmartFlow · College Machine Learning Project
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <Card title="🎯 Project Objective">
          <p>SmartFlow is an end-to-end machine learning system that predicts hourly traffic volume on
          Interstate 94 (Minnesota, USA) using historical weather and traffic data. It demonstrates a
          complete ML pipeline: data loading → preprocessing → training → evaluation → REST API → interactive dashboard.</p>
          <Warn>This is an educational prediction system, not a live traffic monitoring service.</Warn>
        </Card>

        <Card title="📦 Dataset">
          <p style={{ marginBottom: 10 }}>Metro Interstate Traffic Volume dataset (Kaggle)</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              {[
                ['Source', 'I-94 ATR 301, Minneapolis/St. Paul, MN'],
                ['Period', '~2012 – 2018'],
                ['Records', '~48,000 hourly readings'],
                ['Target', 'traffic_volume (vehicles/hour)'],
                ['License', 'See Kaggle dataset page'],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 12px', color: 'rgba(226,232,240,0.45)', width: 140 }}>{k}</td>
                  <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Warn>Predictions apply ONLY to this specific road segment. Do not generalize without retraining on local data.</Warn>
        </Card>

        <Card title="🤖 Model Methodology">
          <ul style={{ paddingLeft: 20, lineHeight: 2.0, fontSize: 14 }}>
            <li><strong style={{ color: '#22d3ee' }}>Split:</strong> Chronological 80/20 train/test — no data leakage</li>
            <li><strong style={{ color: '#22d3ee' }}>Models compared:</strong> DummyRegressor, LinearRegression, RandomForest</li>
            <li><strong style={{ color: '#22d3ee' }}>Selection:</strong> Best RMSE on held-out test set</li>
            <li><strong style={{ color: '#22d3ee' }}>Features:</strong> Hour, day-of-week, month, is_weekend, is_holiday, temp, rain, snow, clouds, weather_main</li>
            <li><strong style={{ color: '#22d3ee' }}>Preprocessing:</strong> Median imputation, StandardScaler, OneHotEncoder (fit on train only)</li>
          </ul>
        </Card>

        <Card title="📐 Evaluation Metrics">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
            {[
              { name: 'MAE', full: 'Mean Absolute Error', desc: 'Average absolute difference in vehicles/hour' },
              { name: 'RMSE', full: 'Root Mean Squared Error', desc: 'Penalises large errors more than MAE' },
              { name: 'R²', full: 'R-squared', desc: 'Proportion of variance explained (0–1)' },
            ].map(m => (
              <div key={m.name} style={{ background: 'rgba(34,211,238,0.06)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(34,211,238,0.15)' }}>
                <div className="font-orbitron" style={{ color: '#22d3ee', fontSize: 18, fontWeight: 700 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: '#e2e8f0', marginTop: 4 }}>{m.full}</div>
                <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.4)', marginTop: 4 }}>{m.desc}</div>
              </div>
            ))}
          </div>
          <Warn>These are regression metrics, not classification accuracy. Traffic volume prediction is a regression task.</Warn>
        </Card>

        <Card title="⚙️ Technology Stack">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
            <TechGroup title="Backend / ML">
              {['Python 3.x', 'scikit-learn', 'pandas & NumPy', 'Flask + Flask-CORS', 'joblib', 'pytest']}
            </TechGroup>
            <TechGroup title="Frontend">
              {['React + Vite', 'Tailwind CSS', 'React Three Fiber', 'Three.js + Drei', 'Recharts', 'React Router']}
            </TechGroup>
          </div>
        </Card>

        <Card title="🚀 Running the Project">
          <ol style={{ paddingLeft: 20, lineHeight: 2.2, fontSize: 13, color: 'rgba(226,232,240,0.7)' }}>
            <li>Download dataset → <code style={{ color: '#22d3ee' }}>data/Metro_Interstate_Traffic_Volume.csv</code></li>
            <li>Create venv: <code style={{ color: '#22d3ee' }}>python -m venv venv</code></li>
            <li>Activate: <code style={{ color: '#22d3ee' }}>.\venv\Scripts\Activate.ps1</code></li>
            <li>Install: <code style={{ color: '#22d3ee' }}>pip install -r backend/requirements.txt</code></li>
            <li>Train model: <code style={{ color: '#22d3ee' }}>python backend/train.py</code></li>
            <li>Start API: <code style={{ color: '#22d3ee' }}>python backend/app.py</code></li>
            <li>Install frontend: <code style={{ color: '#22d3ee' }}>cd frontend && npm install</code></li>
            <li>Start frontend: <code style={{ color: '#22d3ee' }}>npm run dev</code></li>
            <li>Open: <code style={{ color: '#22d3ee' }}>http://localhost:5173</code></li>
          </ol>
        </Card>

        <Card title="⚠️ Limitations">
          <ul style={{ paddingLeft: 20, lineHeight: 2.0, fontSize: 13, color: 'rgba(226,232,240,0.65)' }}>
            <li>Trained on one highway segment — not transferable to other roads</li>
            <li>Congestion categories are illustrative thresholds, not official measurements</li>
            <li>Actual congestion also depends on lane count, incidents, vehicle mix — not in dataset</li>
            <li>Historical patterns may not capture special events or infrastructure changes</li>
            <li>3D city visualization is simulated, not real observed vehicle movements</li>
          </ul>
        </Card>

      </div>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="glass glass-hover" style={{ borderRadius: 16, padding: 24, lineHeight: 1.7, fontSize: 14, color: 'rgba(226,232,240,0.7)' }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  )
}

function Warn({ children }) {
  return (
    <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', fontSize: 12, color: 'rgba(251,146,60,0.85)' }}>
      ⚠️ {children}
    </div>
  )
}

function TechGroup({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: '#22d3ee', fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>{title}</div>
      {children.map(t => (
        <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22d3ee', flexShrink: 0 }} />
          <span>{t}</span>
        </div>
      ))}
    </div>
  )
}
