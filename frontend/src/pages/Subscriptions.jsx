import { useEffect, useState, useCallback } from 'react'
import api from '../api/axios'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import {
  RefreshCw, Plus, CreditCard, X, TrendingDown,
  CalendarDays, Pause, Play, Trash2, Zap
} from 'lucide-react'

const SUB_CATS = ['Entertainment', 'Software & Tech', 'Utilities', 'Gym & Health', 'Other']
const CYCLE_LABELS = { monthly: 'MO', yearly: 'YR', weekly: 'WK' }

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
      await api.post('/subscriptions/', { name, amount: parseFloat(amount), billing_cycle: billingCycle, category })
      toast.success('Subscription committed.')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error('Failed to add subscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/90 backdrop-blur-md"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded bg-[#0B0C10] border border-white/5 outline outline-1 outline-white/[0.02] shadow-2xl overflow-hidden animate-stagger-1">
        
        <div className="absolute top-0 left-0 w-full h-[2px] bg-accent/60" />

        <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded border border-purple-500/20 bg-purple-500/5 flex items-center justify-center">
              <CreditCard size={15} className="text-purple-400" />
            </div>
            <h2 className="text-white font-display font-bold text-sm uppercase tracking-widest">Register Service</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors p-1"><X size={15} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
          
          <div>
            <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-2.5 ml-1">Service Identifier</label>
            <input type="text" autoFocus required value={name} onChange={e => setName(e.target.value)} placeholder="Netflix, Spotify, etc."
              className="obsidian-input" />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-2.5 ml-1">Cost Per Cycle (₹)</label>
            <div className="relative group">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted font-bold text-xl group-focus-within:text-white transition-colors">₹</span>
              <input type="number" min="1" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                className="obsidian-input pl-12 text-2xl font-mono font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-2.5 ml-1">Billing Cycle</label>
              <select value={billingCycle} onChange={e => setBillingCycle(e.target.value)} className="obsidian-select w-full">
                <option value="monthly" className="bg-[#0B0C10]">Monthly</option>
                <option value="yearly"  className="bg-[#0B0C10]">Yearly</option>
                <option value="weekly"  className="bg-[#0B0C10]">Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-2.5 ml-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="obsidian-select w-full">
                {SUB_CATS.map(c => <option key={c} value={c} className="bg-[#0B0C10]">{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 rounded text-[11px] border border-white/5 text-muted font-display uppercase tracking-widest font-bold hover:bg-white/5 transition-colors">
              Abort
            </button>
            <button type="submit" disabled={loading}
              className="flex-[2] py-3.5 rounded text-[11px] font-display uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 disabled:opacity-50">
              {loading ? <span className="w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin" /> : null}
              Commit Service
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

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
    if(!window.confirm(`Purge "${name}" from tracking?`)) return
    try {
      await api.delete(`/subscriptions/${id}`)
      toast('Service unregistered.', { icon: '🗑️' })
      fetchSubs(true)
    } catch {
      toast.error('Delete failed')
    }
  }

  const active = data.subscriptions.filter(s => s.is_active !== false)
  const paused = data.subscriptions.filter(s => s.is_active === false)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-[3px] border-purple-400/20 border-t-purple-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 animate-stagger-1">
      
      {showAdd && <AddSubModal onClose={() => setShowAdd(false)} onSuccess={() => fetchSubs(true)} />}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-widest uppercase text-foreground">Subscriptions</h1>
          <p className="obsidian-label mt-2">RECURRING COST MATRIX</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fetchSubs(true)}
            className="panel p-3 bg-surface hover:bg-white/5 border border-white/[0.05] text-muted hover:text-white transition-colors">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="panel px-4 py-3 bg-surface hover:bg-white/5 border border-purple-500/20 text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-3 font-display uppercase tracking-widest font-bold text-[10px]">
            <Plus size={13} /> Register New
          </button>
        </div>
      </div>

      {/* Total Fixed Costs Panel */}
      <div className="panel p-8 lg:p-10 flex flex-wrap items-center justify-between gap-6 relative overflow-hidden border border-purple-500/10">
        <div className="absolute left-0 top-0 w-1 h-full bg-purple-500/60" />
        
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 rounded border border-purple-500/20 bg-purple-500/5 flex items-center justify-center">
            <CalendarDays size={22} className="text-purple-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.25em] font-display mb-1.5">Monthly Fixed Overhead</p>
            <p className="text-4xl lg:text-5xl font-mono font-bold text-foreground tracking-tight">
              {fmt(data.total_monthly_fixed, 2)}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap gap-10 pl-6 lg:border-l lg:border-white/5">
          <div>
            <p className="text-2xl font-mono font-bold text-foreground">{active.length}</p>
            <p className="obsidian-label mt-1 text-accent">Active</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-bold text-foreground">{paused.length}</p>
            <p className="obsidian-label mt-1 text-muted">Paused</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-bold text-foreground">{data.subscriptions.length}</p>
            <p className="obsidian-label mt-1 text-muted">Total</p>
          </div>
        </div>
      </div>

      {/* Sub List */}
      {data.subscriptions.length === 0 ? (
        <div className="panel p-16 flex flex-col items-center text-center border-dashed">
          <div className="w-12 h-12 rounded border border-purple-500/20 bg-purple-500/5 flex items-center justify-center mb-6">
            <CreditCard size={20} className="text-purple-400/60" />
          </div>
          <p className="text-foreground font-display font-bold text-xl uppercase tracking-widest mb-3">No Services Tracked</p>
          <p className="text-muted text-[13px] font-mono mb-6 max-w-xs">Register recurring subscriptions to monitor your monthly fixed overhead.</p>
          <button onClick={() => setShowAdd(true)}
            className="panel px-6 py-3 border border-purple-500/20 text-purple-400 font-display uppercase tracking-widest font-bold text-[10px] hover:bg-purple-500/5 hover:text-purple-300 transition-colors">
            <Plus size={12} className="inline mr-2" /> Register First Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.subscriptions.map((sub, i) => {
            const isActive = sub.is_active !== false
            return (
              <div key={sub._id}
                className={`panel p-6 flex flex-col relative transition-all duration-300 border scan-line ${
                  isActive ? 'border-purple-500/10 hover:border-purple-500/30' : 'border-white/[0.03] opacity-50 hover:opacity-70'
                }`}
                style={{ animationDelay: `${i * 0.04}s` }}>

                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded border flex items-center justify-center transition-colors ${
                      isActive ? 'border-purple-500/30 bg-purple-500/[0.07] text-purple-400' : 'border-white/5 bg-white/[0.03] text-muted'
                    }`}>
                      <CreditCard size={14} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleSub(sub._id)}
                      className={`p-2 rounded border transition-all ${isActive ? 'border-warning/20 bg-warning/5 hover:bg-warning/10 text-warning' : 'border-accent/20 bg-accent/5 hover:bg-accent/10 text-accent'}`}
                      title={isActive ? 'Pause' : 'Activate'}>
                      {isActive ? <Pause size={12} /> : <Play size={12} />}
                    </button>
                    <button onClick={() => deleteSub(sub._id, sub.name)}
                      className="p-2 rounded border border-danger/10 bg-danger/5 hover:bg-danger/15 hover:border-danger/30 transition-all text-danger"
                      title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <h3 className="text-foreground font-display font-bold text-[15px] tracking-wide leading-tight mb-1.5 truncate"
                    style={{ textDecoration: isActive ? 'none' : 'line-through' }}>
                  {sub.name}
                </h3>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] font-display text-muted mb-6 opacity-50">{sub.category}</p>

                <div className="mt-auto pt-5 border-t border-white/[0.04] flex items-end justify-between">
                  <p className="font-mono font-bold text-2xl text-foreground tracking-tight">
                    {fmt(sub.amount)}
                    <span className="text-[10px] text-muted font-display uppercase tracking-widest ml-1.5 font-bold">
                      / {CYCLE_LABELS[sub.billing_cycle] || 'MO'}
                    </span>
                  </p>
                  
                  {!isActive && (
                    <span className="text-[9px] bg-[#0C0D10] border border-white/5 text-muted px-2 py-1 rounded font-bold uppercase tracking-widest font-display">
                      Paused
                    </span>
                  )}
                  {isActive && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      <span className="text-[9px] text-accent font-bold uppercase tracking-widest font-display">Active</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
