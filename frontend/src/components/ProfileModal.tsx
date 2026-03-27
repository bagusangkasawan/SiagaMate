import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { API_BASE } from '../lib/api'
import { requestNotificationPermission, hasNotificationPermission, isPushNotificationSupported } from '../lib/fcm'
import { Settings, X } from 'lucide-react'
import type { UserProfile } from '../types'

interface LocationSuggestion {
  id: string
  label: string
  lat: number
  lng: number
  details: {
    kelurahan?: string
    kecamatan?: string
    kabupaten?: string
    provinsi?: string
  }
}

interface ProfileModalProps {
  profile: UserProfile
  onProfileChange: (updater: (prev: UserProfile) => UserProfile) => void
  disasterType: string
  onDisasterTypeChange: (value: string) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  onClose: () => void
}

export default function ProfileModal({
  profile,
  onProfileChange,
  disasterType,
  onDisasterTypeChange,
  onSubmit,
  onClose,
}: ProfileModalProps) {
  const fieldClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none'

  const selectClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-violet-500 focus:outline-none accent-violet-500'

  // Location search state
  const [locationQuery, setLocationQuery] = useState('')
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchContainerRef = useRef<HTMLDivElement | null>(null)

  // Notification state
  const [notificationEnabled, setNotificationEnabled] = useState(false)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(null)

  useEffect(() => {
    // Check if notifications are already enabled
    setNotificationEnabled(hasNotificationPermission())
    setNotificationError(null)
  }, [])

  const handleNotificationToggle = async () => {
    if (notificationLoading) return
    
    setNotificationLoading(true)
    setNotificationError(null)
    
    try {
      const granted = await requestNotificationPermission()
      setNotificationEnabled(granted)
      
      if (!granted && Notification.permission === 'denied') {
        setNotificationError('Izin notifikasi ditolak. Silakan aktifkan di pengaturan browser Anda.')
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error)
      setNotificationError('Tidak dapat mengaktifkan notifikasi. Coba lagi.')
    } finally {
      setNotificationLoading(false)
    }
  }

  /* ── Click outside to close suggestions ── */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /* ── Location search ── */
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (locationQuery.trim().length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setSearchLoading(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE}/geocode/search?q=${encodeURIComponent(locationQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.locations || [])
          setShowSuggestions(true)
        }
      } catch (error) {
        console.error('Geocoding error:', error)
        setSuggestions([])
      } finally {
        setSearchLoading(false)
      }
    }, 500) // Debounce 500ms

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [locationQuery])

  const handleSelectLocation = (location: LocationSuggestion) => {
    onProfileChange(p => ({
      ...p,
      locationLabel: location.label,
      lat: location.lat,
      lng: location.lng
    }))
    setLocationQuery('')
    setShowSuggestions(false)
    setSuggestions([])
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0f18] p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center text-violet-400">
            <Settings size={40} />
          </div>
          <h2 className="text-xl font-semibold text-white">Atur Profil Keselamatan</h2>
          <p className="mt-2 text-sm text-slate-400">
            Informasi untuk peringatan yang lebih akurat.
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Nama</label>
            <input
              className={fieldClass}
              value={profile.name}
              onChange={(e) => onProfileChange(p => ({ ...p, name: e.target.value }))}
              placeholder="Budi Santoso"
            />
          </div>

          {/* Location Search */}
          <div className="relative" ref={searchContainerRef}>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Cari Lokasi</label>
            <input
              className={fieldClass}
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
              placeholder="Ketik nama kelurahan, kecamatan, atau kota..."
              autoComplete="off"
            />
            {searchLoading && (
              <div className="absolute right-3 top-9 flex items-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500"></div>
              </div>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 mt-2 w-full rounded-xl border border-white/10 bg-[#0c0c14] shadow-2xl max-h-64 overflow-y-auto">
                {suggestions.map((location) => (
                  <button
                    key={location.id}
                    className="w-full cursor-pointer border-b border-white/5 px-4 py-3 text-left text-sm transition hover:bg-white/5 last:border-b-0"
                    onClick={() => handleSelectLocation(location)}
                    type="button"
                  >
                    <div className="font-medium text-white">{location.label}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-slate-500">
                      {location.details.kelurahan && (
                        <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-violet-400">
                          Kel: {location.details.kelurahan}
                        </span>
                      )}
                      {location.details.kecamatan && (
                        <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-blue-400">
                          Kec: {location.details.kecamatan}
                        </span>
                      )}
                      {location.details.kabupaten && (
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-400">
                          Kab/Kota: {location.details.kabupaten}
                        </span>
                      )}
                      {location.details.provinsi && (
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400">
                          Prov: {location.details.provinsi}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Lokasi Terpilih</label>
            <input
              className={`${fieldClass} bg-white/[0.02] cursor-not-allowed`}
              value={profile.locationLabel}
              disabled
              readOnly
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Latitude</label>
              <input
                className={`${fieldClass} bg-white/[0.02] cursor-not-allowed`}
                type="number"
                step="0.0001"
                value={profile.lat}
                disabled
                readOnly
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Longitude</label>
              <input
                className={`${fieldClass} bg-white/[0.02] cursor-not-allowed`}
                type="number"
                step="0.0001"
                value={profile.lng}
                disabled
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Profil</label>
              <select
                className={selectClass}
                value={profile.profile}
                onChange={(e) => onProfileChange(p => ({ ...p, profile: e.target.value as 'warga' | 'petugas' }))}
              >
                <option value="warga">Warga Biasa</option>
                <option value="petugas">Petugas/BPBD</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Jenis Bencana</label>
              <select className={selectClass} value={disasterType} onChange={(e) => onDisasterTypeChange(e.target.value)}>
                <option value="banjir">Banjir</option>
                <option value="gempa-bumi">Gempa Bumi</option>
              </select>
            </div>
          </div>

          {/* Notification Permission */}
          {isPushNotificationSupported() && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white">Notifikasi Push</label>
                  <p className="mt-1 text-xs text-slate-400">
                    {notificationEnabled 
                      ? 'Notifikasi push bencana sudah diaktifkan' 
                      : 'Aktifkan untuk menerima alert real-time'}
                  </p>
                  {notificationError && (
                    <p className="mt-2 text-xs text-red-400 bg-red-500/10 rounded px-2 py-1">
                      {notificationError}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleNotificationToggle}
                  disabled={notificationLoading}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                    notificationEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                      : 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30'
                  } ${notificationLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {notificationLoading ? '...' : (notificationEnabled ? '✓ Aktif' : 'Aktifkan')}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="mt-2 w-full cursor-pointer rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30"
          >
            Simpan & Lanjutkan
          </button>
        </form>

        {/* Close */}
        <button
          className="absolute right-4 top-4 cursor-pointer text-slate-500 transition hover:text-white"
          onClick={onClose}
          type="button"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}
