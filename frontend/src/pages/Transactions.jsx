import { useEffect, useState } from 'react'
import api from '../api/axios'
import { getCached, setCached } from '../api/cache'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import {
  Plus, X, ArrowDownRight, ArrowUpRight, RefreshCw,
  Filter, Banknote, Smartphone, Users, Download, ArrowLeftRight, Target, Trash2, Search, Edit2, Calendar
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
}

export default function Transactions() {
  const {
    txns, categories, loading, loadingMore, hasMore, totalCount,
    filterWallet, setFilterWallet, filterType, setFilterType, filterCategory, setFilterCategory, searchQuery, setSearchQuery,
    loadMore, refresh
  } = useTransactions()

  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState('expense')
  const [form, setForm] = useState({ amount: '', category: '', wallet: 'upi', notes: '', source: '' })
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [monthFilter, setMonthFilter] = useState(false)

  const location = useLocation()

  // Apply pre-filters when navigating from dashboard stat cards
  useEffect(() => {
    const state = location.state
    if (state?.filterType) {
      setFilterType(state.filterType)
    }
    if (state?.period === 'month') {
      setMonthFilter(true)
    }
    // Clear state so back-navigation doesn't re-apply
    window.history.replaceState({}, '')
  }, [])

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

  // Current-month boundaries for client-side filter
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime()

  const displayedTxns = monthFilter
    ? txns.filter(t => {
        const ts = new Date(t.timestamp).getTime()
        return ts >= monthStart && ts <= monthEnd
      })
    : txns

  const MONTH_LABEL = now.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 lg:space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 animate-stagger-1">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-widest uppercase text-foreground">Transactions</h1>
          <p className="obsidian-label mt-2">
            {monthFilter
              ? `${displayedTxns.length} TRANSACTIONS · ${MONTH_LABEL}`
              : totalCount > 0 ? `${txns.length} OF ${totalCount} RECORDS` : `${txns.length} RECORDS`
            }
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
          }} className="panel px-4 py-3 bg-[#1F0A0E] hover:bg-[#2A0510] border border-[#FF3366]/20 text-danger transition-colors flex items-center gap-3 font-display uppercase tracking-widest font-bold text-[10px]">
            <Trash2 size={14} /> <span className="hidden sm:inline">Clear Transactions</span>
          </button>
          
          <button onClick={handleExport} className="panel px-4 py-3 hover:bg-surfaceHover border border-white/5 text-muted hover:text-foreground transition-colors flex items-center gap-3 font-display uppercase tracking-widest font-bold text-[10px]">
            <Download size={14} /> <span className="hidden sm:inline">Export Transactions</span>
          </button>
          <button onClick={() => {
              if (showForm) { setShowForm(false); setEditingId(null); setForm({ amount:'', category:'', wallet:'cash', notes:'', source:'' }) }
              else { setShowForm(true) }
            }}
            className="btn-primary flex items-center gap-2">
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'Add Transaction'}
          </button>
        </div>
      </div>

      {/* Month Filter Active Banner */}
      {monthFilter && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/5 border border-accent/20 animate-stagger-1">
          <Calendar size={14} className="text-accent flex-shrink-0" />
          <p className="text-accent text-[11px] font-bold font-display uppercase tracking-widest flex-1">
            Showing {filterType === 'expense' ? 'Expenses' : 'Income'} for {MONTH_LABEL}
          </p>
          <button
            onClick={() => { setMonthFilter(false); setFilterType('') }}
            className="p-1 text-muted hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="panel p-6 sm:p-8 animate-stagger-2 relative overflow-hidden bg-surface/60 backdrop-blur-3xl border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          <div className={`absolute top-0 left-0 w-1 h-full ${isIncome ? 'bg-accent' : 'bg-danger'}`} />
          <h3 className="obsidian-label text-foreground mb-6">{editingId ? 'EDIT INTELLIGENCE RECORD' : 'ADD TRANSACTION'}</h3>
          
          <div className="flex p-1.5 bg-[#15161A] rounded-[4px] border border-white/5 mb-6 max-w-sm relative">
            <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#1A1C21] rounded shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-300 ${isIncome ? 'translate-x-full' : 'translate-x-0'}`} />
            <button type="button" disabled={!!editingId} onClick={() => setFormType('expense')} className={`flex-1 py-3 text-[11px] uppercase tracking-widest font-bold z-10 transition-colors ${!isIncome ? 'text-danger' : 'text-muted'}`}>Expense</button>
            <button type="button" disabled={!!editingId} onClick={() => setFormType('income')} className={`flex-1 py-3 text-[11px] uppercase tracking-widest font-bold z-10 transition-colors ${isIncome ? 'text-accent' : 'text-muted'}`}>Income</button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-3 ml-1">Amount (₹)</label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-xl group-focus-within:text-white">₹</span>
                <input type="number" min="1" step="0.01" required placeholder="0.00"
                  value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                  className="w-full bg-[#15161A] border border-white/5 rounded-lg py-4 pl-10 pr-5 text-white font-display text-2xl font-bold focus:outline-none focus:border-accent transition-all shadow-inner" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-3 ml-1">Account</label>
                <select className="w-full bg-[#15161A] border border-white/5 rounded-lg px-5 py-4 text-white text-sm font-display focus:outline-none focus:border-accent"
                  value={form.wallet} onChange={e => setForm({...form, wallet: e.target.value})}>
                  <option value="upi" className="bg-surface">UPI</option>
                  <option value="cash" className="bg-surface">CASH</option>
                </select>
              </div>
              {formType === 'expense' ? (
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-3 ml-1">Category</label>
                  <select required className="w-full bg-[#15161A] border border-white/5 rounded-lg px-5 py-4 text-white text-sm font-display focus:outline-none focus:border-accent"
                    value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option value="" className="bg-surface">Select category</option>
                    {categories.map(c => <option key={c._id} value={c.name} className="bg-surface">{c.name}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-3 ml-1">Source</label>
                  <input type="text" required placeholder="Salary, Yield..." className="w-full bg-[#15161A] border border-white/5 rounded-lg px-5 py-4 text-white text-sm font-display focus:outline-none focus:border-accent"
                    value={form.source} onChange={e => setForm({...form, source: e.target.value})} />
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-3 ml-1">Intelligence Notes (Optional)</label>
              <input type="text" placeholder="Add a note..." className="w-full bg-[#15161A] border border-white/5 rounded-lg px-5 py-4 text-white text-[13px] font-display focus:outline-none focus:border-accent"
                value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>

            <div className="md:col-span-2 flex justify-end gap-4 mt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm({ amount:'', category:'', wallet:'cash', notes:'', source:'' }) }}
                className="px-8 py-3 rounded text-muted font-display uppercase font-bold text-[11px] tracking-widest hover:bg-white/5 transition-colors border border-white/5">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className={`btn-primary flex items-center justify-center gap-2 ${isIncome ? 'bg-accent text-black' : 'bg-surface text-foreground border border-white/5'} disabled:opacity-70`}>
                {submitting ? <span className="w-4 h-4 border-2 border-[currentColor]/30 border-t-[currentColor] rounded-full animate-spin" /> : null}
                {editingId ? 'Update Ledger' : 'Commit Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters Area */}
      <div className="flex flex-col gap-5 animate-stagger-2 select-none pt-4">
        <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px] lg:max-w-md">
              <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" placeholder="Search ledger..." 
                className="w-full bg-[#0C0D10] border border-white/5 rounded-lg pl-12 pr-5 py-4 text-sm font-display text-foreground focus:outline-none focus:border-accent transition-all shadow-inner"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            
            <div className="flex items-center gap-3 overflow-x-auto pb-1 max-w-full no-scrollbar">
                <div className="flex p-1.5 bg-[#0C0D10] border border-white/5 rounded-lg shrink-0">
                    <button onClick={() => setFilterWallet('')} className={`px-5 py-2.5 rounded text-[10px] tracking-widest font-bold uppercase transition-all ${filterWallet === '' ? 'bg-[#15161A] text-white' : 'text-muted hover:text-white'}`}>All Accounts</button>
                    <button onClick={() => setFilterWallet('cash')} className={`px-5 py-2.5 rounded text-[10px] tracking-widest font-bold uppercase transition-all ${filterWallet === 'cash' ? 'bg-[#15161A] text-white' : 'text-muted hover:text-white'}`}>CASH</button>
                    <button onClick={() => setFilterWallet('upi')} className={`px-5 py-2.5 rounded text-[10px] tracking-widest font-bold uppercase transition-all ${filterWallet === 'upi' ? 'bg-[#15161A] text-white' : 'text-muted hover:text-white'}`}>UPI</button>
                </div>

                <div className="flex p-1.5 bg-[#0C0D10] border border-white/5 rounded-lg shrink-0">
                    <button onClick={() => setFilterType('')} className={`px-5 py-2.5 rounded text-[10px] tracking-widest font-bold uppercase transition-all ${filterType === '' ? 'bg-[#15161A] text-white' : 'text-muted hover:text-white'}`}>All</button>
                    <button onClick={() => setFilterType('income')} className={`px-5 py-2.5 rounded text-[10px] tracking-widest font-bold uppercase transition-all ${filterType === 'income' ? 'bg-[#1A1C30]/50 text-accent' : 'text-muted hover:text-accent'}`}>Credited</button>
                    <button onClick={() => setFilterType('expense')} className={`px-5 py-2.5 rounded text-[10px] tracking-widest font-bold uppercase transition-all ${filterType === 'expense' ? 'bg-[#2A1015]/50 text-danger' : 'text-muted hover:text-danger'}`}>Debited</button>
                    <button onClick={() => setFilterType('lend')} className={`px-5 py-2.5 rounded text-[10px] tracking-widest font-bold uppercase transition-all ${filterType === 'lend' ? 'bg-warning/10 text-warning' : 'text-muted hover:text-warning'}`}>Lent</button>
                    <button onClick={() => setFilterType('transfer')} className={`px-5 py-2.5 rounded text-[10px] tracking-widest font-bold uppercase transition-all ${filterType === 'transfer' ? 'bg-purple-500/10 text-purple-400' : 'text-muted hover:text-purple-400'}`}>Transfer</button>
                </div>
            </div>
        </div>
        
        {(!filterType || filterType === 'expense') && categories.length > 0 && (() => {
          const PRIORITY = ['Petrol', 'Food & Dining', 'Food']
          const sorted = [...categories].sort((a, b) => {
            const ai = PRIORITY.indexOf(a.name)
            const bi = PRIORITY.indexOf(b.name)
            const aIsOther = a.name.toLowerCase() === 'other'
            const bIsOther = b.name.toLowerCase() === 'other'
            if (aIsOther) return 1
            if (bIsOther) return -1
            if (ai !== -1 && bi !== -1) return ai - bi
            if (ai !== -1) return -1
            if (bi !== -1) return 1
            return a.name.localeCompare(b.name)
          })
          return (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar shrink-0">
              <button onClick={() => setFilterCategory('')} className={`px-4 py-2 rounded text-[10px] tracking-widest font-bold uppercase border transition-all whitespace-nowrap ${filterCategory === '' ? 'bg-[#15161A] border-white/10 text-white' : 'bg-transparent border-white/5 text-muted hover:border-white/10'}`}>All Categories</button>
              {sorted.map(c => (
                <button key={c._id} onClick={() => setFilterCategory(c.name)} className={`px-4 py-2 rounded text-[10px] tracking-widest font-bold uppercase border transition-all whitespace-nowrap ${filterCategory === c.name ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-transparent border-white/5 text-muted hover:border-white/10'}`}>{c.name}</button>
              ))}
            </div>
          )
        })()}
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
        <div className="panel animate-stagger-3 mt-4">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted font-display mb-2">
                <div className="col-span-12 sm:col-span-5 lg:col-span-5 pl-2">Record Identifier</div>
                <div className="col-span-hidden sm:col-span-4 lg:col-span-3 hidden sm:block">Type</div>
                <div className="col-span-4 lg:col-span-2 hidden lg:block">Date</div>
                <div className="col-span-hidden sm:col-span-3 lg:col-span-2 hidden sm:block text-right pr-2">Amount</div>
            </div>

            <div className="flex flex-col gap-2.5 px-4 pb-6">
              {displayedTxns.map((txn, idx) => {
                const uiType = transactionUiType(txn);
                const cfg = typeConfig[uiType] || typeConfig.expense;
                const Icon = cfg.icon;
                const isCredit = isCreditUiType(uiType);
                const isTransfer = uiType === 'transfer';
                
                const boxStyle = isTransfer
                  ? 'bg-gradient-to-r from-purple-500/[0.08] to-transparent border border-purple-500/10 hover:border-purple-500/30 hover:from-purple-500/[0.12]'
                  : isCredit
                  ? 'bg-gradient-to-r from-success/[0.08] to-transparent border border-success/10 hover:border-success/30 hover:from-success/[0.12]'
                  : 'bg-gradient-to-r from-danger/[0.08] to-transparent border border-danger/10 hover:border-danger/30 hover:from-danger/[0.12]';

                return (
                  <div key={txn._id} className={`grid grid-cols-12 gap-4 px-4 py-4 rounded-xl items-center transition-all relative group ${boxStyle}`}>
                    <div className="col-span-12 sm:col-span-5 lg:col-span-5 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg bg-[#0C0D10]/50 border border-white/5 flex items-center justify-center flex-shrink-0 shadow-inner`}>
                        {isTransfer ? <RefreshCw size={14} className="text-purple-400" /> : isCredit ? <ArrowUpRight size={14} className="text-success"/> : <ArrowDownRight size={14} className="text-danger" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-foreground font-display font-semibold text-[13px] truncate">{txn.notes || txn.source || txn.category || cfg.label}</p>
                        <p className="text-muted text-[10px] mt-1 hidden sm:block">{txn.wallet === 'cash' ? 'Cash Account' : 'UPI Account'}</p>
                        <div className="sm:hidden flex items-center gap-2 mt-1">
                          <p className={`obsidian-value text-[14px] ${isCredit ? 'text-success' : 'text-danger'}`}>
                            {isCredit ? '+' : '-'}{fmt(txn.amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-hidden sm:col-span-4 lg:col-span-3 hidden sm:flex items-center">
                       <span className={`text-[9px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded font-display bg-[#0C0D10]/50 border border-white/5 shadow-inner`}>
                         {cfg.label}
                       </span>
                    </div>

                    <div className="col-span-4 lg:col-span-2 hidden lg:flex items-center">
                      <span className="text-muted text-[11px] font-semibold tracking-widest">{txn.timestamp ? new Date(txn.timestamp).toLocaleDateString('en-US',{month:'short', day:'2-digit', year:'numeric'}) : ''}</span>
                    </div>

                    <div className="col-span-hidden sm:col-span-3 lg:col-span-2 text-right hidden sm:block pr-2">
                      <p className={`obsidian-value text-[15px] ${isCredit ? 'text-success' : 'text-danger'}`}>
                        {isCredit ? '+' : '-'}{fmt(txn.amount)}
                      </p>
                    </div>

                    {/* Actions Menu overlay */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0C0D10]/90 backdrop-blur pb-1 px-3 py-1.5 rounded-lg border border-white/10 shadow-xl">
                        {['expense', 'income'].includes(txn.type) && (
                          <button onClick={(e) => { e.stopPropagation(); handleEdit(txn); }} title="Edit transaction"
                            className="p-1.5 text-muted hover:text-accent transition-colors drop-shadow-md">
                            <Edit2 size={12} />
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(txn._id); }} title="Delete transaction"
                          className="p-1.5 text-muted hover:text-danger transition-colors drop-shadow-md">
                          <Trash2 size={12} />
                        </button>
                    </div>
                  </div>
                )
              })}
            </div>

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
