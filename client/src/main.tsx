import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@arco-design/web-react/dist/css/arco.css'
import App from './App'
import './index.css'
import { initTheme } from './lib/theme'

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
