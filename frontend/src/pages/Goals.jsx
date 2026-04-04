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
    } catch (err) { toast.error('Failed to load goals') } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchGoals() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body = { name: form.name, target_amount: +form.target_amount, deadline: form.deadline ? new Date(form.deadline).toISOString() : null }
      await api.post('/goals', body)
      toast.success('Goal created!')
      setForm({ name: '', target_amount: '', deadline: '' })
      setShowForm(false)
      fetchGoals()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to create goal') } 
    finally { setSubmitting(false) }
  }

  const handleAddFunds = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post(`/goals/${fundsModal.goalId}/add-funds`, { amount: +fundsForm.amount, wallet: fundsForm.wallet })
      toast.success('Funds added successfully!')
      setFundsForm({ amount: '', wallet: 'cash' })
      setFundsModal({ show: false, goalId: null, name: '' })
      fetchGoals()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to add funds') } 
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6 lg:space-y-8 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-stagger-1">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Savings Goals</h1>
          <p className="text-muted mt-1 font-medium">Hit your targets by saving systematically</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New Goal'}
        </button>
      </div>

      {showForm && (
        <div className="panel p-6 sm:p-8 animate-stagger-2 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-info to-teal-400" />
          <h3 className="text-foreground font-display font-bold text-xl mb-6">Create a Savings Goal</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Goal Name</label>
              <input type="text" className="w-full bg-black/50 border border-white/10 rounded-[16px] px-4 py-3.5 text-white font-medium focus:outline-none focus:border-accent" placeholder="e.g. Dream Laptop" required
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Target Amount (₹)</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-lg group-focus-within:text-accent">₹</span>
                <input type="number" min="1" step="0.01" required placeholder="0.00"
                  value={form.target_amount} onChange={e => setForm({...form, target_amount: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-[16px] py-3.5 pl-9 pr-4 text-white font-display text-lg font-bold focus:outline-none focus:border-accent focus:bg-accent/5 transition-all shadow-inner" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Deadline (Optional)</label>
              <input type="date" className="w-full bg-black/50 border border-white/10 rounded-[16px] px-4 py-3.5 text-white font-medium focus:outline-none focus:border-accent flex items-center"
                value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
            </div>

            <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-2">
              <button type="button" className="px-6 py-3 border border-border rounded-xl text-muted font-bold hover:bg-white/5 transition-colors" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-white text-black hover:bg-gray-200 disabled:opacity-70" disabled={submitting}>
                {submitting ? <span className="w-4 h-4 border-2 border-[currentColor]/30 border-t-[currentColor] rounded-full animate-spin" /> : null}
                Create Target
              </button>
            </div>
          </form>
        </div>
      )}

      {fundsModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md transition-all"
             onClick={(e) => e.target === e.currentTarget && setFundsModal({ show: false, goalId: null, name: '' })}>
          <div className="w-full max-w-sm rounded-[24px] bg-surface relative overflow-hidden shadow-soft-drop border border-white/10 p-8 animate-stagger-1 text-center">
             <div className="w-16 h-16 rounded-2xl bg-info/10 border border-info/20 mx-auto flex items-center justify-center mb-6 shadow-glow-accent">
              <ArrowUpCircle size={28} className="text-info" />
            </div>
            <h3 className="text-foreground font-display font-bold text-xl mb-1">Fund Goal</h3>
            <p className="text-muted text-sm mb-6 max-w-[200px] mx-auto truncate">"{fundsModal.name}"</p>
            
            <form onSubmit={handleAddFunds} className="space-y-5 text-left">
              <div>
                <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1 text-center">Amount (₹)</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-xl group-focus-within:text-accent">₹</span>
                  <input type="number" min="1" step="0.01" required placeholder="0.00" autoFocus
                    className="w-full bg-black/50 border border-white/10 rounded-[16px] py-4 pl-10 pr-5 text-white font-display text-2xl font-bold focus:outline-none focus:border-accent focus:bg-accent/5 transition-all shadow-inner text-center"
                    value={fundsForm.amount} onChange={e => setFundsForm({...fundsForm, amount: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[ { value: 'cash', label: 'CASH' }, { value: 'upi', label: 'UPI' } ].map((w) => (
                  <button key={w.value} type="button" onClick={() => setFundsForm({ ...fundsForm, wallet: w.value })}
                    className={`py-3.5 rounded-2xl border transition-all ${fundsForm.wallet === w.value ? 'bg-accent/15 border-accent text-accent shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-black/50 border-white/10 text-muted'}`}>
                    <p className="font-bold text-sm tracking-wide">{w.label}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button type="button" className="flex-1 py-3.5 rounded-xl border border-border font-semibold text-muted hover:bg-white/5 transition-colors" onClick={() => setFundsModal({ show: false, goalId: null, name: '' })}>Cancel</button>
                 <button type="submit" disabled={submitting} className="flex-[2] py-3.5 rounded-xl font-bold bg-white text-black hover:bg-gray-200 flex justify-center items-center gap-2">
                  {submitting ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-[3px] border-accent/20 border-t-accent rounded-full animate-spin" /></div>
      ) : goals.length === 0 ? (
        <div className="panel p-16 flex flex-col items-center justify-center text-center animate-stagger-3 border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-muted"><Target size={32} /></div>
          <p className="text-foreground font-display font-bold text-xl mb-2">No goals set</p>
          <p className="text-muted text-sm max-w-[280px]">Give yourself something to dream about. Set a target and start saving systematically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-stagger-3">
          {goals.map(g => {
            const pct = g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0
            const isDone = pct >= 100

            return (
              <div key={g._id} className={`panel p-8 flex flex-col items-center relative overflow-hidden group transition-all duration-300 ${isDone ? 'border-primary-500/30' : 'hover:border-accent/30'}`}>
                {isDone && <div className="absolute top-[-20%] right-[-20%] w-[140%] h-[140%] bg-accent/20 blur-[80px] pointer-events-none" />}

                <h3 className="text-foreground font-display font-bold text-xl mb-1 relative z-10 text-center">{g.name}</h3>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted mb-8 relative z-10 text-center">
                  {g.deadline ? `By ${new Date(g.deadline).toLocaleDateString('en-IN', {month:'short', year:'numeric'})}` : 'No deadline'}
                </p>

                <div className="relative flex items-center justify-center w-40 h-40 rounded-full mb-8 shadow-xl"
                  style={{ background: `conic-gradient(${isDone ? '#8b5cf6' : '#6366f1'} ${pct}%, #27272a ${pct}%)` }}>
                  <div className="w-[140px] h-[140px] bg-surface rounded-full flex flex-col items-center justify-center z-10 border border-white/5 shadow-inner">
                    <span className="text-3xl font-display font-bold text-foreground">{pct.toFixed(0)}%</span>
                  </div>
                </div>

                <div className="w-full space-y-3 mb-8 relative z-10">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[11px] font-bold text-muted uppercase tracking-widest">Saved</span>
                    <span className="text-foreground font-display font-bold text-lg">{fmt(g.current_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-border pt-3">
                    <span className="text-[11px] font-bold text-muted uppercase tracking-widest">Target</span>
                    <span className="text-foreground font-display font-bold text-lg">{fmt(g.target_amount)}</span>
                  </div>
                  {!isDone && g.target_amount > 0 && (
                    <div className="flex justify-between items-center text-sm border-t border-border pt-3">
                      <span className="text-[11px] font-bold text-muted uppercase tracking-widest">Remaining</span>
                      <span className="text-info font-display font-bold text-lg">{fmt(g.target_amount - g.current_amount)}</span>
                    </div>
                  )}
                </div>

                {!isDone ? (
                   <button onClick={() => { setFundsModal({ show: true, goalId: g._id, name: g.name }); setFundsForm({ amount: '', wallet: 'cash' }) }}
                    className="w-full py-3.5 rounded-xl border border-border text-foreground font-bold text-sm hover:bg-white/5 transition-colors flex justify-center items-center gap-2 group-hover:border-accent/40 relative z-10 bg-surface">
                    <Plus size={16} className="text-accent" /> Add Funds
                  </button>
                ) : (
                  <div className="w-full py-3.5 rounded-xl bg-success/10 border border-success/20 text-success font-bold text-sm text-center relative z-10 shadow-glow-success">
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
