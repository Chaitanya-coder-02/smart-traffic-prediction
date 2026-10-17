import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PredictionProvider } from './context/PredictionContext'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import PredictionPage from './pages/PredictionPage'
import CityPage from './pages/CityPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AboutPage from './pages/AboutPage'

export default function App() {
  return (
    <BrowserRouter>
      <PredictionProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="predict" element={<PredictionPage />} />
            <Route path="city" element={<CityPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
        </Routes>
      </PredictionProvider>
    </BrowserRouter>
  )
}
