import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, ArrowLeftRight, HandCoins, Wallet,
  LogOut, Menu, X, Gem, Layers, ChevronRight, TrendingUp, User
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
    <div className="flex h-[100dvh] overflow-hidden bg-[#0A0D14] text-white selection:bg-indigo-500/30 font-sans">
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm transition-all"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Floating Sidebar Container (Desktop) */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-[#12141D] border-r border-[#1C1F2A] transition-transform duration-300 flex flex-col shadow-2xl lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)] relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
            <Layers size={20} className="text-white relative z-10" />
          </div>
          <div>
            <h1 className="text-white font-bold text-[16px] leading-tight tracking-wide">FinTrack</h1>
            <p className="text-[#8B92A5] text-[9px] font-bold tracking-[0.2em] mt-0.5 uppercase">Manager</p>
          </div>
          
          <button className="ml-auto lg:hidden text-[#8B92A5] hover:text-white bg-white/5 p-2 rounded-lg"
            onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <div className="px-4 py-2 flex-1 overflow-y-auto no-scrollbar">
          <p className="text-[#6B7280] text-[10px] font-bold tracking-[0.15em] px-3 mb-3 uppercase">Menu</p>
          <nav className="space-y-1.5">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative ${isActive ? 'bg-[#1D2132] text-white shadow-inner' : 'text-[#8B92A5] hover:bg-[#191C26] hover:text-white'}`}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'text-[#6B7280] group-hover:text-white'} />
                    <span className={`text-[14px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
                    {isActive && <ChevronRight size={16} className="ml-auto text-[#8B92A5]" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom User Area */}
        <div className="mt-auto p-4 mb-2">
          <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-2xl bg-[#0A0D14] border border-[#1C1F2A]">
            <div className="w-9 h-9 rounded-full bg-[#1D2132] text-[#8B92A5] flex items-center justify-center text-[14px] font-bold uppercase border border-[#2A2E3D]">
              {user?.user_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-bold truncate">{user?.user_name || 'Guest'}</p>
              <p className="text-[#6B7280] text-[11px] font-medium">Preferences</p>
            </div>
          </div>
          
          <button onClick={handleLogout} className="flex items-center gap-3 text-[#EF4444] hover:text-[#F87171] px-4 py-3 transition-colors text-[13px] font-bold w-full rounded-xl hover:bg-red-500/10">
            <LogOut size={16} strokeWidth={2.5} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-[#0A0D14] min-w-0">
        
        {/* Mobile Header (Only visible on small screens) */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-[#12141D] border-b border-[#1C1F2A] z-30">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
               <Layers size={14} className="text-white" />
             </div>
             <h1 className="text-white font-bold text-[14px]">FinTrack</h1>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="text-[#8B92A5] hover:text-white">
            <Menu size={24} />
          </button>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto w-full no-scrollbar relative min-w-0">
           <Outlet />
        </main>
      </div>
    </div>
  )
}
