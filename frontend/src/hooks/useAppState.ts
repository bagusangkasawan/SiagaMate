import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { API_BASE, authFetch } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import type {
  AlertItem,
  BmkgEarthquake,
  ChatRecord,
  RiskPrediction,
  SimulationResult,
  UserProfile,
} from '../types'

const initialProfile: UserProfile = {
  name: 'Relawan Siaga',
  locationLabel: 'Jakarta Selatan',
  lat: -6.2615,
  lng: 106.8106,
  profile: 'warga',
}

export function useAppState() {
  const { user, idToken } = useAuth()

  const [profile, setProfile] = useState<UserProfile>(initialProfile)
  const [disasterType, setDisasterType] = useState('banjir')
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [risk, setRisk] = useState<RiskPrediction | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatRecord[]>([])
  const [chatMessage, setChatMessage] = useState('')
  const [simulation, setSimulation] = useState<SimulationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [showSetup, setShowSetup] = useState(false)

  // BMKG live data
  const [earthquakes, setEarthquakes] = useState<BmkgEarthquake[]>([])
  const [latestEq, setLatestEq] = useState<BmkgEarthquake | null>(null)
  const [bmkgLoading, setBmkgLoading] = useState(true)

  const notificationText = useMemo(() => {
    if (!risk) return ''
    const lvl = risk.riskLevel.toUpperCase()
    return `⚠️ Peringatan ${lvl}: Risiko ${risk.disasterType} di ${profile.locationLabel}.`
  }, [risk, profile.locationLabel])

  /* ── Load user data from backend on login ── */
  useEffect(() => {
    if (!user || !idToken) return

    async function loadUserData() {
      try {
        const res = await authFetch(`${API_BASE}/auth/me`, {}, idToken)
        if (res.ok) {
          const data = await res.json()
          const u = data.user
          if (u) {
            setProfile({
              name: u.name || initialProfile.name,
              locationLabel: u.locationLabel || initialProfile.locationLabel,
              lat: u.lat || initialProfile.lat,
              lng: u.lng || initialProfile.lng,
              profile: u.profile || initialProfile.profile,
              adminLevel4Code: u.adminLevel4Code || undefined,
            })
            setDisasterType(u.disasterType || 'banjir')
          }
        }
      } catch (err) {
        console.error('Failed to load user data:', err)
      }
    }

    void loadUserData()
  }, [user, idToken])

  /* ── Load chat history on login ── */
  useEffect(() => {
    if (!user || !idToken) {
      setChatHistory([])
      return
    }

    async function loadChatHistory() {
      try {
        const res = await authFetch(`${API_BASE}/chat/history`, {}, idToken)
        if (res.ok) {
          const data = await res.json()
          setChatHistory(data.chats || [])
        }
      } catch (err) {
        console.error('Failed to load chat history:', err)
      }
    }

    void loadChatHistory()
  }, [user, idToken])

  /* ── Fetch BMKG data on mount ── */
  useEffect(() => {
    async function loadBmkg() {
      setBmkgLoading(true)
      try {
        const feedRes = await fetch(`${API_BASE}/bmkg/feeds`)
        if (feedRes.ok) {
          const feed = await feedRes.json()
          setLatestEq(feed.feeds?.latestEarthquake || null)
          const all = [
            ...(feed.feeds?.feltEarthquakes || []),
            ...(feed.feeds?.recentEarthquakes || []),
          ].filter(Boolean)
          setEarthquakes(all.slice(0, 15))
        }
      } catch {
        // silently degrade
      } finally {
        setBmkgLoading(false)
      }
    }
    void loadBmkg()
  }, [])

  /* ── Fetch alerts + risk ── */
  const refreshIntelligence = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [alertsRes, riskRes] = await Promise.all([
        fetch(`${API_BASE}/alerts?lat=${profile.lat}&lng=${profile.lng}`),
        authFetch(
          `${API_BASE}/risk?lat=${profile.lat}&lng=${profile.lng}&disasterType=${disasterType}&profile=${profile.profile}${profile.adminLevel4Code ? `&adminLevel4Code=${encodeURIComponent(profile.adminLevel4Code)}` : ''}`,
          {},
          idToken
        ),
      ])
      if (alertsRes.ok) {
        const d = await alertsRes.json()
        setAlerts(d.alerts || [])
      }
      if (riskRes.ok) {
        const d = await riskRes.json()
        setRisk(d.prediction || null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tidak bisa memuat data')
    } finally {
      setLoading(false)
    }
  }, [profile.lat, profile.lng, profile.profile, profile.adminLevel4Code, disasterType, idToken])

  useEffect(() => { void refreshIntelligence() }, [refreshIntelligence])

  /* ── Handlers ── */
  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    try {
      if (idToken) {
        // Authenticated: save profile via auth endpoint
        const res = await authFetch(`${API_BASE}/auth/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...profile, disasterType }),
        }, idToken)
        if (!res.ok) throw new Error('Gagal menyimpan profil')
      } else {
        // Legacy: register anonymously
        const res = await fetch(`${API_BASE}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        })
        if (!res.ok) throw new Error('Registrasi gagal')
      }
      setShowSetup(false)
      await refreshIntelligence()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrasi gagal')
    }
  }

  async function handleChat(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!chatMessage.trim()) return
    
    // Add user message to history immediately
    const userMsg = chatMessage
    const userRecord: ChatRecord = {
      message: userMsg,
      answer: '',
      provider: 'user',
    }
    setChatHistory(prev => [userRecord, ...prev])
    setChatMessage('')
    setChatLoading(true)
    
    try {
      const res = await authFetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, context: { profile, disasterType, risk } }),
      }, idToken)
      if (!res.ok) throw new Error('Chat error')
      const data = await res.json()
      // Update the first record (user message) with the AI response
      const aiResponse = data.response as ChatRecord
      setChatHistory(prev => {
        const updated = [...prev]
        if (updated.length > 0 && updated[0].provider === 'user') {
          updated[0] = {
            ...updated[0],
            answer: aiResponse.answer,
            provider: aiResponse.provider,
          }
        }
        // Enforce client-side 5-message limit display
        return updated.slice(0, 5)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim')
    } finally {
      setChatLoading(false)
    }
  }

  async function runSimulation() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioType: disasterType, lat: profile.lat, lng: profile.lng }),
      })
      if (!res.ok) throw new Error('Simulasi gagal')
      const data = await res.json()
      setSimulation(data.simulation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulasi gagal')
    } finally {
      setLoading(false)
    }
  }

  /* ── Ticker data ── */
  const tickerItems = useMemo(() => {
    const items: BmkgEarthquake[] = []
    if (latestEq) items.push(latestEq)
    items.push(...earthquakes.slice(0, 10))
    return items
  }, [latestEq, earthquakes])

  return {
    // State
    profile, setProfile,
    disasterType, setDisasterType,
    alerts,
    risk,
    chatHistory,
    chatMessage, setChatMessage,
    simulation,
    loading,
    error, setError,
    chatOpen, setChatOpen,
    chatLoading,
    showSetup, setShowSetup,
    earthquakes,
    bmkgLoading,
    notificationText,
    tickerItems,
    idToken,
    // Handlers
    refreshIntelligence,
    handleRegister,
    handleChat,
    runSimulation,
  }
}
