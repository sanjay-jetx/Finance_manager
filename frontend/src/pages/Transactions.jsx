import { useEffect, useState } from 'react'
import api from '../api/axios'
import { getCached, setCached } from '../api/cache'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import {
  Plus, X, ArrowDownRight, ArrowUpRight, RefreshCw,
  Filter, Banknote, Smartphone, Users, Download, ArrowLeftRight, Target, Trash2, Search, Edit2
} from 'lucide-react'

import { transactionUiType, isCreditUiType, displayCategoryForUi } from '../utils/transactionsUi'
import { useTransactions } from '../hooks/useTransactions'

const EXPENSE_CATEGORIES = [
  'Food & Dining','Transport','Shopping','Entertainment','Health',
  'Bills & Utilities','Education','Travel','Groceries','Other'
]

const typeConfig = {
  expense:            { label: 'Expense',              color: 'text-danger',     bg: 'bg-danger/10 border-danger/20',     icon: ArrowDownRight },
  income:             { label: 'Income',               color: 'text-success',    bg: 'bg-success/10 border-success/20',   icon: ArrowUpRight },
  lend:               { label: 'You lent',             color: 'text-warning',    bg: 'bg-warning/10 border-warning/20',   icon: Users },
  debt_return:        { label: 'Receivable return',    color: 'text-accent',     bg: 'bg-accent/10 border-accent/20',     icon: ArrowUpRight },
  receivable_return:  { label: 'Receivable return',    color: 'text-accent',     bg: 'bg-accent/10 border-accent/20',     icon: ArrowUpRight },
  transfer:           { label: 'Transfer',             color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', icon: ArrowLeftRight },
  goal_transfer:      { label: 'Goal Save',            color: 'text-info',       bg: 'bg-info/10 border-info/20',         icon: Target },
}

export default function Transactions() {
  const {
    txns, categories, loading, loadingMore, hasMore, totalCount,
    filterWallet, setFilterWallet, filterType, setFilterType, filterCategory, setFilterCategory, searchQuery, setSearchQuery,
    loadMore, refresh
  } = useTransactions()

  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState('expense')
  const [form, setForm] = useState({ amount: '', category: '', wallet: 'cash', notes: '', source: '' })
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction? Your balance will be reversed automatically.')) return
    try {
      await api.delete(`/transactions/${id}`)
      toast.success('Transaction deleted')
      refresh()   // reset to page 1 after mutation
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete transaction')
    }
  }

  const handleEdit = (txn) => {
    if (!['expense', 'income'].includes(txn.type)) {
      toast.error('Only ordinary expense and income transactions can be edited directly.')
      return
    }
    setFormType(txn.type)
    setForm({
      amount: txn.amount,
      category: txn.category || '',
      wallet: txn.wallet || 'cash',
      notes: txn.notes || '',
      source: txn.source || ''
    })
    setEditingId(txn._id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body = formType === 'expense'
        ? { amount: +form.amount, category: form.category, wallet: form.wallet, notes: form.notes }
        : { amount: +form.amount, source: form.source, wallet: form.wallet, notes: form.notes }
      
      if (editingId) {
        await api.put(`/transactions/${editingId}`, body)
        toast.success('Transaction updated!')
        setEditingId(null)
      } else {
        const endpoint = formType === 'expense' ? '/expense' : '/income'
        const res = await api.post(endpoint, body)
        toast.success(`${formType === 'expense' ? 'Expense' : 'Income'} recorded!`)
        if (res.data.budget_alert) toast(res.data.budget_alert, { icon: '⚠️' })
      }
      setForm({ amount: '', category: '', wallet: 'cash', notes: '', source: '' })
      setShowForm(false)
      refresh()   // reset to page 1 after mutation
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save transaction')
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

  const isIncome = formType === 'income'

  return (
    <div className="space-y-6 lg:space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 animate-stagger-1">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Transactions</h1>
          <p className="text-muted mt-1 font-medium">
            {totalCount > 0 ? `${txns.length} of ${totalCount} records` : `${txns.length} records`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={async () => {
            if (window.confirm("WARNING: This will completely wipe all your transactions and reset wallets, debts, goals, and budgets. This is irreversible. Are you sure?")) {
              if (window.confirm("FINAL CONFIRMATION: Click OK to annihilate all data.")) {
                try {
                  await api.delete('/transactions/clear_all?confirm=true')
                  toast.success('All data has been cleared.')
                  refresh()
                } catch (e) {
                  toast.error(e.response?.data?.detail || 'Failed to clear data.')
                }
              }
            }
          }} className="panel px-4 py-2 bg-danger/10 hover:bg-danger/20 border border-danger/20 text-danger transition-colors flex items-center gap-2 font-semibold text-sm">
            <Trash2 size={16} /> <span className="hidden sm:inline">Clear All</span>
          </button>
          
          <button onClick={handleExport} className="panel px-4 py-2 bg-surface hover:bg-white/5 border border-border text-muted hover:text-foreground transition-colors flex items-center gap-2 font-semibold text-sm">
            <Download size={16} /> <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button onClick={() => {
              if (showForm) { setShowForm(false); setEditingId(null); setForm({ amount:'', category:'', wallet:'cash', notes:'', source:'' }) }
              else { setShowForm(true) }
            }}
            className="btn-primary">
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'New '}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="panel p-6 sm:p-8 animate-stagger-2 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${isIncome ? 'bg-success' : 'bg-danger'}`} />
          <h3 className="text-foreground font-display font-bold text-xl mb-6">{editingId ? 'Edit Transaction' : 'Log Transaction'}</h3>
          
          <div className="flex p-1.5 bg-black/40 rounded-[14px] border border-white/5 mb-6 max-w-sm relative">
            <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-surface rounded-xl border border-white/10 shadow-sm transition-all duration-300 ${isIncome ? 'translate-x-full' : 'translate-x-0'}`} />
            <button type="button" disabled={!!editingId} onClick={() => setFormType('expense')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold z-10 transition-colors ${!isIncome ? 'text-danger' : 'text-muted'}`}>Expense</button>
            <button type="button" disabled={!!editingId} onClick={() => setFormType('income')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold z-10 transition-colors ${isIncome ? 'text-success' : 'text-muted'}`}>Income</button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Amount (₹)</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-lg group-focus-within:text-accent">₹</span>
                <input type="number" min="1" step="0.01" required placeholder="0.00"
                  value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-[16px] py-3.5 pl-9 pr-4 text-white font-display text-lg font-bold focus:outline-none focus:border-accent focus:bg-accent/5 transition-all shadow-inner" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Wallet</label>
                <select className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-medium focus:outline-none focus:border-accent"
                  value={form.wallet} onChange={e => setForm({...form, wallet: e.target.value})}>
                  <option value="cash" className="bg-surface">CASH</option>
                  <option value="upi" className="bg-surface">UPI</option>
                </select>
              </div>
              {formType === 'expense' ? (
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Category</label>
                  <select required className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-medium focus:outline-none focus:border-accent"
                    value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option value="" className="bg-surface">Select category</option>
                    {categories.map(c => <option key={c._id} value={c.name} className="bg-surface">{c.name}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Source</label>
                  <input type="text" required placeholder="Salary, Side gig..." className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-medium focus:outline-none focus:border-accent"
                    value={form.source} onChange={e => setForm({...form, source: e.target.value})} />
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Notes (Optional)</label>
              <input type="text" placeholder="Add a note..." className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm focus:outline-none focus:border-accent"
                value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm({ amount:'', category:'', wallet:'cash', notes:'', source:'' }) }}
                className="px-6 py-3 rounded-xl border border-border text-muted font-semibold hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className={`px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isIncome ? 'bg-gradient-success' : 'bg-white text-black hover:bg-gray-200'} disabled:opacity-70`}>
                {submitting ? <span className="w-4 h-4 border-2 border-[currentColor]/30 border-t-[currentColor] rounded-full animate-spin" /> : null}
                {editingId ? 'Update' : 'Save Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters Area */}
      <div className="flex flex-wrap gap-4 items-center animate-stagger-2 select-none">
        <div className="relative flex-1 min-w-[200px] lg:max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Search notes, categories..." 
            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all shadow-inner"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-1 max-w-full no-scrollbar">
          <select className="bg-white/[0.04] border border-white/10 text-muted rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:text-foreground focus:border-accent/50 transition-all shadow-inner"
            value={filterWallet} onChange={e => setFilterWallet(e.target.value)}>
            <option value="" className="bg-[#121214]">All Wallets</option>
            <option value="cash" className="bg-[#121214]">CASH</option>
            <option value="upi" className="bg-[#121214]">UPI</option>
          </select>
          <select className="bg-white/[0.04] border border-white/10 text-muted rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:text-foreground focus:border-accent/50 transition-all shadow-inner"
            value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="" className="bg-[#121214]">All Types</option>
            <option value="expense" className="bg-[#121214]">Expense</option>
            <option value="income" className="bg-[#121214]">Income</option>
            <option value="lend" className="bg-[#121214]">Lent</option>
            <option value="transfer" className="bg-[#121214]">Transfer</option>
          </select>
          <select className="bg-white/[0.04] border border-white/10 text-muted rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:text-foreground focus:border-accent/50 transition-all shadow-inner"
            value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="" className="bg-[#121214]">All Categories</option>
            {categories.map(c => <option key={c._id} value={c.name} className="bg-[#121214]">{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="panel p-3 flex flex-col gap-2 bg-white/[0.02] animate-stagger-3 border-transparent">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-5 rounded-2xl border border-white/5 bg-white/[0.01]">
              <div className="skeleton w-12 h-12 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-48" />
                <div className="skeleton h-3 w-32" />
              </div>
              <div className="text-right space-y-2">
                <div className="skeleton h-5 w-20" />
                <div className="skeleton h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : txns.length === 0 || txns.length === 0 ? (
        <div className="panel p-16 flex flex-col items-center text-center animate-stagger-3 border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Search size={28} className="text-muted" />
          </div>
          <p className="text-foreground font-display font-bold text-xl mb-2">No results found</p>
          <p className="text-muted text-sm max-w-xs">{searchQuery ? "Try adjusting your search or filters." : "You haven't added any transactions yet."}</p>
        </div>
      ) : (
        <div className="panel p-2 flex flex-col gap-1 bg-white/[0.02] animate-stagger-3 border-transparent shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
          {txns.map((txn) => {
            const uiType = transactionUiType(txn)
            const cfg = typeConfig[uiType] || typeConfig.expense
            const Icon = cfg.icon
            const isCredit = isCreditUiType(uiType)
            return (
              <div key={txn._id} className="group flex flex-wrap sm:flex-nowrap items-center gap-4 px-6 py-4 rounded-xl hover:bg-white/[0.06] hover:scale-[1.01] transition-all cursor-pointer border border-transparent hover:border-white/10 hover:shadow-lg">
                <div className={`p-3 rounded-2xl flex-shrink-0 border ${cfg.bg} shadow-inner group-hover:scale-110 transition-transform`}>
                  <Icon size={18} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-semibold text-[15px] truncate group-hover:text-white transition-colors">
                    {txn.notes || txn.source || txn.category || cfg.label}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-muted text-xs font-medium">
                      {txn.wallet === 'cash' ? 'Cash' : 'UPI'}{' '}
                      {displayCategoryForUi(txn.category) ? `• ${txn.category}` : ''}
                      {txn.source ? `• ${txn.source}` : ''}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-display font-bold text-lg ${isCredit ? 'text-success drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'text-foreground'}`}>
                    {isCredit ? '+' : '-'}{fmt(txn.amount)}
                  </p>
                  <p className="text-muted text-[11px] font-semibold mt-1 uppercase tracking-widest">
                    {txn.timestamp ? new Date(txn.timestamp).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : ''}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all mt-3 sm:mt-0 pt-3 sm:pt-0 justify-end">
                  {['expense', 'income'].includes(txn.type) && (
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(txn); }} title="Edit transaction"
                      className="p-2.5 bg-surface sm:bg-transparent text-muted hover:text-accent hover:bg-accent/10 rounded-xl transition-colors border border-border sm:border-transparent">
                      <Edit2 size={16} />
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(txn._id); }} title="Delete transaction"
                    className="p-2.5 bg-surface sm:bg-transparent text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-colors border border-border sm:border-transparent">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}

          {/* Load More button */}
          {hasMore && (
            <div className="flex justify-center py-6 border-t border-border/50">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-8 py-3 bg-surface border border-border rounded-xl text-sm font-semibold text-muted hover:text-foreground hover:border-accent/50 transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {loadingMore ? (
                  <span className="w-4 h-4 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
                ) : null}
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
