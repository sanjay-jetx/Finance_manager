import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, ArrowLeftRight, HandCoins, Wallet,
  LogOut, Menu, X, Gem, Layers, ChevronRight, PieChart, Target, TrendingUp, User, Bell, Settings
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'OVERVIEW' },
  { to: '/transactions',  icon: ArrowLeftRight,  label: 'ACTIVITY' },
  { to: '/receivables',   icon: HandCoins,       label: 'RECEIVABLES' },
  { to: '/wallets',       icon: Wallet,          label: 'VAULTS' },
  { to: '/stocks',        icon: TrendingUp,      label: 'STOCKS' },
]

const mobileNavItems = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Home' },
  { to: '/transactions',  icon: ArrowLeftRight,  label: 'Txns' },
  { to: '/wallets',       icon: Wallet,          label: 'Wallets' },
  { to: '/profile',       icon: User,            label: 'Profile' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#050505] relative">
      {/* Premium Ambient Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-accent/15 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-500/10 blur-[130px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute top-[40%] right-[30%] w-[250px] h-[250px] bg-success/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen hidden lg:block" />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-20 lg:hidden backdrop-blur-md transition-all"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Floating Sidebar Container (Desktop) */}
      <div className={`fixed lg:static inset-y-0 left-0 z-30 w-[280px] transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <aside className="w-full h-full flex flex-col bg-[#0A0B0E]/60 backdrop-blur-3xl border-r border-white/5 overflow-hidden relative shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          {/* Logo Area */}
          <div className="flex items-center gap-4 px-8 py-10 relative z-10">
            <div className="w-10 h-10 rounded bg-accent/10 border border-accent/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,163,0.15)] flex-shrink-0 relative overflow-hidden backdrop-blur-md">
              <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-transparent" />
              <Gem size={20} className="text-accent relative z-10" />
            </div>
            <div>
              <h1 className="text-foreground font-display font-bold text-[14px] leading-tight tracking-wider uppercase">Obsidian Vault</h1>
              <p className="obsidian-label text-accent/80 mt-1">Private Tier</p>
            </div>
            <button className="ml-auto lg:hidden text-muted hover:text-foreground bg-white/5 p-2 rounded"
              onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-8 space-y-2 mt-4 relative z-10">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => `nav-link group relative overflow-hidden rounded-lg ${isActive ? 'active bg-white/5 border-l-0' : 'hover:bg-white/[0.02]'}`}
                onClick={() => setSidebarOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent shadow-[0_0_10px_rgba(0,255,163,0.5)]" />}
                    {isActive && <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent pointer-events-none" />}
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={`relative z-10 ${isActive ? 'text-accent drop-shadow-[0_0_8px_rgba(0,255,163,0.5)]' : 'text-muted group-hover:text-foreground transition-colors'}`} />
                    <span className="relative z-10 flex-1 text-[11px] tracking-[0.15em] font-bold">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User + Logout */}
          <div className="p-8 mt-auto mx-0 relative z-10">
            <button className="w-full py-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/5 text-muted hover:text-white font-display font-semibold uppercase tracking-widest text-[10px] transition-all rounded-lg mb-8 shadow-inner hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              Market Insights
            </button>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-4 text-muted hover:text-danger/90 transition-colors font-display font-bold tracking-widest uppercase text-[11px]">
              <LogOut size={16} />
              Logout Session
            </button>
          </div>
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-6 py-5 bg-[#050505]/70 backdrop-blur-2xl border-b border-white/5 z-20 sticky top-0 shadow-lg">
          <div className="flex items-center gap-3">
            <h1 className="text-accent font-display font-bold tracking-widest text-[14px] uppercase drop-shadow-[0_0_8px_rgba(0,255,163,0.3)]">Obsidian</h1>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="text-muted hover:text-foreground">
            <Menu size={24} />
          </button>
        </header>

        {/* Top Navigation Bar / Branding (Desktop) */}
        <header className="hidden lg:flex items-center justify-between px-10 py-6 sticky top-0 z-20 bg-[#050505]/40 backdrop-blur-3xl border-b border-white/[0.03]">
          <h1 className="text-accent font-display font-bold tracking-[0.2em] uppercase text-xl drop-shadow-[0_0_10px_rgba(0,255,163,0.2)]">Obsidian</h1>
          
          <div className="flex gap-8">
            <button className="text-muted hover:text-accent font-display uppercase text-[11px] font-bold tracking-widest transition-colors">Overview</button>
            <button className="text-muted hover:text-accent font-display uppercase text-[11px] font-bold tracking-widest transition-colors">Analysis</button>
            <button className="text-muted hover:text-accent font-display uppercase text-[11px] font-bold tracking-widest transition-colors">Reports</button>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-muted hover:text-accent transition-colors"><Bell size={20}/></button>
            <button className="text-muted hover:text-accent transition-colors"><Settings size={20}/></button>
            <div className="w-9 h-9 rounded-full bg-surface/80 backdrop-blur-md border border-white/10 flex items-center justify-center font-bold text-xs uppercase shadow-[0_0_20px_rgba(0,255,163,0.1)] relative">
              <div className="absolute inset-0 rounded-full border border-accent/20 opacity-0 hover:opacity-100 transition-opacity animate-pulse" />
              {user?.user_name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-5 py-6 lg:px-12 lg:py-6 z-10 pb-28 lg:pb-10 no-scrollbar">
          <div className="max-w-[1400px] mx-auto min-h-full">
             <Outlet />
          </div>
        </main>
        
        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-3xl border-t border-white/10 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] pb-safe">
          <div className="flex items-center justify-around px-2 py-2">
            {mobileNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center justify-center w-full py-1.5 transition-all duration-300 ${isActive ? 'text-accent' : 'text-muted hover:text-white hover:bg-white/5 rounded-2xl'}`}>
                {({ isActive }) => (
                  <>
                    <div className={`p-1.5 rounded-xl mb-0.5 transition-all duration-300 ${isActive ? 'bg-accent/15' : ''}`}>
                      <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''} />
                    </div>
                    <span className="text-[10px] font-bold tracking-wide">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
