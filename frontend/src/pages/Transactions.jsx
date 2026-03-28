import { useEffect, useState } from 'react'
import api from '../api/axios'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import {
  Plus, X, ArrowDownRight, ArrowUpRight, RefreshCw,
  Filter, Banknote, Smartphone, Users, Download, ArrowLeftRight, Target, Trash2, Search
} from 'lucide-react'
import { transactionUiType, isCreditUiType, displayCategoryForUi } from '../utils/transactionsUi'

const EXPENSE_CATEGORIES = [
  'Food & Dining','Transport','Shopping','Entertainment','Health',
  'Bills & Utilities','Education','Travel','Groceries','Other'
]

const typeConfig = {
  expense:            { label: 'Expense',              color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     icon: ArrowDownRight },
  income:             { label: 'Income',               color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: ArrowUpRight },
  lend:               { label: 'You lent',             color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: Users },
  debt_return:        { label: 'Receivable received',  color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: ArrowUpRight },
  receivable_return:  { label: 'Receivable received', color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: ArrowUpRight },
  transfer:           { label: 'Transfer',             color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  icon: ArrowLeftRight },
  goal_transfer:      { label: 'Goal Save',            color: 'text-teal-400',    bg: 'bg-teal-500/10',    border: 'border-teal-500/20',    icon: Target },
}

export default function Transactions() {
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState('expense')
  const [form, setForm] = useState({ amount: '', category: '', wallet: 'cash', notes: '', source: '' })
  const [submitting, setSubmitting] = useState(false)
  const [filterWallet, setFilterWallet] = useState('')
  const [filterType, setFilterType] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchTxns = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterWallet) params.wallet = filterWallet
      if (filterType)   params.type   = filterType
      const res = await api.get('/transactions', { params })
      setTxns(res.data.transactions)
    } catch (err) {
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction? Your balance will be reversed automatically.')) return
    try {
      await api.delete(`/transactions/${id}`)
      toast.success('Transaction deleted')
      fetchTxns()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete transaction')
    }
  }

  const displayedTxns = txns.filter(txn => {
    if (!searchQuery) return true
    const term = searchQuery.toLowerCase()
    return (txn.notes || '').toLowerCase().includes(term) ||
           (txn.category || '').toLowerCase().includes(term) ||
           (txn.source || '').toLowerCase().includes(term)
  })

  useEffect(() => { fetchTxns() }, [filterWallet, filterType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const endpoint = formType === 'expense' ? '/expense' : '/income'
      const body = formType === 'expense'
        ? { amount: +form.amount, category: form.category, wallet: form.wallet, notes: form.notes }
        : { amount: +form.amount, source: form.source, wallet: form.wallet, notes: form.notes }
      const res = await api.post(endpoint, body)
      toast.success(`${formType === 'expense' ? 'Expense' : 'Income'} recorded!`)
      if (res.data.budget_alert) {
        toast(res.data.budget_alert, { icon: '⚠️', style: { border: '1px solid #facc15' } })
      }
      setForm({ amount: '', category: '', wallet: 'cash', notes: '', source: '' })
      setShowForm(false)
      fetchTxns()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to record transaction')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await api.get('/transactions/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'transactions.csv')
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('Export failed')
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Transactions</h1>
          <p className="section-sub">{txns.length} records found</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={16} /> Export CSV
          </button>
          <button id="add-transaction-btn" onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2">
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'Add'}
          </button>
        </div>
      </div>

      {/* Add Transaction Form */}
      {showForm && (
        <div className="card animate-slide-up">
          <h3 className="text-white font-semibold mb-4">New Transaction</h3>
          {/* Type Toggle */}
          <div className="flex gap-2 mb-5 p-1 rounded-xl bg-white/5 border border-white/10">
            {['expense', 'income'].map(t => (
              <button key={t} id={`type-${t}`}
                onClick={() => setFormType(t)}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all
                  ${formType === t
                    ? t === 'expense'
                      ? 'bg-red-500/30 text-red-300 border border-red-500/40'
                      : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                    : 'text-gray-500 hover:text-gray-300'
                  }`}>
                {t === 'expense' ? '💸 Expense' : '💰 Income'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Amount (₹)</label>
              <input id="txn-amount" type="number" className="input" placeholder="0.00" min="1" step="0.01" required
                value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
            </div>

            <div>
              <label className="label">Wallet</label>
              <select id="txn-wallet" className="input" value={form.wallet}
                onChange={e => setForm({...form, wallet: e.target.value})}>
                <option value="cash">💵 Cash</option>
                <option value="upi">📱 UPI</option>
              </select>
            </div>

            {formType === 'expense' ? (
              <div>
                <label className="label">Category</label>
                <select id="txn-category" className="input" required value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="">Select category</option>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="label">Source</label>
                <input id="txn-source" type="text" className="input" placeholder="Salary, Freelance..." required
                  value={form.source} onChange={e => setForm({...form, source: e.target.value})} />
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="label">Notes (optional)</label>
              <input id="txn-notes" type="text" className="input" placeholder="Add a note..."
                value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button id="txn-submit" type="submit" className="btn-primary flex items-center gap-2" disabled={submitting}>
                {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Save Transaction
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search notes, category, or source..." 
            className="input pl-9 text-sm py-2" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Filter size={16} className="text-gray-400" />
        <select id="filter-wallet" className="input w-auto text-sm py-2"
          value={filterWallet} onChange={e => setFilterWallet(e.target.value)}>
          <option value="">All Wallets</option>
          <option value="cash">💵 Cash</option>
          <option value="upi">📱 UPI</option>
        </select>
        <select id="filter-type" className="input w-auto text-sm py-2"
          value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="lend">You lent</option>
          <option value="transfer">Transfer</option>
          <option value="goal_transfer">Goal Save</option>
        </select>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : txns.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <ArrowLeftRight size={40} className="mx-auto mb-3 opacity-30" />
          No transactions found.
        </div>
      ) : displayedTxns.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          No results match your search.
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="divide-y divide-white/5">
            {displayedTxns.map((txn) => {
              const uiType = transactionUiType(txn)
              const cfg = typeConfig[uiType] || typeConfig.expense
              const Icon = cfg.icon
              const isCredit = isCreditUiType(uiType)
              return (
                <div key={txn._id}
                  className="group flex flex-wrap sm:flex-nowrap items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors">
                  <div className={`p-2.5 rounded-xl ${cfg.bg} border ${cfg.border} flex-shrink-0`}>
                    <Icon size={16} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {txn.notes || txn.source || txn.category || cfg.label}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {txn.wallet === 'cash' ? '💵' : '📱'}{' '}
                        {displayCategoryForUi(txn.category) || txn.source || ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold ${isCredit ? 'text-emerald-400' : cfg.color}`}>
                      {isCredit ? '+' : '-'}{fmt(txn.amount)}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {txn.timestamp ? new Date(txn.timestamp).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}) : ''}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(txn._id)} title="Delete transaction"
                    className="opacity-100 sm:opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
