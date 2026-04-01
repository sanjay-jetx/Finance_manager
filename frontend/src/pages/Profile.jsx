import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { User, Mail, Download, AlertOctagon, Settings, ShieldAlert, CheckCircle, Bell, UserCheck } from 'lucide-react'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [clearing, setClearing] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await api.get('/transactions/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'transactions.csv')
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Backup exported successfully!')
    } catch (err) {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('⚠️ WARNING: This will permanently erase ALL your transactions, goals, budgets, lending records, and reset your wallet balances to ₹0.00!')) return
    if (!window.confirm('Are you ABSOLUTELY sure you want to wipe all data and start completely fresh? This CANNOT be undone!')) return
    
    setClearing(true)
    try {
      await api.delete('/transactions/clear_all')
      toast.success('All data wiped! Fresh start initiated. 🎉')
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to clear data')
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="section-title">My Profile</h1>
          <p className="section-sub">Manage your account and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Identity */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card text-center relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary-600/20 to-violet-600/20 pointer-events-none" />
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-violet-600
                            flex items-center justify-center text-white text-5xl font-black mt-6 mb-4 relative z-10 shadow-2xl shadow-primary-500/20 border-4 border-surface-dark/50">
              {user?.user_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <h2 className="text-2xl font-bold text-white relative z-10">{user?.user_name || 'FinTrack User'}</h2>
            <p className="text-primary-400 font-medium text-sm mt-1 relative z-10">{user?.email || 'user@example.com'}</p>
            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <UserCheck size={14} /> ACTIVE MEMBER
            </div>
          </div>
        </div>

        {/* Right Column - Settings & Danger Zone */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Account Details */}
          <div className="card p-0 overflow-hidden border-white/10">
            <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Settings size={18} className="text-primary-400" /> General Settings
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <div>
                  <p className="text-sm font-semibold text-white">Full Name</p>
                  <p className="text-xs text-gray-500">{user?.user_name || 'Loading...'}</p>
                </div>
                <User size={18} className="text-gray-600" />
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <div>
                  <p className="text-sm font-semibold text-white">Email Address</p>
                  <p className="text-xs text-gray-500">{user?.email || 'Loading...'}</p>
                </div>
                <Mail size={18} className="text-gray-600" />
              </div>
              <div className="flex justify-between items-center py-2">
                <div>
                  <p className="text-sm font-semibold text-white">Currency Preference</p>
                  <p className="text-xs text-gray-500">Fixed to INR (₹)</p>
                </div>
                <p className="text-sm font-bold text-gray-400">₹</p>
              </div>
            </div>
          </div>

          {/* Backup Data */}
          <div className="card p-0 overflow-hidden border-blue-500/20">
            <div className="px-6 py-5 border-b border-blue-500/10 bg-blue-500/5">
              <h3 className="text-blue-400 font-bold flex items-center gap-2">
                <Download size={18} /> Data Backup
              </h3>
            </div>
            <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-sm text-gray-300 font-medium">Export all transactions to CSV</p>
                <p className="text-xs text-gray-500 mt-1">Keep a secure local backup of your exact financial history.</p>
              </div>
              <button 
                onClick={handleExport}
                disabled={exporting}
                className="btn-secondary text-sm py-2.5 px-6 flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border-blue-500/20 whitespace-nowrap">
                {exporting ? <span className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" /> : <Download size={16} />}
                Export Data
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card p-0 overflow-hidden border-red-500/30">
            <div className="px-6 py-5 border-b border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition-colors">
              <h3 className="text-red-400 font-bold flex items-center gap-2">
                <AlertOctagon size={18} /> Danger Zone
              </h3>
            </div>
            <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1 pr-6">
                <p className="text-sm text-red-300 font-medium">Clear All Data</p>
                <p className="text-xs text-red-400/70 mt-1">Permanently erase all your transactions, debts, goals, and reset wallet balances to zero. This action is absolutely irreversible.</p>
              </div>
              <button 
                onClick={handleClearAll}
                disabled={clearing}
                className="btn-secondary text-sm py-2.5 px-6 flex items-center gap-2 text-red-400 border-red-500/30 hover:bg-red-500 hover:text-white transition-all whitespace-nowrap">
                {clearing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShieldAlert size={16} />}
                Factory Reset
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
