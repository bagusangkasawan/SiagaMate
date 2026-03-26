import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'
import App from './App.tsx'

registerSW({
  onNeedRefresh() {
    if (confirm('Versi baru tersedia. Muat ulang sekarang?')) {
      window.location.reload()
    }
  },
  onOfflineReady() {
    console.log('Aplikasi siap digunakan secara offline!')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
