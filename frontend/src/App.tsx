import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useAppState } from './hooks/useAppState'
import { usePWA } from './hooks/usePWA'
import { useAuth } from './hooks/useAuth'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ChatWidget from './components/ChatWidget'
import ProfileModal from './components/ProfileModal'
import ConfirmModal from './components/ConfirmModal'
import HomePage from './pages/HomePage'
import RiskPage from './pages/RiskPage'
import BmkgDataPage from './pages/BmkgDataPage'
import SimulationPage from './pages/SimulationPage'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { AlertTriangle, X } from 'lucide-react'

function App() {
  const state = useAppState()
  const { user } = useAuth()
  const location = useLocation()

  // Initialize PWA and FCM
  usePWA()

  // Handle service worker updates
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#09090f]">
      <Navbar onOpenProfile={() => state.setShowSetup(true)} userName={state.profile?.name} />

      {/* Error Toast */}
      {state.error && (
        <div className="animate-fade-in-up fixed left-1/2 top-24 z-[400] flex max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-sm text-rose-300 shadow-lg backdrop-blur-md">
          <AlertTriangle size={18} className="shrink-0" />
          <span className="flex-1">{state.error}</span>
          <button
            className="cursor-pointer text-rose-300 transition hover:text-white shrink-0 bg-transparent"
            onClick={() => state.setError('')}
            aria-label="Tutup notifikasi"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <main className="relative z-10">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                earthquakes={state.earthquakes}
                tickerItems={state.tickerItems}
              />
            }
          />
          <Route
            path="/risiko"
            element={
              <RiskPage
                profile={state.profile}
                onProfileChange={state.setProfile}
                disasterType={state.disasterType}
                onDisasterTypeChange={state.setDisasterType}
                risk={state.risk}
                notificationText={state.notificationText}
                loading={state.loading}
                onRefresh={() => void state.refreshIntelligence()}
              />
            }
          />
          <Route
            path="/data-bmkg"
            element={
              <BmkgDataPage
                earthquakes={state.earthquakes}
                bmkgLoading={state.bmkgLoading}
              />
            }
          />
          <Route
            path="/simulasi"
            element={<SimulationPage />}
          />
        </Routes>
      </main>

      <Footer />

      {user && (
        <ChatWidget
          open={state.chatOpen}
          onToggle={() => state.setChatOpen(!state.chatOpen)}
          history={state.chatHistory}
          message={state.chatMessage}
          onMessageChange={state.setChatMessage}
          onSubmit={state.handleChat}
          loading={state.chatLoading}
          onReset={state.handleResetChat}
        />
      )}

      {state.showSetup && (
        <ProfileModal
          profile={state.profile}
          onProfileChange={state.setProfile}
          disasterType={state.disasterType}
          onDisasterTypeChange={state.setDisasterType}
          onSubmit={state.handleRegister}
          onClose={() => state.setShowSetup(false)}
        />
      )}

      {/* PWA Update Modal */}
      <ConfirmModal
        isOpen={needRefresh}
        title="Pembaruan Tersedia"
        message="Versi baru SiagaMate AI telah tersedia. Apakah Anda ingin memperbarui aplikasi sekarang?"
        onConfirm={() => updateServiceWorker(true)}
        onCancel={() => setNeedRefresh(false)}
        confirmLabel="Perbarui"
        cancelLabel="Nanti"
        variant="success"
      />
    </div>
  )
}

export default App
