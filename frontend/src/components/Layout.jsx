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
  { to: '/budgets',       icon: PieChart,        label: 'WEALTH' },
  { to: '/goals',         icon: Target,          label: 'GOALS' },
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
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm transition-all"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Floating Sidebar Container (Desktop) */}
      <div className={`fixed lg:static inset-y-0 left-0 z-30 w-[280px] transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <aside className="w-full h-full flex flex-col bg-[#0A0A0C] border-r border-white/5 overflow-hidden relative">
          
          {/* Logo Area */}
          <div className="flex items-center gap-4 px-8 py-10 relative z-10">
            <div className="w-10 h-10 rounded bg-accent flex items-center justify-center shadow-glow-accent flex-shrink-0">
              <Gem size={20} className="text-black" />
            </div>
            <div>
              <h1 className="text-foreground font-display font-bold text-[14px] leading-tight tracking-wider uppercase">The Obsidian Vault</h1>
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
                className={({ isActive }) => `nav-link group ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-accent' : 'text-muted group-hover:text-foreground transition-colors'} />
                    <span className="flex-1 text-[11px] tracking-[0.15em] font-semibold">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User + Logout */}
          <div className="p-8 mt-auto mx-0 relative z-10">
            <button className="w-full py-4 bg-surface hover:bg-surfaceHover border border-white/5 text-muted hover:text-foreground font-display font-semibold uppercase tracking-widest text-[10px] transition-colors rounded mb-8">
              Market Insights
            </button>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-4 text-muted hover:text-danger transition-colors font-display font-bold tracking-widest uppercase text-[11px]">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-background">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-6 py-5 bg-[#000000] border-b border-white/5 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <h1 className="text-accent font-display font-bold tracking-widest text-[14px] uppercase">Obsidian</h1>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="text-muted hover:text-foreground">
            <Menu size={24} />
          </button>
        </header>

        {/* Top Navigation Bar / Branding (Desktop) */}
        <header className="hidden lg:flex items-center justify-between px-10 py-8 sticky top-0 z-10 bg-background/90 backdrop-blur-md">
          <h1 className="text-accent font-display font-bold tracking-[0.2em] uppercase text-xl">Obsidian</h1>
          
          <div className="flex gap-8">
            <button className="text-muted hover:text-accent font-display uppercase text-[11px] font-bold tracking-widest transition-colors">Overview</button>
            <button className="text-muted hover:text-accent font-display uppercase text-[11px] font-bold tracking-widest transition-colors">Analysis</button>
            <button className="text-muted hover:text-accent font-display uppercase text-[11px] font-bold tracking-widest transition-colors">Reports</button>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-muted hover:text-foreground transition-colors"><Bell size={20}/></button>
            <button className="text-muted hover:text-foreground transition-colors"><Settings size={20}/></button>
            <div className="w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center font-bold text-xs uppercase shadow-glow-accent">
              {user?.user_name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-5 py-6 lg:px-12 lg:py-6 z-10 pb-28 lg:pb-10">
          <div className="max-w-[1400px] mx-auto">
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
