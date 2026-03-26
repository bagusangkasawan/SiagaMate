import { formatBmkgDateShort, magClass } from '../lib/api'
import type { BmkgEarthquake } from '../types'

export default function EarthquakeTicker({ items }: { items: BmkgEarthquake[] }) {
  if (items.length === 0) return null

  const magColor = (value: string) => {
    if (value === 'high') return 'bg-rose-500/15 text-rose-400'
    if (value === 'medium') return 'bg-amber-500/15 text-amber-400'
    return 'bg-emerald-500/15 text-emerald-400'
  }

  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-[#09090f] py-3">
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#09090f] to-transparent" />
      <div className="absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#09090f] to-transparent" />

      {/* Label */}
      <div className="absolute inset-y-0 left-0 z-20 flex items-center gap-2 bg-gradient-to-r from-[#09090f] from-80% to-transparent px-4">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
        </span>
        <span className="text-xs font-semibold text-rose-400">LIVE</span>
      </div>

      {/* Ticker content */}
      <div className="animate-ticker-scroll flex pl-24">
        {[...items, ...items].map((eq, i) => (
          <div className="flex shrink-0 items-center gap-3 px-6 text-sm" key={i}>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${magColor(magClass(eq.magnitude))}`}>
              M{eq.magnitude}
            </span>
            <span className="text-slate-300">{eq.region}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500">{formatBmkgDateShort(eq.dateTime)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
