import { useEffect, useState } from 'react'
import api from '../api/axios'
import { getCached, setCached } from '../api/cache'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import { PieChart, Plus, X, AlertTriangle, CheckCircle2 } from 'lucide-react'

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
      toast.success('Budget saved!')
      setForm({ category: '', limit: '' })
      setShowForm(false)
      fetchBudgets()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to save budget') } 
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6 lg:space-y-8 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-stagger-1">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Monthly Budgets</h1>
          <p className="text-muted mt-1 font-medium">Control your category spending limits</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Set New Limit'}
        </button>
      </div>

      {showForm && (
        <div className="panel p-6 sm:p-8 animate-stagger-2 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-purple-500" />
          <h3 className="text-foreground font-display font-bold text-xl mb-6">Set Category Limit</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Category</label>
              <select className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-medium focus:outline-none focus:border-accent"
                required value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="" className="bg-surface">Select category</option>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c} className="bg-surface">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Monthly Limit (₹)</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-lg group-focus-within:text-accent">₹</span>
                <input type="number" min="1" step="0.01" required placeholder="0.00"
                  value={form.limit} onChange={e => setForm({...form, limit: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-[16px] py-3.5 pl-9 pr-4 text-white font-display text-lg font-bold focus:outline-none focus:border-accent focus:bg-accent/5 transition-all shadow-inner" />
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" className="px-6 py-3 border border-border rounded-xl text-muted font-bold hover:bg-white/5 transition-colors" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-white text-black hover:bg-gray-200 disabled:opacity-70" disabled={submitting}>
                {submitting ? <span className="w-4 h-4 border-2 border-[currentColor]/30 border-t-[currentColor] rounded-full animate-spin" /> : null}
                Save Limit
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-stagger-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="panel p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="skeleton h-5 w-28" />
                  <div className="skeleton h-4 w-20" />
                </div>
                <div className="skeleton h-7 w-20" />
              </div>
              <div className="skeleton h-2 w-full" />
              <div className="flex justify-between">
                <div className="skeleton h-3 w-16" />
                <div className="skeleton h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="panel p-16 flex flex-col items-center justify-center text-center animate-stagger-3 border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-muted"><PieChart size={32} /></div>
          <p className="text-foreground font-display font-bold text-xl mb-2">No budgets set</p>
          <p className="text-muted text-sm max-w-xs">Define a limit for a category to get alerts before you overspend.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-stagger-3">
          {budgets.map(b => {
            const pct = b.limit > 0 ? Math.min((b.spent / b.limit) * 100, 100) : 0
            const safe   = pct < 80
            const warn   = pct >= 80 && pct < 100
            const danger = pct >= 100

            let borderColor = 'group-hover:border-success/30'
            let barColor    = 'bg-success'
            let statusText  = 'On Track'
            let Icon        = CheckCircle2
            let iconClass   = 'text-success bg-success/10 border-success/20'

            if (warn)   { borderColor = 'border-warning/30'; barColor = 'bg-warning'; statusText = 'Near Limit'; Icon = AlertTriangle; iconClass = 'text-warning bg-warning/10 border-warning/20' }
            if (danger) { borderColor = 'border-danger/30'; barColor = 'bg-danger'; statusText = 'Exceeded'; Icon = AlertTriangle; iconClass = 'text-danger bg-danger/10 border-danger/20' }

            const remaining = Math.max(b.limit - b.spent, 0)

            return (
              <div key={b._id} className={`panel p-6 relative overflow-hidden group transition-all duration-300 ${borderColor}`}>
                 {danger && <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] bg-danger/15 pointer-events-none" />}
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <h3 className="text-foreground font-display font-bold text-lg">{b.category}</h3>
                    <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full border ${iconClass}`}>
                      <Icon size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{statusText}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-display font-bold text-2xl tracking-tight leading-none">{fmt(b.spent)}</p>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1.5">of {fmt(b.limit)}</p>
                  </div>
                </div>

                <div className="w-full bg-black/40 rounded-full h-2 mb-2 flex overflow-hidden border border-white/5 relative z-10">
                  <div className={`${barColor} h-full transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
                </div>

                <div className="flex justify-between text-xs font-semibold text-muted font-medium mt-3 relative z-10">
                  <span className="text-[11px]">{pct.toFixed(0)}% Used</span>
                  <span className={danger ? 'text-danger' : 'text-foreground'}>
                    {danger ? 'Over budget!' : `${fmt(remaining)} left`}
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
