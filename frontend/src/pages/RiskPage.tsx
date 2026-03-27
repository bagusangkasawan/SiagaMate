/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react'
import { Target, Globe, Waves, Radio, AlertOctagon, AlertTriangle, CheckCircle, Info, CloudSun, Check } from 'lucide-react'
import { riskColor, API_BASE, calculateDistance } from '../lib/api'
import type { RiskPrediction, UserProfile } from '../types'

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

interface RiskPageProps {
  profile: UserProfile
  onProfileChange: (updater: (prev: UserProfile) => UserProfile) => void
  disasterType: string
  onDisasterTypeChange: (value: string) => void
  risk: RiskPrediction | null
  notificationText: string
  loading: boolean
  onRefresh: () => void
}

export default function RiskPage({
  profile,
  onProfileChange,
  disasterType,
  onDisasterTypeChange,
  risk,
  notificationText,
  loading,
  onRefresh,
}: RiskPageProps) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletRef = useRef<any>(null)
  const userZoneRef = useRef<any>(null)
  const userPointRef = useRef<any>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchContainerRef = useRef<HTMLDivElement | null>(null)

  // Location search state
  const [locationQuery, setLocationQuery] = useState('')
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition placeholder:text-slate-500 focus:border-violet-500 focus:outline-none'

  const selectClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition focus:border-violet-500 focus:outline-none accent-violet-500'

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

  /* ── Map setup ── */
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return
    const L = (window as any).L
    if (!L) return
    const map = L.map(mapRef.current).setView([profile.lat, profile.lng], 11)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    leafletRef.current = map
  }, [profile.lat, profile.lng])

  useEffect(() => {
    const L = (window as any).L
    const map = leafletRef.current
    if (!map || !L) return
    map.setView([profile.lat, profile.lng], map.getZoom())
    if (userZoneRef.current) userZoneRef.current.remove()
    if (userPointRef.current) userPointRef.current.remove()
    userZoneRef.current = L.circle([profile.lat, profile.lng], {
      radius: 2800,
      color: risk ? riskColor(risk.riskLevel) : '#8B5CF6',
      fillOpacity: 0.2,
    }).addTo(map)
    userPointRef.current = L.circleMarker([profile.lat, profile.lng], {
      radius: 8, color: '#8B5CF6',
    }).addTo(map)
    userPointRef.current.bindPopup(`<strong>${profile.locationLabel}</strong><br/>Zona pantau pengguna`)
  }, [profile.lat, profile.lng, profile.locationLabel, risk])

  useEffect(() => {
    return () => { if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null } }
  }, [])

  return (
    <section className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-5xl px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-violet-400">Prediksi Risiko</p>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Analisis Risiko Bencana</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-slate-400">
            Masukkan lokasi dan parameter untuk mendapatkan prediksi risiko yang dipersonalisasi.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form Panel */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Parameter Risiko</h2>
              <span className="rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-400">BMKG</span>
            </div>

            <div className="space-y-4">
              <div className="relative" ref={searchContainerRef}>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Cari Lokasi
                </label>
                <input
                  className={inputClass}
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
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Lokasi Terpilih
                </label>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-300 cursor-not-allowed">
                  {profile.locationLabel || 'Belum ada lokasi dipilih'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Latitude</label>
                  <input
                    className={`${inputClass} bg-white/[0.02] cursor-not-allowed`}
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
                    className={`${inputClass} bg-white/[0.02] cursor-not-allowed`}
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
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Jenis Bencana</label>
                  <select className={selectClass} value={disasterType} onChange={(e) => onDisasterTypeChange(e.target.value)}>
                    <option value="banjir">Banjir</option>
                    <option value="gempa-bumi">Gempa Bumi</option>
                  </select>
                </div>
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
              </div>

              <button
                className="mt-2 w-full cursor-pointer rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-lg"
                onClick={onRefresh}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></span>
                    Menganalisis...
                  </span>
                ) : (
                  'Analisis Risiko'
                )}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Hasil Prediksi</h2>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">Real-time</span>
            </div>

            {loading && !risk ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex gap-1">
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: '0ms' }} />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: '150ms' }} />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-sm font-medium text-slate-400">Menganalisis data BMKG...</p>
                <p className="text-xs text-slate-500 mt-1">Memproses data gempa, cuaca, dan lokasi Anda</p>
              </div>
            ) : !risk ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex flex-col items-center justify-center text-violet-400">
                  <Target size={48} />
                </div>
                <p className="text-sm font-medium text-slate-400 mb-2">Belum ada prediksi risiko</p>
                <p className="text-xs text-slate-500 max-w-xs">Klik tombol "Analisis Risiko" untuk mendapatkan prediksi berdasarkan lokasi dan parameter Anda.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Disaster Type Badge */}
                <div className="flex items-center gap-2 pb-2">
                  <span className="rounded-lg bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-300 flex items-center">
                    {disasterType === 'gempa-bumi' && <><Globe size={14} className="mr-1.5 inline" /> Gempa Bumi</>}
                    {disasterType === 'banjir' && <><Waves size={14} className="mr-1.5 inline" /> Banjir</>}
                  </span>
                  <span className="text-xs text-slate-500">
                    Dianalisis: {new Date(risk.generatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </span>
                </div>

                {/* BMKG Attribution */}
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-xs text-blue-300 flex items-center">
                  <strong className="flex items-center"><Radio size={14} className="mr-1.5" /> Data:</strong> <span className="ml-1">{risk.dataSource}</span>
                </div>

                {/* Risk Level */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <p className="mb-2 text-xs font-medium text-slate-500">Tingkat Risiko Saat Ini</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold flex items-center ${risk.riskLevel === 'high' ? 'text-rose-400' :
                        risk.riskLevel === 'medium' ? 'text-amber-400' :
                          'text-emerald-400'
                      }`}>
                      {risk.riskLevel === 'high' ? <><AlertOctagon size={24} className="inline mr-2 text-rose-500" /> TINGGI</> :
                        risk.riskLevel === 'medium' ? <><AlertTriangle size={24} className="inline mr-2 text-amber-500" /> SEDANG</> :
                          <><CheckCircle size={24} className="inline mr-2 text-emerald-500" /> RENDAH</>}
                    </span>
                  </div>
                </div>

                {/* BMKG Earthquake Data - Only show for "gempa-bumi" and if significant or nearby */}
                {disasterType === 'gempa-bumi' && risk.bmkgData?.earthquake && (() => {
                  const distance = calculateDistance(
                    profile.lat,
                    profile.lng,
                    risk.bmkgData.earthquake!.coordinates.lat,
                    risk.bmkgData.earthquake!.coordinates.lng
                  )
                  const isSignificant = parseFloat(risk.bmkgData.earthquake.magnitude) >= 5.5
                  const isNearby = distance < 100 // Within 100 km

                  return isSignificant || isNearby ? (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Globe size={24} className="text-rose-400" />
                        <h4 className="font-semibold text-rose-300">Data Gempa BMKG</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Magnitude:</span>
                          <span className="font-medium text-white">{risk.bmkgData.earthquake.magnitude}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Wilayah:</span>
                          <span className="font-medium text-white">{risk.bmkgData.earthquake.region}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Kedalaman:</span>
                          <span className="font-medium text-white">{risk.bmkgData.earthquake.depth}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Jarak ke Epicenter:</span>
                          <span className="font-medium text-rose-400">{distance} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Waktu:</span>
                          <span className="font-medium text-white text-xs">{risk.bmkgData.earthquake.dateTime}</span>
                        </div>
                        <div className="border-t border-rose-500/10 pt-2 mt-2">
                          <p className="text-xs text-rose-300/80"><strong>Potensi:</strong> {risk.bmkgData.earthquake.potential}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-500/20 bg-slate-500/10 px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Info size={20} className="text-slate-400" />
                        <p className="text-sm text-slate-400">Tidak ada data gempa yang relevan untuk lokasi Anda</p>
                      </div>
                    </div>
                  )
                })()}

                {/* BMKG Weather Forecast - Always show for banjir for transparency */}
                {disasterType === 'banjir' && (
                  <div className={`rounded-xl border px-4 py-4 ${risk.bmkgData?.weatherForecast?.riskLevel === 'high'
                      ? 'border-amber-500/30 bg-amber-500/10'
                      : risk.bmkgData?.weatherForecast?.riskLevel === 'medium'
                        ? 'border-yellow-500/30 bg-yellow-500/10'
                        : 'border-blue-500/20 bg-blue-500/10'
                    }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <CloudSun size={24} className="text-blue-400" />
                      <h4 className="font-semibold text-blue-300">Prakiraan Cuaca BMKG</h4>
                    </div>

                    {/* Show risk indicators if any */}
                    {risk.bmkgData?.weatherForecast?.riskIndicators && risk.bmkgData.weatherForecast.riskIndicators.length > 0 ? (
                      <div className="mb-3 space-y-1">
                        {risk.bmkgData.weatherForecast.riskIndicators.map((indicator, idx) => (
                          <p key={idx} className="text-sm text-slate-300">
                            {indicator}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <div className="mb-3">
                        <p className="text-sm text-slate-300 flex items-start">
                          <Check size={16} className="inline mr-1.5 shrink-0 mt-0.5 text-emerald-400" />
                          <span>Prakiraan cuaca normal: Tidak ada hujan deras atau kondisi ekstrem yang diprediksi.</span>
                        </p>
                      </div>
                    )}

                    {/* Show forecast data if available */}
                    {risk.bmkgData?.weatherForecast?.forecast && risk.bmkgData.weatherForecast.forecast.length > 0 ? (
                      <div className="grid gap-2 max-h-48 overflow-y-auto text-xs">
                        {risk.bmkgData.weatherForecast.forecast
                          .filter((f) => new Date(f.localDatetime) > new Date(risk.generatedAt))
                          .slice(0, 8)
                          .map((forecast, idx) => (
                            <div key={idx} className="flex justify-between bg-white/5 rounded p-2">
                              <div className="flex-1">
                                <p className="text-slate-400">{new Date(forecast.localDatetime).toLocaleString('id-ID', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</p>
                                <p className="text-slate-200 font-medium">{forecast.weather}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-white">{forecast.temperature}°C</p>
                                <p className="text-slate-400 text-xs">{forecast.humidity}% RH</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400">
                        <p>Data prakiraan cuaca sedang diproses dari BMKG...</p>
                      </div>
                    )}

                    <div className="border-t border-blue-500/10 pt-2 mt-2">
                      <p className="text-xs text-blue-300/80">
                        <strong>Sumber:</strong> BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)
                      </p>
                    </div>
                  </div>
                )}

                {/* Show "Safe Status" message for banjir when LOW risk */}
                {disasterType === 'banjir' && risk.riskLevel === 'low' && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Check size={24} className="text-emerald-400" />
                      <h4 className="font-semibold text-emerald-300">Status Aman</h4>
                    </div>
                    <p className="text-sm text-emerald-200">
                      Prakiraan cuaca menunjukkan kondisi normal. Risiko banjir rendah untuk 3 hari ke depan.
                    </p>
                  </div>
                )}



                {/* Weather Warning - Show for "banjir" if there's an actual warning */}
                {disasterType === 'banjir' && risk.bmkgData?.weatherWarning && !risk.bmkgData.weatherWarning.summary.toLowerCase().includes('belum tersedia') && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Waves size={24} className="text-amber-400" />
                      <h4 className="font-semibold text-amber-300">Peringatan Banjir BMKG</h4>
                    </div>
                    <p className="text-sm text-amber-200">{risk.bmkgData.weatherWarning.summary}</p>
                  </div>
                )}

                {notificationText && risk.riskLevel !== 'low' && (
                  <div className="animate-fade-in rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3.5 text-sm text-amber-300">
                    <div className="flex items-start gap-2">
                      <span className="flex-1">{notificationText}</span>
                    </div>
                  </div>
                )}

                {/* First Aid Checklist */}
                <div className="border-t border-white/5 pt-4 mt-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Check size={24} className="text-emerald-400" />
                    <h3 className="text-sm font-semibold text-emerald-400">
                      {disasterType === 'gempa-bumi' && 'Panduan Keselamatan Gempa'}
                      {disasterType === 'banjir' && 'Panduan Keselamatan Banjir'}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {risk.firstAidChecklist.map((item, idx) => (
                      <label
                        key={item}
                        className="flex items-start gap-3 rounded-lg border border-emerald-500/10 bg-emerald-500/5 px-3.5 py-3 text-sm text-slate-300 transition cursor-pointer hover:border-emerald-500/20 hover:bg-emerald-500/10"
                      >
                        <input type="checkbox" className="mt-0.5 accent-emerald-500 cursor-pointer" />
                        <span className="flex-1">
                          <span className="font-medium text-emerald-400">{idx + 1}.</span> {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Peta Zona Pantau</h2>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">Real-time</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/5">
            <div ref={mapRef} className="h-[350px] w-full bg-[#0c0c14]" />
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Tinggi</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Sedang</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Rendah</span>
          </div>
        </div>
      </div>
    </section>
  )
}
