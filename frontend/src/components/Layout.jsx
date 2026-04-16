import { Link, useLocation, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, RefreshCw, Wallet, Users, Target,
  LogOut, PieChart as PieChartIcon, Menu, X, Layers,
  Activity, CreditCard, Bell, ChevronRight, Gem
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const NAV_GROUPS = [
  {
    label: 'Core',
    items: [
      { name: 'Overview',      path: '/dashboard',    icon: LayoutDashboard },
      { name: 'Transactions',  path: '/transactions', icon: RefreshCw },
      { name: 'Wallets',       path: '/wallets',      icon: Wallet },
    ]
  },
  {
    label: 'Finance',
    items: [
      { name: 'Receivables',   path: '/receivables',  icon: Users },
      { name: 'Budgets',       path: '/budgets',      icon: PieChartIcon },
      { name: 'Goals',         path: '/goals',        icon: Target },
    ]
  },
  {
    label: 'Markets',
    items: [
      { name: 'Stocks',        path: '/stocks',       icon: Activity },
      { name: 'Metals',        path: '/metals',       icon: Gem },
      { name: 'Subscriptions', path: '/subscriptions',icon: CreditCard },
    ]
  }
]

// Flatten for mobile
const ALL_NAV = NAV_GROUPS.flatMap(g => g.items)

export default function Layout() {
  const { pathname } = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const handleLogout = () => {
    logout()
    toast.success('Session terminated.')
  }

  const currentPage = ALL_NAV.find(n => n.path === pathname)

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans overflow-hidden">
      
      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[240px] bg-[#090A0D] border-r border-white/[0.04] h-screen sticky top-0 shrink-0 z-20">
        
        {/* Logo Area */}
        <div className="p-6 pb-5 flex items-center gap-3.5 border-b border-white/[0.04]">
          <div className="w-9 h-9 rounded border border-accent/25 bg-accent/[0.06] flex items-center justify-center shadow-[0_0_16px_rgba(0,255,163,0.12)]">
             <Layers size={16} className="text-accent" />
          </div>
          <div className="flex flex-col">
             <span className="text-white font-display font-bold text-[17px] tracking-tight">FinTrack</span>
             <span className="text-accent text-[8px] font-bold tracking-[0.4em] mt-0.5 uppercase opacity-70">Terminal v2</span>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[9px] font-display font-bold text-muted/40 uppercase tracking-[0.3em] mb-2">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.path
                  return (
                    <Link key={item.name} to={item.path}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200 relative overflow-hidden ${
                        isActive
                          ? 'bg-accent/[0.06] border border-accent/[0.15] text-white'
                          : 'text-muted/70 hover:text-white hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-accent shadow-[0_0_10px_rgba(0,255,163,0.8)] rounded-full" />
                      )}
                      <item.icon size={14} className={`flex-shrink-0 ml-1 ${isActive ? 'text-accent' : 'text-muted/50 group-hover:text-muted transition-colors'}`} />
                      <span className={`text-[12px] font-display font-semibold tracking-[0.08em] uppercase flex-1 ${isActive ? 'text-white' : ''}`}>
                        {item.name}
                      </span>
                      {isActive && <ChevronRight size={11} className="text-accent/50 flex-shrink-0" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User + Logout */}
        <div className="p-3 border-t border-white/[0.04]">
          <div className="bg-[#0E0F12] rounded border border-white/[0.04] p-3.5 flex items-center gap-3 mb-3 hover:border-white/10 transition-all">
            <div className="w-7 h-7 rounded bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-display font-bold text-[11px]">
               {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
               <span className="text-white text-[11px] font-mono font-bold truncate">{user?.email?.split('@')[0] || 'Operator'}</span>
               <div className="flex items-center gap-1.5 mt-0.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                 <span className="text-muted text-[8px] font-display uppercase tracking-widest">Active Session</span>
               </div>
            </div>
          </div>
          
          <button onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-danger/[0.05] border border-danger/[0.15] text-danger/70 hover:bg-danger/10 hover:text-danger hover:border-danger/30 rounded transition-all font-display uppercase text-[10px] tracking-widest font-bold w-full">
            <LogOut size={12} />
            <span>Disconnect</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER ────────────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#090A0D]/95 backdrop-blur-md border-b border-white/[0.04] z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded border border-accent/20 bg-accent/[0.07] flex items-center justify-center">
             <Layers size={12} className="text-accent" />
          </div>
          <span className="text-white font-display font-bold text-sm tracking-tight">FinTrack</span>
        </div>

        {currentPage && !mobileMenuOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            <currentPage.icon size={12} className="text-accent" />
            <span className="text-[10px] font-display font-bold tracking-widest uppercase text-muted">{currentPage.name}</span>
          </div>
        )}
        
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-muted hover:text-white transition-colors">
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* ── MOBILE MENU ───────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#090A0D] lg:hidden flex flex-col pt-16 animate-stagger-1">
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[9px] font-display font-bold text-muted/40 uppercase tracking-[0.3em] mb-2 px-2">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.path
                    return (
                      <Link key={item.name} to={item.path} onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-4 px-4 py-3.5 rounded border transition-all ${
                          isActive ? 'bg-accent/[0.06] border-accent/15 text-white' : 'border-transparent text-muted hover:bg-white/[0.04] hover:text-white'
                        }`}
                      >
                        <item.icon size={16} className={isActive ? 'text-accent' : 'text-muted/50'} />
                        <span className="font-display uppercase tracking-[0.1em] text-[12px] font-bold">{item.name}</span>
                        {isActive && <ChevronRight size={12} className="ml-auto text-accent/50" />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-4 border-t border-white/[0.04]">
            <div className="bg-[#0E0F12] rounded border border-white/[0.04] p-3.5 flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-bold text-xs">
                 {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-white text-[12px] font-mono font-bold">{user?.email?.split('@')[0] || 'Operator'}</p>
                <p className="text-muted/50 text-[9px] font-display uppercase tracking-widest">Authenticated</p>
              </div>
            </div>
            <button onClick={() => { setMobileMenuOpen(false); handleLogout() }}
              className="flex items-center justify-center gap-3 px-4 py-4 bg-danger/[0.06] border border-danger/15 text-danger/80 w-full rounded font-display uppercase font-bold text-[10px] tracking-widest active:bg-danger/20 transition-colors">
              <LogOut size={14} />
              <span>Terminate Session</span>
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="flex-1 relative h-screen overflow-y-auto scroll-smooth">
        
        {/* Desktop Topbar */}
        <div className="hidden lg:flex sticky top-0 bg-background/95 backdrop-blur-md z-20 h-14 items-center justify-between px-10 border-b border-white/[0.03]">
          <div className="flex items-center gap-2">
            {currentPage && (
              <>
                <currentPage.icon size={13} className="text-muted/50" />
                <span className="text-[11px] font-display font-bold tracking-[0.2em] text-muted/60 uppercase">{currentPage.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[9px] font-mono text-muted/40 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })} IST
            </div>
            <div className="h-4 w-px bg-white/[0.06]" />
            <div className="text-[9px] font-mono text-muted/40">SYSTEM ONLINE</div>
          </div>
        </div>
        
        <div className="p-4 lg:p-10 pt-20 lg:pt-8 max-w-[1400px] mx-auto min-h-full flex flex-col page-enter">
          <Outlet />
        </div>
      </main>
      
    </div>
  )
}
