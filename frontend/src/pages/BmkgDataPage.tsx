import { formatBmkgDate, magClass } from '../lib/api'
import type { BmkgEarthquake } from '../types'

interface BmkgDataPageProps {
  earthquakes: BmkgEarthquake[]
  bmkgLoading: boolean
}

export default function BmkgDataPage({ earthquakes, bmkgLoading }: BmkgDataPageProps) {
  const magColor = (value: string) => {
    if (value === 'high') return 'text-rose-400'
    if (value === 'medium') return 'text-amber-400'
    return 'text-emerald-400'
  }

  return (
    <section className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-5xl px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-violet-400">Data BMKG</p>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Feed Gempa Bumi Terkini</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-slate-400">
            Data gempa bumi langsung dari Badan Meteorologi, Klimatologi, dan Geofisika.
          </p>
        </div>

        {/* Content */}
        {bmkgLoading ? (
          <div className="flex items-center justify-center gap-3 py-20">
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-slate-500">Memuat data...</span>
          </div>
        ) : earthquakes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 text-4xl">📡</div>
            <p className="text-sm text-slate-500">Tidak ada data gempa terbaru.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {earthquakes.map((eq, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-white/10 hover:bg-white/[0.04]"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className={`text-3xl font-bold ${magColor(magClass(eq.magnitude))}`}>
                    M{eq.magnitude}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">{formatBmkgDate(eq.dateTime)}</span>
                </div>

                <p className="mb-3 font-medium text-white">{eq.region}</p>

                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-white/5 px-2.5 py-1">📏 {eq.depth}</span>
                  {eq.potential && <span className="rounded-full bg-white/5 px-2.5 py-1">📋 {eq.potential}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
