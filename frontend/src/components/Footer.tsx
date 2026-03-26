import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/5 bg-[#09090f]">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Logo & Description */}
          <div className="flex flex-col items-center gap-3 md:items-start">
            <div className="flex items-center gap-2">
              <img src="/icon-192x192.png" alt="SiagaMate" className="h-8 w-8" />
              <span className="font-semibold text-white">SiagaMate AI</span>
            </div>
            <p className="max-w-xs text-center text-sm text-slate-500 md:text-left">
              Platform kesiapsiagaan bencana dengan data real-time BMKG dan AI.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-6 text-sm">
            <Link className="text-slate-500 no-underline hover:text-white" to="/">Home</Link>
            <Link className="text-slate-500 no-underline hover:text-white" to="/risiko">Risiko</Link>
            <Link className="text-slate-500 no-underline hover:text-white" to="/data-bmkg">Data BMKG</Link>
            <Link className="text-slate-500 no-underline hover:text-white" to="/simulasi">Simulasi</Link>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-white/5 pt-6 text-center text-xs text-slate-600">
          Data: <strong>BMKG</strong> • AI: <strong>Google Gemini</strong> • © {year} SiagaMate AI
        </div>
      </div>
    </footer>
  )
}
