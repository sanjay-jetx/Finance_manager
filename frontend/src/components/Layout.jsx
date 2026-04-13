import { Link, useLocation, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, RefreshCw, Wallet, Users, Target,
  LogOut, PieChart as PieChartIcon, Settings, Menu, X, Layers, Activity, Smartphone, CreditCard, Bell
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Layout() {
  const { pathname } = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: RefreshCw },
    { name: 'Receivables', path: '/receivables', icon: Users },
    { name: 'Wallets', path: '/wallets', icon: Wallet },
    { name: 'Stocks', path: '/stocks', icon: Activity },
    { name: 'Metals', path: '/metals', icon: Target },
  ]

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans overflow-hidden">
      
      {/* ── DESKTOP SIDEBAR ────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-[#0A0B0E] border-r border-white/5 h-screen sticky top-0 shrink-0 z-20">
        
        {/* Logo Area */}
        <div className="p-6 pt-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
             <Layers size={20} className="text-white" />
          </div>
          <div className="flex flex-col">
             <span className="text-white font-bold text-lg tracking-wide leading-none">FinTrack</span>
             <span className="text-[#8B92A5] text-[9px] font-bold tracking-[0.3em] mt-1.5 uppercase">Manager</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 mt-6 space-y-1">
          <p className="px-4 text-[10px] font-bold text-[#8B92A5] uppercase tracking-widest mb-4">Menu</p>
          {navItems.map((item) => {
            const isActive = pathname === item.path
            return (
               <Link key={item.name} to={item.path}
                 className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                   isActive ? 'bg-[#1E2235] text-white' : 'text-[#8B92A5] hover:bg-white/5 hover:text-white'
                 }`}
               >
                 <div className="flex items-center gap-3.5">
                    <item.icon size={18} className={isActive ? 'text-indigo-400' : 'text-[#8B92A5] group-hover:text-indigo-400 transition-colors'} />
                    <span className="text-[13px] font-semibold">{item.name}</span>
                 </div>
                 {isActive && <div className="text-white/30 text-[10px]">❯</div>}
               </Link>
            )
          })}
        </div>

        {/* User Card */}
        <div className="p-4 mt-auto">
          <div className="bg-[#050505] rounded-2xl p-4 flex items-center gap-3 border border-white/5 mb-4 group cursor-pointer hover:border-white/10 transition-colors">
            <div className="w-9 h-9 rounded-full bg-[#1E2235] text-indigo-400 flex items-center justify-center font-bold text-sm">
               {user?.email?.[0].toUpperCase() || 'S'}
            </div>
            <div className="flex flex-col flex-1">
               <span className="text-white text-[13px] font-bold">{user?.email?.split('@')[0] || 'User'}</span>
               <span className="text-[#8B92A5] text-[10px] uppercase tracking-widest">Preferences</span>
            </div>
          </div>
          
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors w-full">
            <LogOut size={16} />
            <span className="text-[13px] font-bold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER ──────────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0A0B0E]/90 backdrop-blur-md border-b border-white/5 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center">
             <Layers size={16} className="text-white" />
          </div>
          <span className="text-white font-bold tracking-wide">FinTrack</span>
        </div>
        
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-white/70 hover:bg-white/10 rounded-lg">
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── MOBILE MENU OVERLAY ────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#050505] lg:hidden flex flex-col pt-20 pb-6 animate-stagger-1 border-white/5">
          <div className="px-5 space-y-2 flex-1">
            <p className="text-[10px] font-bold text-[#8B92A5] uppercase tracking-widest mb-4">Menu</p>
            {navItems.map((item) => (
              <Link key={item.name} to={item.path} onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-4 rounded-xl ${
                  pathname === item.path ? 'bg-[#1E2235] text-white' : 'text-[#8B92A5]'
                }`}
              >
                <item.icon size={20} className={pathname === item.path ? 'text-indigo-400' : ''} />
                <span className="font-bold">{item.name}</span>
              </Link>
            ))}
          </div>
          <div className="px-5 mt-auto border-t border-white/10 pt-6">
            <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="flex items-center gap-3 px-4 py-4 text-rose-500 w-full rounded-xl hover:bg-rose-500/10 transition-colors">
              <LogOut size={20} />
              <span className="font-bold">Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────────── */}
      <main className="flex-1 relative h-screen overflow-y-auto scroll-smooth custom-scrollbar">
        {/* Desktop Topbar */}
        <div className="hidden lg:flex sticky top-0 bg-[#050505]/95 backdrop-blur z-20 h-20 items-center justify-end px-10">
           <div className="flex items-center gap-6">
              <button className="text-white/40 hover:text-white transition-colors relative"><Bell size={18} /><span className="absolute 0 top-0 right-0 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#050505]"></span></button>
              <button className="text-white/40 hover:text-white transition-colors"><Settings size={18} /></button>
           </div>
        </div>
        
        <div className="p-4 lg:p-10 pt-20 lg:pt-0 max-w-[1400px] mx-auto min-h-full flex flex-col">
          <Outlet />
        </div>
      </main>
      
    </div>
  )
}
