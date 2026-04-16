import { useEffect, useState } from 'react'
import api from '../api/axios'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import { Target, Plus, X, ArrowUpRight, CheckSquare } from 'lucide-react'

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
      toast.success('Vector established.')
      setForm({ name: '', target_amount: '', deadline: '' })
      setShowForm(false)
      fetchGoals()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to establish vector') } 
    finally { setSubmitting(false) }
  }

  const handleAddFunds = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post(`/goals/${fundsModal.goalId}/add-funds`, { amount: +fundsForm.amount, wallet: fundsForm.wallet })
      toast.success('Funds injected into target.')
      setFundsForm({ amount: '', wallet: 'cash' })
      setFundsModal({ show: false, goalId: null, name: '' })
      fetchGoals()
    } catch (err) { toast.error(err.response?.data?.detail || 'Injection failure') } 
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6 lg:space-y-8 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-stagger-1">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-widest uppercase text-foreground">Capital Targets</h1>
          <p className="obsidian-label mt-2">DEDICATED ALLOCATION PATHS</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="panel px-4 py-3 bg-surface hover:bg-white/5 border border-white/[0.05] text-muted hover:text-white transition-colors flex items-center gap-3 font-display uppercase tracking-widest font-bold text-[10px]">
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Abort' : 'Initialize Target'}
        </button>
      </div>

      {showForm && (
        <div className="panel p-6 sm:p-8 animate-stagger-2 relative overflow-hidden bg-[#0B0C10] shadow-2xl border border-white/[0.04] outline outline-1 outline-white/[0.02]">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] font-display text-muted mb-6">ESTABLISH NEW ALLOCATION VECTOR</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Target Designation</label>
              <input type="text" className="w-full bg-[#15161A] border border-white/5 rounded py-4 px-5 text-white font-mono text-[14px] focus:outline-none focus:border-accent transition-all shadow-inner" placeholder="Operations Expansion" required
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Capital Requirement (₹)</label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-xl group-focus-within:text-white">₹</span>
                <input type="number" min="1" step="0.01" required placeholder="0.00"
                  value={form.target_amount} onChange={e => setForm({...form, target_amount: e.target.value})}
                  className="w-full bg-[#15161A] border border-white/5 rounded py-4 pl-12 pr-5 text-white font-mono text-xl font-bold focus:outline-none focus:border-accent transition-all shadow-inner" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Horizon Limit (Optional)</label>
              <input type="date" className="w-full bg-[#15161A] border border-white/5 rounded py-4 px-5 text-white font-mono text-[14px] focus:outline-none focus:border-accent flex items-center shadow-inner"
                value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
            </div>

            <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-2">
              <button type="button" className="px-8 py-3 rounded text-[11px] border border-white/5 text-muted font-display uppercase tracking-widest font-bold hover:bg-white/5 transition-colors" onClick={() => setShowForm(false)}>Abort</button>
              <button type="submit" className="btn-primary flex items-center justify-center gap-2 bg-surface text-foreground shadow-none border border-white/10 hover:border-accent/50 hover:bg-white/5 disabled:opacity-70" disabled={submitting}>
                {submitting ? <span className="w-4 h-4 border-2 border-[currentColor]/30 border-t-[currentColor] rounded-full animate-spin" /> : null}
                Deploy Target
              </button>
            </div>
          </form>
        </div>
      )}

      {fundsModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md transition-all"
             onClick={(e) => e.target === e.currentTarget && setFundsModal({ show: false, goalId: null, name: '' })}>
          <div className="w-full max-w-sm rounded bg-[#0B0C10] relative overflow-hidden shadow-2xl border border-white/5 outline outline-1 outline-white/[0.02] animate-stagger-1 text-center p-8">
            <div className="absolute top-0 left-0 w-full h-1 bg-accent/80" />
            <div className="w-14 h-14 rounded border border-accent/20 bg-accent/5 mx-auto flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,255,163,0.1)]">
              <ArrowUpRight size={28} className="text-accent" />
            </div>
            <h3 className="text-foreground font-display font-bold text-xl uppercase tracking-widest mb-1">Inject Liquidity</h3>
            <p className="text-muted text-[13px] font-mono mb-6 max-w-[200px] mx-auto truncate text-accent">[{fundsModal.name}]</p>
            
            <form onSubmit={handleAddFunds} className="space-y-6 text-left">
              <div>
                <label className="block text-[10px] text-center font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Injection Volume (₹)</label>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-2xl group-focus-within:text-white">₹</span>
                  <input type="number" min="1" step="0.01" required placeholder="0.00" autoFocus
                    className="w-full bg-[#15161A] border border-white/5 rounded py-5 pl-14 pr-5 text-accent font-mono text-3xl font-bold focus:outline-none focus:border-accent transition-all shadow-inner text-center tracking-tight"
                    value={fundsForm.amount} onChange={e => setFundsForm({...fundsForm, amount: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[ { value: 'cash', label: 'RESERVES: CASH' }, { value: 'upi', label: 'NETWORK: UPI' } ].map((w) => (
                  <button key={w.value} type="button" onClick={() => setFundsForm({ ...fundsForm, wallet: w.value })}
                    className={`py-4 rounded border transition-all text-[11px] font-bold tracking-widest uppercase font-display ${fundsForm.wallet === w.value ? 'bg-accent/10 border-accent/40 text-accent shadow-inner' : 'bg-[#15161A] border-white/5 text-muted hover:border-white/10'}`}>
                    {w.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button type="button" className="flex-1 py-3 rounded text-[11px] border border-white/5 text-muted font-display uppercase tracking-widest font-bold hover:bg-white/5 transition-colors" onClick={() => setFundsModal({ show: false, goalId: null, name: '' })}>Abort</button>
                 <button type="submit" disabled={submitting} className="flex-[2] py-3 rounded font-bold font-display uppercase tracking-widest text-[11px] bg-accent text-black flex justify-center items-center gap-2 hover:bg-accent/90 disabled:opacity-70">
                  {submitting ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : 'Authorize Transfer'}
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
          <div className="w-12 h-12 rounded border border-white/5 bg-[#0C0D10] flex items-center justify-center mb-6 text-muted"><Target size={20} /></div>
          <p className="text-foreground font-display font-bold text-xl uppercase tracking-widest mb-3">No Active Targets</p>
          <p className="text-muted text-[13px] font-mono max-w-xs">Establish a dedicated allocation vector to accumulate capital over time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-stagger-3">
          {goals.map(g => {
            const pct = g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0
            const isDone = pct >= 100

            return (
              <div key={g._id} className={`panel p-8 pt-10 flex flex-col items-center relative overflow-hidden transition-all duration-300 border ${isDone ? 'border-accent/40 bg-accent/[0.02]' : 'hover:border-white/20 border-white/[0.05]'}`}>
                {isDone && <div className="absolute top-0 right-0 px-3 py-1 bg-accent text-black text-[9px] font-bold uppercase tracking-[0.2em] font-display rounded-bl"><CheckSquare size={10} className="inline mr-1" /> Reached</div>}

                <h3 className="text-foreground font-display font-bold text-xl mb-1 relative z-10 text-center tracking-wide">{g.name}</h3>
                <p className="text-[9px] uppercase font-bold tracking-[0.2em] font-display text-muted mb-8 relative z-10 text-center opacity-60">
                  {g.deadline ? `Horizon: ${new Date(g.deadline).toLocaleDateString('en-US', {month:'short', year:'numeric'})}` : 'Infinite Horizon'}
                </p>

                {/* Cyberpunk Radial Progress */}
                <div className="relative flex items-center justify-center w-36 h-36 rounded-full mb-10 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                  style={{ background: `conic-gradient(${isDone ? '#00FFA3' : '#00FFA3'} ${pct}%, rgba(255,255,255,0.05) ${pct}%)` }}>
                  <div className="w-[136px] h-[136px] rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-[3px] border-[#050508] pointer-events-none" />
                  <div className="w-[124px] h-[124px] bg-[#0C0D10] rounded-full flex flex-col items-center justify-center z-10 relative shadow-inner">
                    <span className={`text-4xl font-mono font-bold tracking-tight ${isDone ? 'text-accent' : 'text-white'}`}>{pct.toFixed(0)}<span className="text-lg text-muted/50">%</span></span>
                  </div>
                </div>

                <div className="w-full relative z-10 mb-8 border border-white/[0.02] bg-[#0A0B0E] p-4 rounded">
                  <div className="flex justify-between items-center text-sm mb-3">
                    <span className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] font-display">Allocated</span>
                    <span className="text-foreground font-mono font-bold text-[15px]">{fmt(g.current_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-white/[0.05] pt-3">
                    <span className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] font-display line-through opacity-70">Requirement</span>
                    <span className="text-muted font-mono font-bold text-[15px] opacity-70">{fmt(g.target_amount)}</span>
                  </div>
                  {!isDone && g.target_amount > 0 && (
                    <div className="flex justify-between items-center text-sm border-t border-white/[0.05] pt-3 mt-3">
                      <span className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] font-display text-accent">Remaining</span>
                      <span className="text-accent font-mono font-bold text-[15px]">{fmt(g.target_amount - g.current_amount)}</span>
                    </div>
                  )}
                </div>

                {!isDone ? (
                   <button onClick={() => { setFundsModal({ show: true, goalId: g._id, name: g.name }); setFundsForm({ amount: '', wallet: 'cash' }) }}
                    className="w-full py-3.5 rounded border border-white/[0.05] text-[10px] tracking-[0.2em] uppercase font-display text-muted font-bold hover:bg-white/5 transition-colors flex justify-center items-center gap-2 hover:border-accent/30 hover:text-white relative z-10 bg-[#121318]">
                    <Plus size={14} className="text-accent" /> Inject Liquidity
                  </button>
                ) : (
                  <div className="w-full py-3.5 rounded border border-accent/20 bg-accent/5 text-[10px] tracking-[0.2em] uppercase font-display text-accent font-bold text-center relative z-10 flex items-center justify-center gap-2">
                     <CheckSquare size={14} /> Target Reached
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
