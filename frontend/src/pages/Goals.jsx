import { useEffect, useState } from 'react'
import api from '../api/axios'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import { Target, Plus, X, ArrowUpCircle } from 'lucide-react'

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [fundsModal, setFundsModal] = useState({ show: false, goalId: null, name: '' })

  const [form, setForm] = useState({ name: '', target_amount: '', deadline: '' })
  const [fundsForm, setFundsForm] = useState({ amount: '', wallet: 'cash' })
  const [submitting, setSubmitting] = useState(false)

  const fetchGoals = async () => {
    setLoading(true)
    try {
      const res = await api.get('/goals')
      setGoals(res.data.goals)
    } catch (err) {
      toast.error('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGoals() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body = {
        name: form.name,
        target_amount: +form.target_amount,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null
      }
      await api.post('/goals', body)
      toast.success('Goal created!')
      setForm({ name: '', target_amount: '', deadline: '' })
      setShowForm(false)
      fetchGoals()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create goal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddFunds = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post(`/goals/${fundsModal.goalId}/add-funds`, {
        amount: +fundsForm.amount,
        wallet: fundsForm.wallet
      })
      toast.success('Funds added successfully!')
      setFundsForm({ amount: '', wallet: 'cash' })
      setFundsModal({ show: false, goalId: null, name: '' })
      fetchGoals()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add funds')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Savings Goals</h1>
          <p className="section-sub">Hit your targets by saving systematically</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New Goal'}
        </button>
      </div>

      {/* Create Goal Form */}
      {showForm && (
        <div className="card animate-slide-up bg-surface-light border border-white/10 p-6 rounded-2xl">
          <h3 className="text-white font-semibold mb-4 text-lg">Create a Savings Goal</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Goal Name</label>
              <input type="text" className="input" placeholder="e.g. New Laptop" required
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="label">Target Amount (₹)</label>
              <input type="number" className="input" placeholder="0.00" min="1" step="0.01" required
                value={form.target_amount} onChange={e => setForm({...form, target_amount: e.target.value})} />
            </div>
            <div>
              <label className="label">Deadline (Optional)</label>
              <input type="date" className="input"
                value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3 mt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary flex items-center gap-2" disabled={submitting}>
                {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Create Target
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Funds Modal */}
      {fundsModal.show && (
        <div className="card animate-slide-up bg-primary-900/40 border border-primary-500/30 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
              <ArrowUpCircle className="text-primary-400" /> Fund "{fundsModal.name}"
            </h3>
            <button onClick={() => setFundsModal({ show: false, goalId: null, name: '' })} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleAddFunds} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Amount to Add (₹)</label>
              <input type="number" className="input" placeholder="0.00" min="1" step="0.01" required
                value={fundsForm.amount} onChange={e => setFundsForm({...fundsForm, amount: e.target.value})} />
            </div>
            <div>
              <label className="label">From Wallet</label>
              <select className="input" value={fundsForm.wallet} onChange={e => setFundsForm({...fundsForm, wallet: e.target.value})}>
                <option value="cash">💵 Cash</option>
                <option value="upi">📱 UPI</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" className="btn-secondary" onClick={() => setFundsModal({ show: false, goalId: null, name: '' })}>Cancel</button>
              <button type="submit" className="btn-primary w-full sm:w-auto flex justify-center items-center gap-2" disabled={submitting}>
                {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Transfer Funds
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : goals.length === 0 ? (
        <div className="card text-center py-16 text-gray-500 bg-surface-light border border-white/5 rounded-2xl">
          <Target size={40} className="mx-auto mb-3 opacity-30" />
          No goals set. Give yourself something to dream about!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {goals.map(g => {
            const pct = g.target_amount > 0
              ? Math.min((g.current_amount / g.target_amount) * 100, 100)
              : 0
            const isDone = pct >= 100

            return (
              <div key={g._id} className={`card bg-surface-light border p-6 rounded-2xl flex flex-col items-center relative overflow-hidden group
                ${isDone ? 'border-primary-500/30' : 'border-white/5'}`}>

                {isDone && (
                  <div className="absolute top-0 right-0 w-full h-32 blur-[80px] -z-10 bg-primary-500/20"></div>
                )}

                <h3 className="text-white font-semibold text-lg mb-1">{g.name}</h3>
                <p className="text-gray-400 text-sm mb-6">
                  {g.deadline
                    ? `Target by: ${new Date(g.deadline).toLocaleDateString('en-IN', {month:'short', year:'numeric'})}`
                    : 'No deadline set'}
                </p>

                {/* Circular Progress Ring */}
                <div className="relative flex items-center justify-center w-36 h-36 rounded-full mb-6 shadow-xl"
                  style={{ background: `conic-gradient(${isDone ? '#8b5cf6' : '#10b981'} ${pct}%, #27272a ${pct}%)` }}>
                  <div className="w-[124px] h-[124px] bg-surface-dark rounded-full flex flex-col items-center justify-center z-10 border border-white/5">
                    <span className="text-2xl font-bold text-white">{pct.toFixed(0)}%</span>
                  </div>
                </div>

                <div className="w-full space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Saved:</span>
                    <span className="text-white font-medium">{fmt(g.current_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Target:</span>
                    <span className="text-white font-medium">{fmt(g.target_amount)}</span>
                  </div>
                  {!isDone && g.target_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Remaining:</span>
                      <span className="text-primary-300 font-medium">{fmt(g.target_amount - g.current_amount)}</span>
                    </div>
                  )}
                </div>

                {!isDone && (
                  <button
                    onClick={() => {
                      setFundsModal({ show: true, goalId: g._id, name: g.name })
                      setFundsForm({ amount: '', wallet: 'cash' })
                    }}
                    className="w-full py-2.5 rounded-xl border border-white/10 text-white font-medium text-sm
                    hover:bg-white/5 transition-colors flex justify-center items-center gap-2">
                    <Plus size={16} className="text-primary-400" /> Add Funds
                  </button>
                )}

                {isDone && (
                  <div className="w-full py-2.5 rounded-xl bg-primary-500/20 border border-primary-500/30 text-primary-300 font-bold text-sm text-center">
                    Goal Reached! 🎉
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
