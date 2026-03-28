import { useEffect, useState } from 'react'
import api from '../api/axios'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import { Banknote, Smartphone, RefreshCw, TrendingUp, ArrowLeftRight } from 'lucide-react'

export default function Wallets() {
  const [balances, setBalances] = useState({ cash_balance: 0, upi_balance: 0, total_balance: 0 })
  const [loading, setLoading]   = useState(true)
  const [form, setForm] = useState({ from_wallet: 'cash', to_wallet: 'upi', amount: '' })
  const [submitting, setSubmitting] = useState(false)
  const [addFundsForm, setAddFundsForm] = useState({ wallet: 'cash', amount: '', source: 'Initial Balance' })
  const [addingFunds, setAddingFunds] = useState(false)
  const [showAddFunds, setShowAddFunds] = useState(false)

  const fetchBalances = async () => {
    setLoading(true)
    try {
      const res = await api.get('/balances')
      setBalances(res.data)
    } catch (err) {
      toast.error('Failed to load balances')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBalances() }, [])

  const handleTransfer = async (e) => {
    e.preventDefault()
    if (form.from_wallet === form.to_wallet) {
      toast.error('Select different wallets')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/transfer', {
        from_wallet: form.from_wallet,
        to_wallet: form.to_wallet,
        amount: +form.amount,
      })
      toast.success(`₹${form.amount} transferred!`)
      setForm({ ...form, amount: '' })
      fetchBalances()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Transfer failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddFunds = async (e) => {
    e.preventDefault()
    setAddingFunds(true)
    try {
      await api.post('/income', {
        amount: +addFundsForm.amount,
        source: addFundsForm.source || 'Manual Top-up',
        wallet: addFundsForm.wallet,
        notes: `Added to ${addFundsForm.wallet} wallet`,
      })
      toast.success(`₹${addFundsForm.amount} added to ${addFundsForm.wallet} wallet!`)
      setAddFundsForm({ wallet: 'cash', amount: '', source: 'Initial Balance' })
      setShowAddFunds(false)
      fetchBalances()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add funds')
    } finally {
      setAddingFunds(false)
    }
  }

  const cashPct = balances.total_balance > 0
    ? (balances.cash_balance / balances.total_balance) * 100
    : 50
  const upiPct  = 100 - cashPct

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="section-title">My Wallets</h1>
          <p className="section-sub">Manage your cash and UPI balances</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAddFunds(!showAddFunds)}
            className="btn-secondary flex items-center gap-2 text-sm">
            <TrendingUp size={16} /> Add Funds
          </button>
          <button onClick={fetchBalances}
            className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Cash */}
            <div className="card bg-gradient-to-br from-emerald-600/20 to-teal-700/20 border-emerald-500/20 col-span-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/20">
                  <Banknote size={22} className="text-emerald-400" />
                </div>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                  Cash
                </span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{fmt(balances.cash_balance, 2)}</p>
              <p className="text-emerald-400/70 text-sm">Physical Cash on hand</p>
              <div className="mt-3 bg-white/5 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${cashPct}%` }} />
              </div>
              <p className="text-gray-500 text-xs mt-1">{cashPct.toFixed(0)}% of total</p>
            </div>

            {/* UPI */}
            <div className="card bg-gradient-to-br from-blue-600/20 to-violet-700/20 border-blue-500/20 col-span-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/20">
                  <Smartphone size={22} className="text-blue-400" />
                </div>
                <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">
                  UPI
                </span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{fmt(balances.upi_balance, 2)}</p>
              <p className="text-blue-400/70 text-sm">GPay / PhonePe</p>
              <div className="mt-3 bg-white/5 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-blue-500 to-violet-500 h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${upiPct}%` }} />
              </div>
              <p className="text-gray-500 text-xs mt-1">{upiPct.toFixed(0)}% of total</p>
            </div>

            {/* Total */}
            <div className="card bg-gradient-to-br from-primary-600/20 to-violet-700/20 border-primary-500/20 col-span-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-primary-500/20">
                  <TrendingUp size={22} className="text-primary-400" />
                </div>
                <span className="text-xs text-primary-400 bg-primary-500/10 px-2 py-1 rounded-full border border-primary-500/20">
                  Total
                </span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{fmt(balances.total_balance, 2)}</p>
              <p className="text-primary-400/70 text-sm">Combined Balance</p>
              <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-700"
                  style={{ width: `${cashPct}%` }} />
                <div className="bg-gradient-to-r from-blue-500 to-violet-500 h-full transition-all duration-700"
                  style={{ width: `${upiPct}%` }} />
              </div>
              <p className="text-gray-500 text-xs mt-1">💵 Cash + 📱 UPI</p>
            </div>
          </div>

          {/* Add Funds */}
          {showAddFunds && (
            <div className="card animate-slide-up">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-400" /> Add Funds to Wallet
              </h3>
              <form onSubmit={handleAddFunds} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Wallet</label>
                  <select id="add-funds-wallet" className="input" value={addFundsForm.wallet}
                    onChange={e => setAddFundsForm({...addFundsForm, wallet: e.target.value})}>
                    <option value="cash">💵 Cash</option>
                    <option value="upi">📱 UPI</option>
                  </select>
                </div>
                <div>
                  <label className="label">Amount (₹)</label>
                  <input id="add-funds-amount" type="number" className="input" placeholder="0.00" min="1" required
                    value={addFundsForm.amount} onChange={e => setAddFundsForm({...addFundsForm, amount: e.target.value})} />
                </div>
                <div>
                  <label className="label">Source</label>
                  <input id="add-funds-source" type="text" className="input" placeholder="Salary, Cash..."
                    value={addFundsForm.source} onChange={e => setAddFundsForm({...addFundsForm, source: e.target.value})} />
                </div>
                <div className="sm:col-span-3 flex justify-end gap-3">
                  <button type="button" className="btn-secondary" onClick={() => setShowAddFunds(false)}>Cancel</button>
                  <button id="add-funds-submit" type="submit" className="btn-success flex items-center gap-2" disabled={addingFunds}>
                    {addingFunds && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Add Funds
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Transfer Between Wallets */}
          <div className="card">
            <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
              <ArrowLeftRight size={18} className="text-primary-400" />
              Transfer Between Wallets
            </h3>
            <form onSubmit={handleTransfer} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="label">From</label>
                <select id="transfer-from" className="input" value={form.from_wallet}
                  onChange={e => {
                    const fw = e.target.value
                    setForm({ ...form, from_wallet: fw, to_wallet: fw === 'cash' ? 'upi' : 'cash' })
                  }}>
                  <option value="cash">💵 Cash</option>
                  <option value="upi">📱 UPI</option>
                </select>
              </div>
              <div className="flex items-center justify-center pb-1">
                <div className="p-2 rounded-full bg-primary-500/20 border border-primary-500/30">
                  <ArrowLeftRight size={18} className="text-primary-400" />
                </div>
              </div>
              <div>
                <label className="label">To</label>
                <select id="transfer-to" className="input" value={form.to_wallet}
                  onChange={e => setForm({ ...form, to_wallet: e.target.value })}>
                  <option value="upi">📱 UPI</option>
                  <option value="cash">💵 Cash</option>
                </select>
              </div>
              <div>
                <label className="label">Amount (₹)</label>
                <input id="transfer-amount" type="number" className="input" placeholder="0.00" min="1" step="0.01" required
                  value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="sm:col-span-4 flex justify-end">
                <button id="transfer-submit" type="submit"
                  className="btn-primary flex items-center gap-2" disabled={submitting}>
                  {submitting
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <ArrowLeftRight size={16} />}
                  Transfer Now
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
