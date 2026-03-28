import { useEffect, useState } from 'react'
import api from '../api/axios'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import { PieChart, Plus, X, AlertTriangle, CheckCircle2 } from 'lucide-react'

const EXPENSE_CATEGORIES = [
  'Food & Dining','Transport','Shopping','Entertainment','Health',
  'Bills & Utilities','Education','Travel','Groceries','Other'
]

export default function Budgets() {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category: '', limit: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchBudgets = async () => {
    setLoading(true)
    try {
      const res = await api.get('/budgets')
      setBudgets(res.data.budgets)
    } catch (err) {
      toast.error('Failed to load budgets')
    } finally {
      setLoading(false)
    }
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
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save budget')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Monthly Budgets</h1>
          <p className="section-sub">Control your category spending limits</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Set Budget'}
        </button>
      </div>

      {/* Set Budget Form */}
      {showForm && (
        <div className="card animate-slide-up bg-surface-light border border-white/10 p-6 rounded-2xl">
          <h3 className="text-white font-semibold mb-4 text-lg">Set Category Limit</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" required value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Monthly Limit (₹)</label>
              <input type="number" className="input" placeholder="e.g. 5000" min="1" step="0.01" required
                value={form.limit} onChange={e => setForm({...form, limit: e.target.value})} />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary flex items-center gap-2" disabled={submitting}>
                {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Save Limit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="card text-center py-16 text-gray-500 bg-surface-light border border-white/5 rounded-2xl">
          <PieChart size={40} className="mx-auto mb-3 opacity-30" />
          No budgets set. Set limits to track your spending!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map(b => {
            const pct = b.limit > 0 ? Math.min((b.spent / b.limit) * 100, 100) : 0
            const safe   = pct < 80
            const warn   = pct >= 80 && pct < 100
            const danger = pct >= 100

            let color     = 'bg-emerald-500'
            let statusText = 'On Track'
            let Icon      = CheckCircle2
            let iconColor = 'text-emerald-400'

            if (warn)   { color = 'bg-amber-500'; statusText = 'Near Limit';  Icon = AlertTriangle; iconColor = 'text-amber-400' }
            if (danger) { color = 'bg-red-500';   statusText = 'Exceeded';    Icon = AlertTriangle; iconColor = 'text-red-400'   }

            const remaining = Math.max(b.limit - b.spent, 0)

            return (
              <div key={b._id} className="card bg-surface-light border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] -z-10 transition-opacity duration-1000 ${danger ? 'bg-red-500/20 opacity-100' : 'opacity-0'}`}></div>

                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-white font-medium text-lg">{b.category}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Icon size={14} className={iconColor} />
                      <span className={`text-xs font-semibold ${iconColor}`}>{statusText}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-lg">{fmt(b.spent)}</p>
                    <p className="text-gray-500 text-sm">of {fmt(b.limit)}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-black/40 rounded-full h-3 mb-2 flex overflow-hidden border border-white/5">
                  <div
                    className={`${color} h-3 rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-gray-400 font-medium mt-1">
                  <span>{pct.toFixed(1)}% Used</span>
                  <span className={danger ? 'text-red-400' : 'text-emerald-400'}>
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
