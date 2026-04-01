import { useEffect, useState, useCallback } from 'react'
import api from '../api/axios'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import {
  RefreshCw, Plus, CreditCard, X, TrendingDown,
  Calendar, Check, Zap, Play, Pause, Trash2, CalendarDays
} from 'lucide-react'

// Common categories for subscriptions
const SUB_CATS = ['Entertainment', 'Software & Tech', 'Utilities', 'Gym & Health', 'Other']

/* ─── Glass card wrapper ─────────────────────────────────────────────────── */
function GCard({ children, style = {}, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-[24px] border border-white/[0.07] ${className}`}
      style={{
        background: 'linear-gradient(145deg,rgba(17,24,39,0.95),rgba(5,5,8,0.98))',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 40px -12px rgba(0,0,0,0.5)',
        cursor: onClick ? 'pointer' : undefined,
        ...style
      }}
    >
      {children}
    </div>
  )
}

/* ─── Quick Add Modal ───────────────────────────────────────────────────────── */
function AddSubModal({ onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [category, setCategory] = useState('Entertainment')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !amount) return toast.error('Name & amount required')

    setLoading(true)
    try {
      await api.post('/subscriptions/', {
        name,
        amount: parseFloat(amount),
        billing_cycle: billingCycle,
        category,
      })
      toast.success('Subscription saved!')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error('Failed to add subscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-[28px] border border-white/[0.08] overflow-hidden"
           style={{
             background: 'linear-gradient(160deg,rgba(17,24,39,0.98),rgba(5,5,8,0.99))',
             boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8)',
             animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
           }}>
        
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/15">
              <CreditCard size={18} className="text-purple-400" />
            </div>
            <h2 className="text-white font-black text-lg">New Sub</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          
          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Service Name</label>
            <input type="text" autoFocus required value={name} onChange={e => setName(e.target.value)} placeholder="Netflix, Spotify..."
              className="w-full bg-white/5 border-[1.5px] border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-purple-500/50" />
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Price</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input type="number" min="1" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                className="w-full bg-white/5 border-[1.5px] border-white/10 rounded-xl pl-8 pr-4 py-3 text-white font-black text-lg outline-none focus:border-purple-500/50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Cycle</label>
              <select value={billingCycle} onChange={e => setBillingCycle(e.target.value)}
                className="w-full bg-white/5 border-[1.5px] border-white/10 rounded-xl px-3 py-3 text-white text-sm font-semibold outline-none focus:border-purple-500/50 appearance-none">
                <option value="monthly" className="bg-slate-900">Monthly</option>
                <option value="yearly"  className="bg-slate-900">Yearly</option>
                <option value="weekly"  className="bg-slate-900">Weekly</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-white/5 border-[1.5px] border-white/10 rounded-xl px-3 py-3 text-white text-sm font-semibold outline-none focus:border-purple-500/50 appearance-none">
                {SUB_CATS.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className={`w-full py-4 mt-2 rounded-xl text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2
              ${loading ? 'bg-purple-900/50 pointer-events-none' : 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-xl shadow-purple-500/20'} transition-all`}>
            {loading ? 'Saving...' : <><Check size={16} /> Save Subscription</>}
          </button>
        </form>
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function Subscriptions() {
  const [data, setData] = useState({ subscriptions: [], total_monthly_fixed: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const fetchSubs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await api.get('/subscriptions/')
      setData(res.data)
    } catch (err) {
      toast.error('Failed to load subscriptions')
    } finally {
      setLoading(false); setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchSubs() }, [fetchSubs])

  const toggleSub = async (id) => {
    try {
      await api.patch(`/subscriptions/${id}/toggle`)
      fetchSubs(true)
    } catch {
      toast.error('Toggle failed')
    }
  }

  const deleteSub = async (id, name) => {
    if(!window.confirm(`Delete ${name}?`)) return
    try {
      await api.delete(`/subscriptions/${id}`)
      toast('Deleted', { icon: '🗑️' })
      fetchSubs(true)
    } catch {
      toast.error('Delete failed')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6" style={{ animation: 'riseIn 0.4s ease-out' }}>
      
      {showAdd && <AddSubModal onClose={() => setShowAdd(false)} onSuccess={() => fetchSubs(true)} />}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-[26px] font-black tracking-tight flex items-center gap-2">
            Subscriptions <Zap size={20} className="text-purple-400" />
          </h1>
          <p className="text-slate-400 text-sm font-semibold mt-1">Track your recurring monthly bills</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchSubs(true)}
            className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white bg-white/5">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm uppercase tracking-wider text-white"
            style={{ background: 'linear-gradient(135deg,#c026d3,#9333ea)', boxShadow: '0 4px 16px rgba(147,51,234,0.3)' }}>
            <Plus size={16} /> New
          </button>
        </div>
      </div>

      {/* ── Main Total Card ──────────────────────────────────────────────── */}
      <GCard className="p-8 flex flex-col justify-between"
          style={{ background: 'linear-gradient(135deg,rgba(192,38,211,0.15),rgba(147,51,234,0.1),rgba(5,5,8,0.9))', borderColor: 'rgba(192,38,211,0.2)' }}>
        <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent" />
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown size={16} className="text-rose-400" />
              <span className="text-[11px] font-extrabold text-rose-400/80 uppercase tracking-[0.2em]">Total Fixed Costs</span>
            </div>
            <p className="text-white font-black text-4xl tracking-tight">
              {fmt(data.total_monthly_fixed, 2)}
              <span className="text-lg text-slate-500 font-bold tracking-normal"> / mo</span>
            </p>
            <p className="text-slate-400 text-xs font-semibold mt-2">
              If all active subscriptions bill every month.
            </p>
          </div>
          
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/10 border border-fuchsia-500/20 flex items-center justify-center glow-primary">
            <CalendarDays size={24} className="text-fuchsia-400" />
          </div>
        </div>
      </GCard>

      {/* ── List ─────────────────────────────────────────────────────────── */}
      <h2 className="text-white font-black text-lg tracking-tight mt-8 mb-4">Your Services</h2>

      {data.subscriptions.length === 0 ? (
        <GCard className="py-16 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
              <CreditCard size={24} className="text-purple-400/50" />
            </div>
            <p className="text-slate-400 font-bold mb-2">No subscriptions tracked yet</p>
            <button onClick={() => setShowAdd(true)} className="text-purple-400 font-bold text-xs uppercase tracking-widest mt-2 hover:text-purple-300">
              + Add your first
            </button>
        </GCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.subscriptions.map((sub, i) => {
            const isActive = sub.is_active !== false // true by default
            return (
              <GCard key={sub._id} className="p-5 flex flex-col" style={{ animation: `riseIn 0.3s ease-out ${i*0.05}s both`, opacity: isActive ? 1 : 0.6 }}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isActive ? 'bg-purple-500/15 border-purple-500/20' : 'bg-slate-800 border-slate-700'}`}>
                    <CreditCard size={18} className={isActive ? 'text-purple-400' : 'text-slate-500'} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleSub(sub._id)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                      {isActive ? <Pause size={14} className="text-amber-400" /> : <Play size={14} className="text-emerald-400" />}
                    </button>
                    <button onClick={() => deleteSub(sub._id, sub.name)} className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center transition-colors">
                      <Trash2 size={14} className="text-rose-400" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-white font-bold text-lg leading-tight mb-1 truncate" style={{ textDecoration: isActive ? 'none' : 'line-through' }}>{sub.name}</h3>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-4">{sub.category}</p>

                <div className="mt-auto pt-4 border-t border-white/[0.04] flex items-end justify-between">
                  <p className="text-white font-black text-xl">
                    {fmt(sub.amount)}<span className="text-xs text-slate-500 font-bold"> / {sub.billing_cycle === 'yearly' ? 'yr' : sub.billing_cycle === 'weekly' ? 'wk' : 'mo'}</span>
                  </p>
                  
                  {!isActive && <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded font-bold uppercase tracking-widest">Paused</span>}
                </div>
              </GCard>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes riseIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
