import { useNavigate } from 'react-router-dom'
import EarthquakeTicker from '../components/EarthquakeTicker'
import { severityLabel } from '../lib/api'
import type { AlertItem, BmkgEarthquake } from '../types'

interface HomePageProps {
  earthquakes: BmkgEarthquake[]
  tickerItems: BmkgEarthquake[]
}

export default function HomePage({ earthquakes, tickerItems }: HomePageProps) {
  const navigate = useNavigate()

  // Generate dynamic alerts from earthquakes data
  const dynamicAlerts = earthquakes
    .filter(eq => {
      const magnitude = parseFloat(eq.magnitude)
      return magnitude >= 5.0
    })
    .map((eq, idx) => {
      const magnitude = parseFloat(eq.magnitude)
      let severity: AlertItem['severity'] = 'low'
      
      if (magnitude >= 6.5) severity = 'high'
      else if (magnitude >= 5.0) severity = 'medium'
      
      return {
        id: `eq-${idx}-${eq.dateTime}`,
        title: `Gempa M${eq.magnitude} - ${eq.region}`,
        severity,
        message: `Kedalaman ${eq.depth} km. ${eq.potential}`,
        category: 'Gempa Bumi',
        action: eq.felt ? `Telah dirasakan di beberapa daerah. Cek risiko Anda di peta risiko.` : 'Periksa dampak potensial di lokasi Anda.'
      }
    })
  
  // Show only dynamic alerts (no static ones)
  const allAlerts = dynamicAlerts

  const alertTone = (severity: AlertItem['severity']) => {
    if (severity === 'high') return 'border-l-rose-500 bg-rose-500/5'
    if (severity === 'medium') return 'border-l-amber-500 bg-amber-500/5'
    return 'border-l-emerald-500 bg-emerald-500/5'
  }

  const severityBadgeClass = (severity: AlertItem['severity']) => {
    if (severity === 'high') return 'bg-rose-500/15 text-rose-400'
    if (severity === 'medium') return 'bg-amber-500/15 text-amber-400'
    return 'bg-emerald-500/15 text-emerald-400'
  }

  const features = [
    {
      icon: '🔔',
      title: 'Early Warning System',
      desc: 'Peringatan dini otomatis berdasarkan feed gempa, cuaca, dan peringatan BMKG real-time.',
      color: 'violet',
    },
    {
      icon: '🤖',
      title: 'AI First Aid Assistant',
      desc: 'Chatbot AI siaga 24/7 yang memberikan panduan pertolongan pertama khusus bencana.',
      color: 'blue',
    },
    {
      icon: '⚠️',
      title: 'Prediksi Risiko',
      desc: 'Analisis risiko multi-layer berbasis lokasi, data BMKG, dan profil pengguna.',
      color: 'amber',
    },
    {
      icon: '🎯',
      title: 'Simulasi Bencana',
      desc: 'Simulasi skenario bencana untuk pelatihan respons dan kesiapsiagaan.',
      color: 'emerald',
    },
  ]

  const getFeatureColors = (color: string) => {
    const colors: Record<string, { bg: string; glow: string }> = {
      violet: { bg: 'bg-violet-500/10', glow: 'group-hover:shadow-violet-500/20' },
      blue: { bg: 'bg-blue-500/10', glow: 'group-hover:shadow-blue-500/20' },
      amber: { bg: 'bg-amber-500/10', glow: 'group-hover:shadow-amber-500/20' },
      emerald: { bg: 'bg-emerald-500/10', glow: 'group-hover:shadow-emerald-500/20' },
    }
    return colors[color] || colors.violet
  }

  return (
    <>
      {/* ━━━ Hero ━━━ */}
      <section className="relative isolate min-h-screen overflow-hidden" id="hero">
        {/* Background */}
        <div className="absolute inset-0 bg-[#09090f]" />
        <div className="pointer-events-none absolute inset-0 bg-grid-overlay opacity-20" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(139,92,246,0.15)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[600px] bg-[radial-gradient(ellipse,rgba(217,70,239,0.08)_0%,transparent_70%)]" />

        {/* Content */}
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pb-24 pt-28">
          <div className="mx-auto max-w-3xl text-center">
            {/* Status chip */}
            <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Data Real-Time BMKG Aktif
            </div>

            {/* Heading */}
            <h1 className="animate-fade-in-up text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Kesiapsiagaan Bencana
              <span className="mt-1 block bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Berbasis AI Indonesia
              </span>
            </h1>

            {/* Description */}
            <p className="animate-fade-in-up delay-1 mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              Platform early warning dan pertolongan pertama yang didukung oleh data BMKG real-time
              dan kecerdasan buatan.
            </p>

            {/* Tags */}
            <div className="animate-fade-in-up delay-1 mt-8 flex flex-wrap items-center justify-center gap-2">
              {['⚡ Early Warning', '🧠 AI Assistant', '🛰️ BMKG Feed'].map((tag) => (
                <span key={tag} className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="animate-fade-in-up delay-2 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <button
                className="w-full cursor-pointer rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/30 sm:w-auto"
                onClick={() => navigate('/risiko')}
              >
                Cek Risiko Sekarang
              </button>
              <button
                className="w-full cursor-pointer rounded-full border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-medium text-white transition-all hover:bg-white/10 sm:w-auto"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Pelajari Fitur
              </button>
            </div>

            {/* Stats */}
            <div className="animate-fade-in-up delay-3 mt-16 flex items-center justify-center gap-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{earthquakes.length || '—'}</div>
                <div className="mt-1 text-xs text-slate-500">Data Gempa</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{allAlerts.length || '0'}</div>
                <div className="mt-1 text-xs text-slate-500">Alert Aktif</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ Earthquake Ticker ━━━ */}
      <EarthquakeTicker items={tickerItems} />

      {/* ━━━ Features ━━━ */}
      <section className="py-24" id="features">
        <div className="mx-auto max-w-5xl px-6">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-violet-400">Fitur Utama</p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Perlindungan Menyeluruh
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm text-slate-400">
              Empat pilar kesiapsiagaan bencana yang terintegrasi dengan data BMKG dan AI.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature, idx) => {
              const colors = getFeatureColors(feature.color)
              return (
                <div
                  key={feature.title}
                  className={`animate-fade-in-up group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04] hover:shadow-lg ${colors.glow}`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} text-xl`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ━━━ Alerts Section ━━━ */}
      {allAlerts.length > 0 && (
        <section className="pb-24" id="alerts">
          <div className="mx-auto max-w-5xl px-6">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-8">
              {/* Header */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white sm:text-2xl">Alert Terkini</h2>
                  <p className="mt-1 text-sm text-slate-500">Peringatan aktif berdasarkan data BMKG real-time</p>
                </div>
                <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-400">
                  {allAlerts.length} Aktif
                </span>
              </div>

              {/* Alert List */}
              <div className="space-y-3">
                {allAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-xl border-l-4 p-4 transition-all hover:translate-x-1 ${alertTone(alert.severity)}`}
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-white">{alert.title}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${severityBadgeClass(alert.severity)}`}>
                        {severityLabel(alert.severity)}
                      </span>
                    </div>
                    <p className="mb-3 text-sm text-slate-400">{alert.message}</p>
                    <div className="rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-500">
                      💡 {alert.action}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
