import { useEffect, useState, useRef } from 'react'
import api from '../api/axios'
import { fmt } from '../utils/format'
import { isReceivableOverdue, isReceivableDueSoon } from '../utils/receivables'
import WalletPicker from '../components/WalletPicker'
import toast from 'react-hot-toast'
import {
  Plus, X, HandCoins, CheckCircle, Clock,
  AlertTriangle, ArrowDownLeft,
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl animate-slide-up"
        style={{ background: 'linear-gradient(135deg,#1a1f2e 0%,#12151f 100%)' }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/20">
              <CheckCircle size={18} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Where did you receive it?</h2>
              <p className="text-gray-500 text-xs">From {record.person_name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'cash', label: '💵 Cash' },
              { value: 'upi', label: '📱 UPI' },
            ].map((w) => (
              <button
                key={w.value}
                type="button"
                onClick={() => setWallet(w.value)}
                className={`p-4 rounded-xl border text-center transition-all ${
                  wallet === w.value
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <p className="text-lg font-bold text-white mb-1">{w.label}</p>
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all
              bg-gradient-to-r from-emerald-600 to-teal-600
              hover:from-emerald-500 hover:to-teal-500
              disabled:opacity-60 disabled:cursor-not-allowed
              shadow-lg shadow-emerald-500/20 flex justify-center items-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle size={18} /> Confirm
              </>
            )}
          </button>
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

  const [form, setForm] = useState({
    person_name: '',
    amount: '',
    wallet: 'cash',
    notes: '',
    return_date: '',
  })

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      const res = await api.get('/debts', { params })
      const raw = res.data?.receivables ?? res.data?.debts
      setRecords(Array.isArray(raw) ? raw : [])
    } catch (err) {
      toast.error('Failed to load records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [filterStatus])

  const handleRecordLentMoney = async (e) => {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/lend', {
        person_name: form.person_name,
        amount,
        wallet: form.wallet,
        notes: form.notes || '',
        return_date: form.return_date || null,
      })
      toast.success(
        `₹${amount.toLocaleString('en-IN')} recorded — you'll receive it back from ${form.person_name}.`
      )
      setForm({ person_name: '', amount: '', wallet: 'cash', notes: '', return_date: '' })
      setShowForm(false)
      fetchRecords()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const pending = records.filter((r) => r.status === 'pending')
  const returned = records.filter((r) => r.status === 'returned')
  const pendingTotal = pending.reduce((s, r) => {
    const a = r?.amount
    return s + (typeof a === 'number' ? a : parseFloat(a) || 0)
  }, 0)
  const overdueCount = pending.filter(isReceivableOverdue).length
  const dueSoonCount = pending.filter(isReceivableDueSoon).length

  return (
    <div className="space-y-6 animate-slide-up">
      {receiving && (
        <ReceiveMoneyModal
          record={receiving}
          onClose={() => setReceiving(null)}
          onSuccess={fetchRecords}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="section-title">You Will Receive</h1>
          <p className="section-sub">Money you lent out — track what others still owe you</p>
        </div>
        <button
          id="record-receivable-btn"
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Record money lent'}
        </button>
      </div>

      <div
        className="rounded-2xl p-5 border border-amber-500/20 flex flex-wrap items-center justify-between gap-4"
        style={{
          background: 'linear-gradient(135deg,rgba(245,158,11,0.12) 0%,rgba(234,88,12,0.08) 100%)',
        }}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/20">
            <ArrowDownLeft size={24} className="text-amber-400" />
          </div>
          <div>
            <p className="text-amber-300/70 text-sm font-medium">Total you will receive</p>
            <p className="text-3xl font-bold text-amber-300">{fmt(pendingTotal)}</p>
          </div>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-white font-bold text-xl">{pending.length}</p>
            <p className="text-gray-500 text-xs">Outstanding</p>
          </div>
          <div>
            <p className="text-emerald-400 font-bold text-xl">{returned.length}</p>
            <p className="text-gray-500 text-xs">Received back</p>
          </div>
          <div>
            <p className="text-red-400 font-bold text-xl">{overdueCount + dueSoonCount}</p>
            <p className="text-gray-500 text-xs">Due soon / overdue</p>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card animate-slide-up">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <HandCoins size={18} className="text-primary-400" />
            New entry — money you lent
          </h3>
          <form onSubmit={handleRecordLentMoney} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Person&apos;s name *</label>
              <input
                id="receivable-person-name"
                type="text"
                className="input"
                placeholder="Who owes you?"
                required
                value={form.person_name}
                onChange={(e) => setForm({ ...form, person_name: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Amount (₹) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                <input
                  id="receivable-amount"
                  type="number"
                  className="input pl-8"
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
            </div>

            <WalletPicker
              label="Paid from wallet *"
              value={form.wallet}
              onChange={(v) => setForm({ ...form, wallet: v })}
            />

            <div>
              <label className="label">Expected return date</label>
              <input
                id="receivable-return-date"
                type="date"
                className="input"
                min={new Date().toISOString().split('T')[0]}
                value={form.return_date}
                onChange={(e) => setForm({ ...form, return_date: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label">
                Notes <span className="text-gray-600">(optional)</span>
              </label>
              <input
                id="receivable-notes"
                type="text"
                className="input"
                placeholder="Context, e.g. emergency help, shared expense…"
                maxLength={80}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3 pt-1">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button
                id="receivable-submit"
                type="submit"
                className="btn-primary flex items-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <HandCoins size={15} />
                )}
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {[
          { value: '', label: 'All' },
          { value: 'pending', label: '🟡 Outstanding' },
          { value: 'returned', label: '🟢 Received back' },
        ].map((f) => (
          <button
            key={f.value}
            id={`filter-receivable-${f.value || 'all'}`}
            type="button"
            onClick={() => setFilterStatus(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${
                filterStatus === f.value
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="card text-center py-20">
          <HandCoins size={44} className="mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 font-medium">Nothing to receive yet</p>
          <p className="text-gray-600 text-sm mt-1">Use &quot;Record money lent&quot; when you give cash or UPI to someone.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {records.map((row) => {
            const overdue = isReceivableOverdue(row)
            const dueSoon = isReceivableDueSoon(row)
            return (
              <div
                key={row._id}
                className={`card flex flex-col gap-4 relative transition-all ${
                  row.status === 'returned'
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : overdue
                      ? 'border-red-500/40 bg-red-500/5'
                      : dueSoon
                        ? 'border-orange-500/40 bg-orange-500/5'
                        : 'hover:border-primary-500/30'
                }`}
              >
                {row.status === 'pending' && overdue && (
                  <div
                    className="absolute top-3 right-3 flex items-center gap-1
                                  text-xs text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/20"
                  >
                    <AlertTriangle size={10} /> Overdue
                  </div>
                )}
                {row.status === 'pending' && dueSoon && (
                  <div
                    className="absolute top-3 right-3 flex items-center gap-1
                                  text-xs text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full border border-orange-500/20"
                  >
                    <Clock size={10} /> Due soon
                  </div>
                )}
                {row.status === 'returned' && (
                  <div
                    className="absolute top-3 right-3 flex items-center gap-1
                                  text-xs text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/20"
                  >
                    <CheckCircle size={10} /> Received
                  </div>
                )}
                {row.status === 'pending' && !overdue && !dueSoon && (
                  <div
                    className="absolute top-3 right-3 flex items-center gap-1
                                  text-xs text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/20"
                  >
                    <Clock size={10} /> Outstanding
                  </div>
                )}

                <div className="flex items-center gap-3 pr-20">
                  <div
                    className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-violet-600
                                  flex items-center justify-center text-white font-bold text-base shrink-0"
                  >
                    {row.person_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{row.person_name}</p>
                    <p className="text-gray-500 text-xs">
                      from {row.wallet === 'cash' ? '💵 Cash' : '📱 UPI'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-3xl font-bold text-white">{fmt(row.amount)}</p>
                  {row.notes && <p className="text-gray-400 text-sm mt-0.5 truncate">{row.notes}</p>}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="bg-white/5 px-3 py-1.5 rounded-lg">
                    <span className="text-gray-500">Given</span>
                    <span className="text-gray-300 ml-1 font-medium">
                      {row.given_date
                        ? new Date(row.given_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: '2-digit',
                          })
                        : '—'}
                    </span>
                  </div>
                  {row.return_date && (
                    <div
                      className={`px-3 py-1.5 rounded-lg ${
                        overdue ? 'bg-red-500/20' : dueSoon ? 'bg-orange-500/20' : 'bg-white/5'
                      }`}
                    >
                      <span className="text-gray-500">Due</span>
                      <span
                        className={`ml-1 font-medium ${
                          overdue ? 'text-red-400' : dueSoon ? 'text-orange-400' : 'text-gray-300'
                        }`}
                      >
                        {new Date(row.return_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {row.status === 'pending' ? (
                  <button
                    id={`mark-received-${row._id}`}
                    type="button"
                    className="w-full btn-secondary text-sm py-2.5 flex items-center justify-center gap-2
                      border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    onClick={() => setReceiving(row)}
                  >
                    <CheckCircle size={15} /> Mark as received
                  </button>
                ) : (
                  <div
                    className="flex items-center justify-center gap-2 py-2.5 text-emerald-400 text-sm font-medium
                                  bg-emerald-500/10 rounded-xl border border-emerald-500/20"
                  >
                    <CheckCircle size={15} />
                    Received back
                    {row.returned_date && (
                      <span className="text-gray-500 text-xs">
                        ·{' '}
                        {new Date(row.returned_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    )}
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
