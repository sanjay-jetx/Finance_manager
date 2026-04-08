import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, ArrowLeftRight, HandCoins, Wallet,
  LogOut, Menu, X, Gem, Layers, ChevronRight, PieChart, Target, CreditCard, TrendingUp
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Overview' },
  { to: '/transactions',  icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/receivables',   icon: HandCoins,       label: 'Receivables' },
  { to: '/wallets',       icon: Wallet,          label: 'Wallets' },
  { to: '/stocks',        icon: TrendingUp,      label: 'Stocks' },
  { to: '/metals',        icon: Gem,             label: 'Metals' },
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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm transition-all"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Floating Sidebar Container (Desktop) */}
      <div className={`fixed lg:static inset-y-0 left-0 z-30 w-72 lg:p-5 transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <aside className="w-full h-full flex flex-col bg-white/[0.03] backdrop-blur-2xl lg:rounded-[32px] border-r lg:border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden relative">
          
          {/* Subtle top glow in sidebar */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />

          {/* Logo Area */}
          <div className="flex items-center gap-3 px-6 py-8 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-accent">
              <Layers size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-foreground font-display font-bold text-xl tracking-tight">FinTrack</h1>
              <p className="text-[10px] uppercase tracking-widest text-muted font-bold mt-0.5">Manager</p>
            </div>
            <button className="ml-auto lg:hidden text-muted hover:text-foreground bg-white/10 p-2 rounded-lg"
              onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1.5 mt-2 relative z-10">
            <p className="px-3 text-[11px] font-bold text-muted/60 uppercase tracking-widest mb-4">Menu</p>
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => `nav-link group ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-accent-light' : 'text-muted group-hover:text-foreground transition-colors'} />
                    <span className="flex-1">{label}</span>
                    {isActive && <ChevronRight size={14} className="text-accent opacity-50" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User + Logout */}
          <div className="p-4 mt-auto mb-2 border-t border-white/10 mx-4 pt-6 relative z-10">
            <NavLink to="/profile" onClick={() => setSidebarOpen(false)}
              className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.06] transition-all mb-3 cursor-pointer border border-transparent hover:border-white/10 shadow-sm hover:shadow-lg">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-foreground text-sm font-bold shadow-md relative overflow-hidden backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-primary opacity-20 group-hover:opacity-40 transition-opacity" />
                <span className="relative z-10">{user?.user_name?.charAt(0)?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-semibold truncate group-hover:text-accent-light transition-colors">{user?.user_name}</p>
                <p className="text-muted text-xs truncate mt-0.5">Preferences</p>
              </div>
            </NavLink>
            <button onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-danger/80 hover:text-danger hover:bg-danger/10 transition-colors font-semibold text-sm">
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-5 py-4
                           bg-white/[0.02] backdrop-blur-xl border-b border-white/10 z-10 sticky top-0 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              <Layers size={16} className="text-white" />
            </div>
            <h1 className="text-foreground font-display font-bold tracking-tight text-lg">FinTrack</h1>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="text-muted hover:text-foreground p-2 bg-white/5 rounded-lg border border-white/5">
            <Menu size={20} />
          </button>
        </header>

        {/* Ambient Glow Orbs */}
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-accent/20 blur-[130px] rounded-full pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[350px] h-[350px] bg-success/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
        <div className="absolute top-[40%] right-[30%] w-[250px] h-[250px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />
        
        <main className="flex-1 overflow-y-auto p-5 lg:p-10 z-10">
          <div className="max-w-6xl mx-auto">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
