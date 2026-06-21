import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './globals.css'
import App from './App.jsx'
import { initMonitoring } from './utils/monitoring'
import { initAnalytics } from './utils/analytics'

// Initialize Telemetry
initMonitoring();
initAnalytics();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
