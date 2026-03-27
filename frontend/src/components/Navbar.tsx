import { useEffect, useState, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { FcGoogle } from 'react-icons/fc'
import { Menu, X, Settings, LogOut } from 'lucide-react'

export default function Navbar({ onOpenProfile, userName }: { onOpenProfile: () => void, userName?: string }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const { user, login, logout, loading: authLoading } = useAuth()
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line
    setMobileOpen(false)
     
    setUserMenuOpen(false)
  }, [location.pathname])

  // Close user menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navItems = [
    { to: '/', label: 'Home', end: true },
    { to: '/risiko', label: 'Risiko' },
    { to: '/data-bmkg', label: 'Data BMKG' },
    { to: '/simulasi', label: 'Simulasi' },
  ]

  const handleLogin = async () => {
    try {
      await login()
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-[100]">
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <nav
          className={`flex h-14 items-center justify-between rounded-full border px-4 transition-all duration-300 ${
            scrolled
              ? 'border-white/10 bg-[#09090f]/80 shadow-lg shadow-black/20 backdrop-blur-xl'
              : 'border-transparent bg-transparent'
          }`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-white no-underline">
            <img src="/icon-192x192.png" alt="SiagaMate" className="h-8 w-8" />
            <span className="text-sm font-semibold">SiagaMate AI</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-white/10 font-medium text-white'
                      : 'text-slate-400 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {authLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
            ) : user ? (
              /* Logged in — show avatar + dropdown */
              <div className="relative" ref={userMenuRef}>
                <button
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3 text-sm text-white transition-colors hover:border-white/20 hover:bg-white/10"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={userName || user.displayName || ''}
                      className="h-7 w-7 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                      {(userName || user.displayName || user.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden max-w-[100px] truncate sm:block">
                    {userName || user.displayName || 'User'}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-[#0f0f18]/95 py-2 shadow-2xl backdrop-blur-xl">
                    <div className="border-b border-white/5 px-4 pb-2 pt-1">
                      <p className="truncate text-sm font-medium text-white">{userName || user.displayName}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                    <button
                      className="w-full cursor-pointer px-4 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white flex items-center"
                      onClick={() => { setUserMenuOpen(false); onOpenProfile() }}
                    >
                      <Settings size={16} className="mr-2" /> Profil
                    </button>
                    <button
                      className="w-full cursor-pointer px-4 py-2.5 text-left text-sm text-rose-400 transition hover:bg-rose-500/10 flex items-center"
                      onClick={() => { setUserMenuOpen(false); void logout() }}
                    >
                      <LogOut size={16} className="mr-2" /> Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Not logged in — show login button */
              <button
                className="hidden cursor-pointer items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 sm:flex"
                onClick={handleLogin}
              >
                <FcGoogle className="h-4 w-4" />
                Masuk
              </button>
            )}

            <button
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="animate-fade-in mt-2 rounded-2xl border border-white/10 bg-[#0f0f18]/95 p-3 backdrop-blur-xl lg:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 text-sm transition-colors ${
                      isActive
                        ? 'bg-violet-500/15 font-medium text-violet-300'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              {user ? (
                <>
                  <button
                    className="mt-2 cursor-pointer rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white flex items-center justify-center"
                    onClick={onOpenProfile}
                  >
                    <Settings size={16} className="mr-2" /> Profil
                  </button>
                  <button
                    className="cursor-pointer rounded-xl border border-rose-500/30 px-4 py-3 text-sm font-medium text-rose-400 transition hover:bg-rose-500/10 flex items-center justify-center"
                    onClick={() => void logout()}
                  >
                    <LogOut size={16} className="mr-2" /> Keluar
                  </button>
                </>
              ) : (
                <button
                  className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white"
                  onClick={handleLogin}
                >
                  <FcGoogle className="h-4 w-4" />
                  Masuk dengan Google
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
