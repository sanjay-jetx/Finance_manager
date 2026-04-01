import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, ArrowLeftRight, HandCoins, Wallet,
  LogOut, TrendingUp, Menu, X, Target, PieChart, Gem, CreditCard
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/receivables',  icon: HandCoins,       label: 'You Will Receive' },
  { to: '/wallets',      icon: Wallet,          label: 'Wallets' },
  { to: '/metals',       icon: Gem,             label: 'Gold & Silver' },
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
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col
        bg-surface-dark/80 backdrop-blur-xl border-r border-white/10
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600
                          flex items-center justify-center shadow-lg glow-primary">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">FinTrack</h1>
            <p className="text-gray-500 text-xs mt-0.5">Finance Manager</p>
          </div>
          <button className="ml-auto lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-white/10">
          <NavLink to="/profile" onClick={() => setSidebarOpen(false)}
            className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all mb-2 cursor-pointer border border-transparent hover:border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-violet-600
                            flex items-center justify-center text-white text-sm font-bold shadow-md group-hover:shadow-primary-500/20 transition-all">
              {user?.user_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.user_name || 'User'}</p>
              <p className="text-gray-500 text-xs truncate group-hover:text-primary-400 transition-colors">View Profile</p>
            </div>
          </NavLink>
          <button onClick={handleLogout}
            className="w-full nav-link text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3
                           bg-surface-dark/80 backdrop-blur-xl border-b border-white/10">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
            <Menu size={22} />
          </button>
          <h1 className="text-white font-bold gradient-text">FinTrack</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
