// src/services/api.js
// Central API service — all Flask calls go through here

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Cannot reach backend. Is Flask running on port 5000?');
    }
    throw err;
  }
}

export const api = {
  health: () => request('/api/health'),
  dashboard: () => request('/api/dashboard'),
  predict: (body) => request('/api/predict', { method: 'POST', body: JSON.stringify(body) }),
  hourlyAnalytics: () => request('/api/analytics/hourly'),
  weeklyAnalytics: () => request('/api/analytics/weekly'),
  featureImportance: () => request('/api/analytics/feature-importance'),
  actualsVsPredicted: () => request('/api/analytics/actuals-vs-predicted'),
  modelMetrics: () => request('/api/model/metrics'),
};
