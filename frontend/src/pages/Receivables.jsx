import { useEffect, useState, useRef } from 'react'
import api from '../api/axios'
import { fmt } from '../utils/format'
import { isReceivableOverdue, isReceivableDueSoon } from '../utils/receivables'
import WalletPicker from '../components/WalletPicker'
import toast from 'react-hot-toast'
import {
  Plus, X, HandCoins, CheckCircle, Clock,
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
      toast.success('Marked as received! Money added to your wallet.')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to mark as received')
    } finally {
      setLoading(false)
      submitLock.current = false
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md transition-all"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-[32px] bg-white/[0.08] backdrop-blur-3xl relative overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.6)] border border-white/20 animate-stagger-1 text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-success/10 border border-success/20 mx-auto flex items-center justify-center mb-6 shadow-glow-success">
          <CheckCircle size={28} className="text-success" />
        </div>
        <h2 className="text-foreground font-display font-bold text-xl mb-2">Mark as Received</h2>
        <p className="text-muted text-sm mb-6">Where did you receive the <strong>{fmt(record.amount)}</strong> from {record.person_name}?</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {[ { value: 'cash', label: 'CASH' }, { value: 'upi', label: 'UPI' } ].map((w) => (
              <button key={w.value} type="button" onClick={() => setWallet(w.value)}
                className={`py-4 rounded-2xl border transition-all ${
                  wallet === w.value ? 'bg-success/15 border-success text-success shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-black/50 border-white/10 text-muted'
                }`}>
                <p className="font-bold">{w.label}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-border font-semibold text-muted hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-[2] py-3.5 rounded-xl font-bold bg-gradient-success text-white flex justify-center items-center gap-2">
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm'}
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
    if (!window.confirm("Remove this entry? (Won't affect wallet balance)")) return
    try {
      await api.delete(`/debts/${id}`)
      toast.success('Record deleted')
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
        toast.success('Updated!')
      } else {
        const amount = parseFloat(form.amount)
        if (!amount || amount <= 0) return toast.error('Enter valid amount')
        await api.post('/lend', {
          person_name: form.person_name, amount, wallet: form.wallet,
          notes: form.notes || '', return_date: form.return_date || null, no_debit: form.no_debit,
        })
        toast.success(`₹${amount.toLocaleString('en-IN')} recorded!`)
      }
      setForm({ person_name: '', amount: '', wallet: 'cash', notes: '', return_date: '', no_debit: false })
      setShowForm(false)
      setEditingId(null)
      fetchRecords()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to save') } 
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
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Receivables</h1>
          <p className="text-muted mt-1 font-medium">Track money owed to you</p>
        </div>
        <button onClick={() => {
            if (showForm) { setShowForm(false); setEditingId(null); setForm({ person_name: '', amount: '', wallet: 'cash', notes: '', return_date: '', no_debit: false }) }
            else { setShowForm(true) }
          }} className="btn-primary">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New Lent Record'}
        </button>
      </div>

      <div className="panel p-8 lg:p-10 flex flex-wrap items-center justify-between gap-6 relative overflow-hidden animate-stagger-2 border-warning/30 group">
        <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[150%] bg-warning/10 blur-[100px] pointer-events-none group-hover:bg-warning/20 transition-all duration-700" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-warning to-orange-400" />
        
        <div className="relative z-10 flex items-center gap-5">
           <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center border border-warning/20 shadow-glow-accent shadow-warning/20">
            <ArrowDownLeft size={28} className="text-warning" />
          </div>
          <div>
            <p className="text-xs font-bold text-warning uppercase tracking-widest mb-1.5">You will receive</p>
            <p className="text-4xl lg:text-5xl font-display font-bold text-foreground tracking-tight">{fmt(pendingTotal)}</p>
          </div>
        </div>
        
        <div className="relative z-10 flex gap-6 lg:gap-10">
          <div>
            <p className="text-2xl font-display font-bold text-foreground">{pending.length}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted font-bold mt-1">Outstanding</p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-success">{returned.length}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted font-bold mt-1">Received</p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-danger">{overdueCount + dueSoonCount}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted font-bold mt-1">Due Soon</p>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="panel p-6 sm:p-8 animate-stagger-2">
          <h3 className="text-foreground font-display font-bold text-xl mb-6">{editingId ? 'Edit Record' : 'Record money lent'}</h3>
          <form onSubmit={handleRecordLentMoney} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Person's name</label>
              <input type="text" className="w-full bg-black/50 border border-white/10 rounded-[16px] px-4 py-3.5 text-white font-medium focus:outline-none focus:border-accent"
                placeholder="Who?" required value={form.person_name} onChange={(e) => setForm({ ...form, person_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Amount (₹)</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-lg group-focus-within:text-accent">₹</span>
                <input type="number" min="1" step="0.01" required placeholder="0.00"
                  className="w-full bg-black/50 border border-white/10 rounded-[16px] py-3.5 pl-9 pr-4 text-white font-display text-lg font-bold focus:outline-none focus:border-accent focus:bg-accent/5 transition-all shadow-inner"
                  value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Wallet Used</label>
              <div className="flex gap-2">
                 <button type="button" onClick={() => setForm({...form, wallet: 'cash'})}
                  className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border transition-all ${form.wallet === 'cash' ? 'bg-accent/15 border-accent text-accent shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-black/50 border-white/10 text-muted'}`}>
                  CASH
                </button>
                <button type="button" onClick={() => setForm({...form, wallet: 'upi'})}
                  className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border transition-all ${form.wallet === 'upi' ? 'bg-accent/15 border-accent text-accent shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-black/50 border-white/10 text-muted'}`}>
                  UPI
                </button>
              </div>
               <label className="flex items-center gap-3 mt-4 cursor-pointer w-fit pl-1 group">
                  <div className="relative">
                    <input type="checkbox" className="w-5 h-5 opacity-0 absolute cursor-pointer z-10" checked={form.no_debit} onChange={(e) => setForm({ ...form, no_debit: e.target.checked })} />
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${form.no_debit ? 'bg-accent border-accent text-white' : 'bg-black/50 border-white/20 group-hover:border-white/40'}`}>
                      {form.no_debit && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-muted group-hover:text-foreground transition-colors">Already paid out (Don't deduct from wallet)</span>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Return date</label>
              <input type="date" className="w-full bg-black/50 border border-white/10 rounded-[16px] px-4 py-3.5 text-white font-medium focus:outline-none focus:border-accent"
                min={new Date().toISOString().split('T')[0]} value={form.return_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })} />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Notes (optional)</label>
              <input type="text" className="w-full bg-black/50 border border-white/10 rounded-[16px] px-4 py-3.5 text-white font-medium focus:outline-none focus:border-accent"
                placeholder="Context..." maxLength={80} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-4">
              <button type="button" className="px-6 py-3 rounded-xl border border-border text-muted font-semibold hover:bg-white/5 transition-colors" onClick={() => {
                setShowForm(false); setEditingId(null); setForm({ person_name: '', amount: '', wallet: 'cash', notes: '', return_date: '', no_debit: false })
              }}>Cancel</button>
              <button type="submit" disabled={submitting} className={`px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-black bg-white hover:bg-gray-200 disabled:opacity-70`}>
                {submitting ? <span className="w-4 h-4 border-2 border-[currentColor]/30 border-t-[currentColor] rounded-full animate-spin" /> : null}
                {editingId ? 'Update Record' : 'Save Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Pills */}
      <div className="flex gap-2 p-1.5 bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl w-fit animate-stagger-2 shadow-inner">
        {[ { value: '', label: 'All' }, { value: 'pending', label: 'Outstanding' }, { value: 'returned', label: 'Received' } ].map((f) => (
          <button key={f.value} onClick={() => setFilterStatus(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterStatus === f.value ? 'bg-white/10 text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}>
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
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4"><HandCoins size={28} className="text-muted" /></div>
          <p className="text-foreground font-display font-bold text-xl mb-2">Nothing tracked yet</p>
          <p className="text-muted text-sm max-w-xs">Use "New Lent Record" to keep track of money you give to friends or services.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-stagger-3">
          {records.map((row) => {
            const overdue = isReceivableOverdue(row); const dueSoon = isReceivableDueSoon(row)
            return (
              <div key={row._id} className={`panel flex flex-col relative transition-all ${row.status === 'returned' ? 'border-success/20 bg-success/5' : overdue ? 'border-danger/30 bg-danger/5' : dueSoon ? 'border-warning/30 bg-warning/5' : 'hover:border-accent/40'}`}>
                <div className="p-6 pb-5 flex-1">
                  {row.status === 'pending' && overdue && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-danger bg-danger/10 px-2.5 py-1 rounded-full border border-danger/20 uppercase tracking-widest"><AlertTriangle size={12} /> Overdue</div>
                  )}
                  {row.status === 'pending' && dueSoon && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-warning bg-warning/10 px-2.5 py-1 rounded-full border border-warning/20 uppercase tracking-widest"><Clock size={12} /> Due soon</div>
                  )}
                  {row.status === 'returned' && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-2.5 py-1 rounded-full border border-success/20 uppercase tracking-widest"><CheckCircle size={12} /> Received</div>
                  )}

                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-foreground font-display font-bold text-lg shadow-inner">
                      {row.person_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-foreground font-semibold text-lg">{row.person_name}</p>
                      <p className="text-muted text-xs font-medium mt-0.5">from {row.wallet === 'cash' ? 'Cash Wallet' : 'UPI Wallet'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-4xl font-display font-bold text-foreground tracking-tight mb-2">{fmt(row.amount)}</p>
                    {row.notes && <p className="text-muted text-sm line-clamp-2">{row.notes}</p>}
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold mt-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted uppercase tracking-widest text-[10px]">Given</span>
                      <span className="text-foreground">{row.given_date ? new Date(row.given_date).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'2-digit'}) : '—'}</span>
                    </div>
                    {row.return_date && (
                      <div className="flex flex-col gap-1 items-end">
                        <span className="text-muted uppercase tracking-widest text-[10px]">Due</span>
                        <span className={overdue ? 'text-danger' : dueSoon ? 'text-warning' : 'text-foreground'}>{new Date(row.return_date).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'2-digit'})}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-white/5 backdrop-blur-md border-t border-white/10 flex gap-2 rounded-b-[24px]">
                  <div className="flex-1">
                    {row.status === 'pending' ? (
                      <button onClick={() => setReceiving(row)} className="w-full py-2.5 rounded-xl font-bold text-sm text-success bg-success/10 hover:bg-success/20 transition-colors flex items-center justify-center gap-2">
                        <CheckCircle size={16} /> Mark Received
                      </button>
                    ) : (
                      <div className="w-full py-2.5 rounded-xl font-bold text-sm text-success/60 bg-success/5 border border-success/10 flex items-center justify-center gap-2">
                        <CheckCircle size={16} /> Received {row.returned_date && <span className="font-medium text-xs ml-1 opacity-70">({new Date(row.returned_date).toLocaleDateString('en-IN', {day:'2-digit',month:'short'})})</span>}
                      </div>
                    )}
                  </div>
                  {row.status === 'pending' && (
                    <button onClick={() => handleEdit(row)} title="Edit" className="px-4 bg-white/5 hover:bg-accent/10 hover:text-accent text-muted rounded-xl transition-colors">
                      <Edit2 size={16} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(row._id)} title="Delete" className="px-4 bg-white/5 hover:bg-danger/10 hover:text-danger text-muted rounded-xl transition-colors">
                    <Trash2 size={16} />
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
