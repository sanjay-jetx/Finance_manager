import { useEffect, useState, useRef } from 'react'
import api from '../api/axios'
import { fmt } from '../utils/format'
import { isReceivableOverdue, isReceivableDueSoon } from '../utils/receivables'
import toast from 'react-hot-toast'
import {
  Plus, X, HandCoins, CheckSquare, Clock,
  AlertTriangle, ArrowDownLeft, Trash2, Edit2, Check
} from 'lucide-react'

function ReceiveMoneyModal({ record, onClose, onSuccess }) {
  const [wallet, setWallet] = useState('cash')
  const [loading, setLoading] = useState(false)
  const submitLock = useRef(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitLock.current || loading) return
    submitLock.current = true
    setLoading(true)
    try {
      await api.patch(`/return/${record._id}`, { wallet })
      toast.success('Funds synchronized to wallet.')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Synchronization failure')
    } finally {
      setLoading(false)
      submitLock.current = false
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md transition-all"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded bg-[#0B0C10] relative overflow-hidden shadow-2xl border border-white/5 outline outline-1 outline-white/[0.02] animate-stagger-1 text-center p-8">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-accent/80" />

        <div className="w-14 h-14 rounded border border-accent/20 bg-accent/5 mx-auto flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,255,163,0.1)]">
          <CheckSquare size={24} className="text-accent" />
        </div>
        <h2 className="text-foreground font-display font-bold text-xl uppercase tracking-widest mb-2">Acknowledge Receipt</h2>
        <p className="text-muted text-[13px] font-mono mb-6">Allocate <strong>{fmt(record.amount)}</strong> from {record.person_name} to node:</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {[ { value: 'cash', label: 'RESERVES: CASH' }, { value: 'upi', label: 'NETWORK: UPI' } ].map((w) => (
              <button key={w.value} type="button" onClick={() => setWallet(w.value)}
                className={`py-4 rounded border transition-all text-[11px] font-bold tracking-widest uppercase font-display ${
                  wallet === w.value ? 'bg-accent/10 border-accent/40 text-accent shadow-inner' : 'bg-[#15161A] border-white/5 text-muted'
                }`}>
                {w.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded text-[11px] border border-white/5 text-muted font-display uppercase tracking-widest font-bold hover:bg-white/5 transition-colors">Abort</button>
            <button type="submit" disabled={loading} className="flex-[2] py-3 rounded font-bold font-display uppercase tracking-widest text-[11px] bg-accent text-black flex justify-center items-center gap-2 hover:bg-accent/90 disabled:opacity-70">
              {loading ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : 'Confirm Allocation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Receivables() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [receiving, setReceiving] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    person_name: '', amount: '', wallet: 'cash', notes: '', return_date: '', no_debit: false,
  })

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      const res = await api.get('/debts', { params })
      const raw = res.data?.receivables ?? res.data?.debts
      setRecords(Array.isArray(raw) ? raw : [])
    } catch (err) { toast.error('Failed to load records') } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchRecords() }, [filterStatus])

  const handleEdit = (row) => {
    setForm({
      person_name: row.person_name || '', amount: row.amount || '', wallet: row.wallet || 'cash',
      notes: row.notes || '', return_date: row.return_date ? row.return_date.substring(0, 10) : '', no_debit: !!row.no_debit,
    })
    setEditingId(row._id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Purge this entity mapping? (Node integrity preserved)")) return
    try {
      await api.delete(`/debts/${id}`)
      toast.success('Record purged')
      fetchRecords()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const handleRecordLentMoney = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingId) {
        await api.put(`/debts/${editingId}`, {
          person_name: form.person_name, amount: parseFloat(form.amount) || undefined,
          wallet: form.wallet, notes: form.notes || '', return_date: form.return_date || null, no_debit: form.no_debit,
        })
        toast.success('Vector parameters updated')
      } else {
        const amount = parseFloat(form.amount)
        if (!amount || amount <= 0) return toast.error('Enter valid quantum')
        await api.post('/lend', {
          person_name: form.person_name, amount, wallet: form.wallet,
          notes: form.notes || '', return_date: form.return_date || null, no_debit: form.no_debit,
        })
        toast.success(`₹${amount.toLocaleString('en-IN')} mapped to outward vector.`)
      }
      setForm({ person_name: '', amount: '', wallet: 'cash', notes: '', return_date: '', no_debit: false })
      setShowForm(false)
      setEditingId(null)
      fetchRecords()
    } catch (err) { toast.error(err.response?.data?.detail || 'Creation Failed') } 
    finally { setSubmitting(false) }
  }

  const pending = records.filter((r) => r.status === 'pending')
  const returned = records.filter((r) => r.status === 'returned')
  const pendingTotal = pending.reduce((s, r) => s + (parseFloat(r?.amount) || 0), 0)
  const overdueCount = pending.filter(isReceivableOverdue).length
  const dueSoonCount = pending.filter(isReceivableDueSoon).length

  return (
    <div className="space-y-6 lg:space-y-8 pb-20">
      {receiving && <ReceiveMoneyModal record={receiving} onClose={() => setReceiving(null)} onSuccess={fetchRecords} />}

      <div className="flex flex-wrap items-center justify-between gap-4 animate-stagger-1">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-widest uppercase text-foreground">Receivables</h1>
          <p className="obsidian-label mt-2">OUTWARD VECTOR TRACKING</p>
        </div>
        <button onClick={() => {
            if (showForm) { setShowForm(false); setEditingId(null); setForm({ person_name: '', amount: '', wallet: 'cash', notes: '', return_date: '', no_debit: false }) }
            else { setShowForm(true) }
          }} className="panel px-4 py-3 bg-surface hover:bg-white/5 border border-white/[0.05] text-muted hover:text-white transition-colors flex items-center gap-3 font-display uppercase tracking-widest font-bold text-[10px]">
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Abort' : 'Establish Vector'}
        </button>
      </div>

      <div className="panel p-8 lg:p-10 flex flex-wrap items-stretch lg:items-center justify-between gap-6 relative animate-stagger-2 border-warning/10 overflow-hidden">
        
        <div className="absolute left-0 top-0 w-1 h-full bg-warning/50" />
        
        <div className="relative z-10 flex items-center gap-5">
           <div className="w-14 h-14 rounded border border-warning/10 bg-warning/5 flex items-center justify-center">
            <ArrowDownLeft size={24} className="text-warning" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-warning uppercase tracking-[0.2em] font-display mb-1.5 drop-shadow">Expected Capital Array</p>
            <p className="text-4xl lg:text-5xl font-mono font-bold text-foreground tracking-tight">{fmt(pendingTotal)}</p>
          </div>
        </div>
        
        <div className="relative z-10 flex flex-wrap gap-8 lg:gap-12 pl-6 lg:border-l lg:border-white/5 pb-2">
          <div>
            <p className="text-2xl font-mono font-bold text-foreground">{pending.length}</p>
            <p className="text-[9px] uppercase tracking-[0.2em] font-display text-muted font-bold mt-1">Outstanding</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-bold text-accent">{returned.length}</p>
            <p className="text-[9px] uppercase tracking-[0.2em] font-display text-muted font-bold mt-1">Acquired</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-bold text-danger">{overdueCount + dueSoonCount}</p>
            <p className="text-[9px] uppercase tracking-[0.2em] font-display text-muted font-bold mt-1">Critical Timeframe</p>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="panel p-6 sm:p-8 animate-stagger-2 bg-[#0B0C10]">
          <h3 className="obsidian-label text-muted mb-6">{editingId ? 'RECONFIGURE VECTOR PARAMETERS' : 'INITIALIZE CAPITAL DEPARTURE'}</h3>
          <form onSubmit={handleRecordLentMoney} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Entity Identifier</label>
              <input type="text" className="w-full bg-[#15161A] border border-white/5 rounded py-4 px-5 text-white font-mono text-[14px] focus:outline-none focus:border-accent transition-all shadow-inner"
                placeholder="Who?" required value={form.person_name} onChange={(e) => setForm({ ...form, person_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Quantum (₹)</label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-xl group-focus-within:text-white">₹</span>
                <input type="number" min="1" step="0.01" required placeholder="0.00"
                  className="w-full bg-[#15161A] border border-white/5 rounded py-4 pl-12 pr-5 text-white font-mono text-xl font-bold focus:outline-none focus:border-accent transition-all shadow-inner"
                  value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Origin Node</label>
              <div className="flex gap-3">
                 <button type="button" onClick={() => setForm({...form, wallet: 'cash'})}
                  className={`flex-1 py-4 rounded border transition-all text-[11px] font-bold tracking-widest uppercase font-display ${form.wallet === 'cash' ? 'bg-accent/10 border-accent/40 text-accent shadow-inner' : 'bg-[#15161A] border-white/5 text-muted hover:border-white/10'}`}>
                  RESERVES: CASH
                </button>
                <button type="button" onClick={() => setForm({...form, wallet: 'upi'})}
                  className={`flex-1 py-4 rounded border transition-all text-[11px] font-bold tracking-widest uppercase font-display ${form.wallet === 'upi' ? 'bg-accent/10 border-accent/40 text-accent shadow-inner' : 'bg-[#15161A] border-white/5 text-muted hover:border-white/10'}`}>
                  NETWORK: UPI
                </button>
              </div>
               <label className="flex items-center gap-3 mt-5 cursor-pointer w-fit group">
                  <div className="relative">
                    <input type="checkbox" className="w-[18px] h-[18px] opacity-0 absolute cursor-pointer z-10" checked={form.no_debit} onChange={(e) => setForm({ ...form, no_debit: e.target.checked })} />
                    <div className={`w-[18px] h-[18px] rounded-[2px] border flex items-center justify-center transition-colors ${form.no_debit ? 'bg-accent border-accent text-black' : 'bg-[#15161A] border-white/10 group-hover:border-white/30 text-transparent'}`}>
                      <Check size={12} strokeWidth={3} className="currentColor" />
                    </div>
                  </div>
                  <span className="text-[10px] font-display tracking-widest font-bold text-muted uppercase group-hover:text-foreground transition-colors">By-pass deductor (External outflow)</span>
              </label>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Convergence Horizon</label>
              <input type="date" className="w-full bg-[#15161A] border border-white/5 rounded py-4 px-5 text-white font-mono text-[14px] focus:outline-none focus:border-accent transition-all shadow-inner"
                min={new Date().toISOString().split('T')[0]} value={form.return_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })} />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Payload Notes</label>
              <input type="text" className="w-full bg-[#15161A] border border-white/5 rounded py-4 px-5 text-white font-mono text-[14px] focus:outline-none focus:border-accent transition-all shadow-inner"
                placeholder="Context..." maxLength={80} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" className="px-8 py-3 rounded text-[11px] border border-white/5 text-muted font-display uppercase tracking-widest font-bold hover:bg-white/5 transition-colors" onClick={() => {
                setShowForm(false); setEditingId(null); setForm({ person_name: '', amount: '', wallet: 'cash', notes: '', return_date: '', no_debit: false })
              }}>Abort</button>
              <button type="submit" disabled={submitting} className="btn-primary flex items-center justify-center gap-2 bg-surface text-foreground shadow-none border border-white/10 hover:border-accent/50 hover:bg-white/5 disabled:opacity-70">
                {submitting ? <span className="w-4 h-4 border-2 border-[currentColor]/30 border-t-[currentColor] rounded-full animate-spin" /> : null}
                {editingId ? 'Modify Parameters' : 'Deploy Vector'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Pills */}
      <div className="flex p-1 bg-[#101115] border border-white/5 rounded w-fit animate-stagger-2 mb-2">
        {[ { value: '', label: 'Matrix View' }, { value: 'pending', label: 'Incomplete' }, { value: 'returned', label: 'Resolved' } ].map((f) => (
          <button key={f.value} onClick={() => setFilterStatus(f.value)}
            className={`px-4 py-2 rounded text-[10px] font-bold tracking-[0.2em] uppercase font-display transition-all ${filterStatus === f.value ? 'bg-[#1A1C21] text-accent border border-white/5 shadow-inner' : 'text-muted hover:text-white border border-transparent'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center flex-col items-center py-20 gap-4">
          <div className="w-10 h-10 border-[3px] border-accent/20 border-t-accent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="panel p-16 flex flex-col items-center text-center animate-stagger-3 border-dashed">
          <div className="w-12 h-12 rounded border border-white/5 bg-[#0C0D10] flex items-center justify-center mb-6"><HandCoins size={20} className="text-muted" /></div>
          <p className="text-foreground font-display font-bold text-xl uppercase tracking-widest mb-3">No Active Vectors</p>
          <p className="text-muted text-[13px] font-mono max-w-xs">Initialize an outward flow to start tracking external ledger anomalies.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-stagger-3">
          {records.map((row) => {
            const overdue = isReceivableOverdue(row); const dueSoon = isReceivableDueSoon(row)
            return (
              <div key={row._id} className={`panel flex flex-col relative transition-all border ${row.status === 'returned' ? 'border-accent/20 bg-accent/[0.02]' : overdue ? 'border-danger/30 bg-danger/[0.02]' : dueSoon ? 'border-warning/30 bg-warning/[0.02]' : 'hover:border-white/10 border-white/[0.05]'}`}>
                
                <div className="p-6 pb-5 flex-1 relative">
                  {row.status === 'pending' && overdue && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-danger text-black text-[9px] font-bold uppercase tracking-[0.2em] font-display rounded-bl"><AlertTriangle size={10} className="inline mr-1" /> Overdue</div>
                  )}
                  {row.status === 'pending' && dueSoon && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-warning text-black text-[9px] font-bold uppercase tracking-[0.2em] font-display rounded-bl"><Clock size={10} className="inline mr-1" /> Imminent</div>
                  )}
                  {row.status === 'returned' && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-accent border border-accent/20 text-black text-[9px] font-bold uppercase tracking-[0.2em] font-display rounded-bl"><CheckSquare size={10} className="inline mr-1" /> Acquired</div>
                  )}

                  <div className="flex items-center gap-4 mb-6 mt-2">
                    <div className="w-10 h-10 rounded border border-white/5 bg-[#0C0D10] flex items-center justify-center text-foreground font-display font-bold text-lg">
                      {row.person_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-foreground font-mono font-bold text-sm tracking-wide">{row.person_name}</p>
                      <p className="text-muted text-[10px] font-bold tracking-widest uppercase font-display mt-1 opacity-60">Source: {row.wallet === 'cash' ? 'Cash' : 'UPI'}</p>
                    </div>
                  </div>

                  <div>
                    <p className={`text-3xl font-mono font-bold tracking-tight mb-2 ${row.status === 'returned' ? 'text-accent' : overdue ? 'text-danger' : 'text-foreground'}`}>{fmt(row.amount)}</p>
                    {row.notes && <p className="text-muted text-[12px] font-mono leading-relaxed truncate opacity-70 border-l-2 border-white/10 pl-3 py-1">{row.notes}</p>}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold uppercase font-display tracking-widest mt-8 border-t border-white/[0.02] pt-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-muted/50">Origin Date</span>
                      <span className="text-muted">{row.given_date ? new Date(row.given_date).toLocaleDateString('en-US', {day:'2-digit',month:'short',year:'2-digit'}) : '—'}</span>
                    </div>
                    {row.return_date && (
                      <div className="flex flex-col gap-1.5 items-end">
                        <span className="text-muted/50">Horizon</span>
                        <span className={overdue ? 'text-danger' : dueSoon ? 'text-warning' : 'text-foreground'}>{new Date(row.return_date).toLocaleDateString('en-US', {day:'2-digit',month:'short',year:'2-digit'})}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-[#0C0D10] border-t border-white/[0.02] flex gap-2">
                  <div className="flex-1">
                    {row.status === 'pending' ? (
                      <button onClick={() => setReceiving(row)} className="w-full py-2.5 rounded text-[10px] tracking-[0.2em] font-display uppercase font-bold text-accent bg-accent/5 hover:bg-accent/10 border border-transparent hover:border-accent/20 transition-colors flex items-center justify-center gap-2">
                        <CheckSquare size={12} /> Register Return
                      </button>
                    ) : (
                      <div className="w-full py-2.5 rounded text-[10px] tracking-[0.2em] font-display uppercase font-bold text-accent/50 bg-[#12131A] border border-white/5 flex items-center justify-center gap-2">
                        <CheckSquare size={12} /> Settled {row.returned_date && <span className="font-mono text-[9px] opacity-70 tracking-normal ml-1 border-l border-white/10 pl-2">({new Date(row.returned_date).toLocaleDateString('en-US', {day:'2-digit',month:'short'})})</span>}
                      </div>
                    )}
                  </div>
                  {row.status === 'pending' && (
                    <button onClick={() => handleEdit(row)} title="Edit Parameter" className="px-4 bg-[#15161A] hover:bg-white/5 border border-white/5 text-muted hover:text-white rounded transition-colors flex items-center justify-center">
                      <Edit2 size={12} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(row._id)} title="Purge Record" className="px-4 bg-[#15161A] hover:bg-danger/10 border border-white/5 hover:border-danger/20 text-muted hover:text-danger rounded transition-colors flex items-center justify-center">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
