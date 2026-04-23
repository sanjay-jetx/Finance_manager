import { useEffect, useState } from 'react'
import api from '../api/axios'
import { getCached, setCached } from '../api/cache'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import { PieChart, Plus, X, AlertTriangle, CheckSquare } from 'lucide-react'

const EXPENSE_CATEGORIES = [
  'Food & Dining','Transport','Shopping','Entertainment','Health',
  'Bills & Utilities','Education','Travel','Groceries','Other'
]

export default function Budgets() {
  const [budgets, setBudgets] = useState(() => getCached('budgets') || [])
  const [loading, setLoading] = useState(!getCached('budgets'))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category: '', limit: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchBudgets = async () => {
    if (!getCached('budgets')) setLoading(true)
    try {
      const res = await api.get('/budgets')
      setCached('budgets', res.data.budgets)
      setBudgets(res.data.budgets)
    } catch (err) { toast.error('Failed to load budgets') } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchBudgets() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/budgets', { category: form.category, limit: +form.limit })
      toast.success('Limit restriction established.')
      setForm({ category: '', limit: '' })
      setShowForm(false)
      fetchBudgets()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to save limit') } 
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6 lg:space-y-8 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-stagger-1">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-widest uppercase text-foreground">Operational Limits</h1>
          <p className="obsidian-label mt-2">CAPITAL DISBURSEMENT PROTOCOLS</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="panel px-4 py-3 bg-surface hover:bg-white/5 border border-white/[0.05] text-muted hover:text-white transition-colors flex items-center gap-3 font-display uppercase tracking-widest font-bold text-[10px]">
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Abort' : 'Define New Threshold'}
        </button>
      </div>

      {showForm && (
        <div className="panel p-6 sm:p-8 animate-stagger-2 relative overflow-hidden bg-[#0B0C10] shadow-2xl border border-white/[0.04] outline outline-1 outline-white/[0.02]">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] font-display text-muted mb-6">ESTABLISH CATEGORY THRESHOLD</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Traffic Category</label>
              <select className="w-full bg-[#15161A] border border-white/5 rounded py-4 px-5 text-white font-mono text-[14px] focus:outline-none focus:border-accent transition-all shadow-inner"
                required value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="" className="bg-surface">Select Classification</option>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c} className="bg-surface">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Maximum Flux (₹)</label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-xl group-focus-within:text-white">₹</span>
                <input type="number" min="1" step="0.01" required placeholder="0.00"
                  value={form.limit} onChange={e => setForm({...form, limit: e.target.value})}
                  className="w-full bg-[#15161A] border border-white/5 rounded py-4 pl-12 pr-5 text-white font-mono text-xl font-bold focus:outline-none focus:border-accent transition-all shadow-inner" />
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" className="px-8 py-3 rounded text-[11px] border border-white/5 text-muted font-display uppercase tracking-widest font-bold hover:bg-white/5 transition-colors" onClick={() => setShowForm(false)}>Abort</button>
              <button type="submit" className="btn-primary flex items-center justify-center gap-2 bg-surface text-foreground shadow-none border border-white/10 hover:border-accent/50 hover:bg-white/5 disabled:opacity-70" disabled={submitting}>
                {submitting ? <span className="w-4 h-4 border-2 border-[currentColor]/30 border-t-[currentColor] rounded-full animate-spin" /> : null}
                Commit Threshold
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-stagger-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="panel p-6 space-y-4 border-transparent bg-surface/20">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="skeleton h-5 w-28 rounded-none" />
                  <div className="skeleton h-4 w-20 rounded-none" />
                </div>
                <div className="skeleton h-7 w-20 rounded-none" />
              </div>
              <div className="skeleton h-1 w-full rounded-none" />
              <div className="flex justify-between">
                <div className="skeleton h-3 w-16 rounded-none" />
                <div className="skeleton h-3 w-20 rounded-none" />
              </div>
            </div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="panel p-16 flex flex-col items-center justify-center text-center animate-stagger-3 border-dashed">
          <div className="w-12 h-12 rounded border border-white/5 bg-[#0C0D10] flex items-center justify-center mb-6 text-muted"><PieChart size={20} /></div>
          <p className="text-foreground font-display font-bold text-xl uppercase tracking-widest mb-3">No Thresholds Configured</p>
          <p className="text-muted text-[13px] font-mono max-w-xs">Establish category limitations to automatically monitor capital depletion.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-stagger-3">
          {budgets.map(b => {
            const pct = b.limit > 0 ? Math.min((b.spent / b.limit) * 100, 100) : 0
            const safe   = pct < 80
            const warn   = pct >= 80 && pct < 100
            const danger = pct >= 100

            let borderColor = 'border-white/[0.05] hover:border-white/20'
            let barColor    = 'bg-accent'
            let statusText  = 'Optimal'
            let Icon        = CheckSquare
            let iconClass   = 'text-accent border-accent/20 bg-accent/[0.02]'

            if (warn)   { borderColor = 'border-warning/30'; barColor = 'bg-warning'; statusText = 'Approaching Limit'; Icon = AlertTriangle; iconClass = 'text-warning bg-warning/[0.05] border-warning/20' }
            if (danger) { borderColor = 'border-danger/40 shadow-[0_0_20px_rgba(255,51,102,0.1)]'; barColor = 'bg-danger'; statusText = 'Cap Exceeded'; Icon = AlertTriangle; iconClass = 'text-danger bg-danger/[0.1] border-danger/40' }

            const remaining = Math.max(b.limit - b.spent, 0)

            return (
              <div key={b._id} className={`panel p-6 pb-5 relative overflow-hidden group transition-all duration-300 border ${borderColor}`}>
                
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div>
                    <h3 className="text-foreground border-b border-white/[0.05] pb-1 font-display tracking-wide font-bold text-[15px] mb-3 inline-block">{b.category}</h3>
                    <div className="mt-1">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border ${iconClass}`}>
                        <Icon size={10} />
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] font-display">{statusText}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-mono font-bold text-3xl tracking-tight leading-none mb-1">{fmt(b.spent)}</p>
                    <p className="text-[10px] text-muted font-bold font-display uppercase tracking-widest mt-1 opacity-70">Limit: {fmt(b.limit)}</p>
                  </div>
                </div>

                <div className="w-full bg-[#0A0B0E] rounded border border-white/[0.04] h-1.5 mb-3 flex overflow-hidden relative z-10">
                  <div className={`${barColor} h-full transition-all duration-1000 ease-out ${safe ? 'shadow-[0_0_10px_rgba(0,255,163,0.5)]' : ''}`} style={{ width: `${pct}%` }} />
                </div>

                <div className="flex justify-between text-[11px] uppercase tracking-widest font-display font-bold text-muted mt-2 relative z-10">
                  <span className="opacity-70">{pct.toFixed(0)}% Depleted</span>
                  <span className={danger ? 'text-danger' : 'text-foreground'}>
                    {danger ? 'CRITICAL DEPLETION' : `${fmt(remaining)} ALLOWANCE`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
