import { useEffect, useState } from 'react'
import api from '../api/axios'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import { ArrowDownRight, ArrowLeftRight, Banknote, RefreshCw, Smartphone, TrendingUp, TrendingDown, ArrowUpRight, Search, Plus, X, Users, Target } from 'lucide-react'
import { transactionUiType, isCreditUiType, displayCategoryForUi } from '../utils/transactionsUi'

const typeConfig = {
  expense:            { label: 'Expense',              color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     icon: ArrowDownRight },
  income:             { label: 'Income',               color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: ArrowUpRight },
  lend:               { label: 'You lent',             color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: Users },
  debt_return:        { label: 'Receivable received',  color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: ArrowUpRight },
  receivable_return:  { label: 'Receivable received', color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: ArrowUpRight },
  transfer:           { label: 'Transfer',             color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  icon: ArrowLeftRight },
  goal_transfer:      { label: 'Goal Save',            color: 'text-teal-400',    bg: 'bg-teal-500/10',    border: 'border-teal-500/20',    icon: Target },
}

export default function Wallets() {
  const [balances, setBalances] = useState({ cash_balance: 0, upi_balance: 0, total_balance: 0 })
  const [loading, setLoading]   = useState(true)
  const [form, setForm] = useState({ from_wallet: 'cash', to_wallet: 'upi', amount: '' })
  const [submitting, setSubmitting] = useState(false)
  
  // Manage Funds state
  const [manageAction, setManageAction] = useState('deposit') // 'deposit' or 'spend'
  const [manageForm, setManageForm] = useState({ wallet: 'cash', amount: '', sourceOrCategory: '', notes: '' })
  const [managingFunds, setManagingFunds] = useState(false)
  const [showManage, setShowManage] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [categories, setCategories] = useState([])

  // Recent Transactions state
  const [recentTxns, setRecentTxns] = useState([])
  const [activeWallet, setActiveWallet] = useState('all') // 'all', 'cash', 'upi'
  const [loadingTxns, setLoadingTxns] = useState(true)

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

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories')
      setCategories(res.data.categories)
    } catch (err) {}
  }

  const fetchRecentTxns = async () => {
    setLoadingTxns(true)
    try {
      const params = activeWallet !== 'all' ? { wallet: activeWallet } : {}
      const res = await api.get('/transactions', { params })
      setRecentTxns(res.data.transactions.slice(0, 10)) // Last 10 max
    } catch (err) {
      toast.error('Failed to load recent transactions')
    } finally {
      setLoadingTxns(false)
    }
  }

  useEffect(() => { 
    fetchBalances() 
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchRecentTxns()
  }, [activeWallet])

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
      fetchRecentTxns()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Transfer failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleManageFunds = async (e) => {
    e.preventDefault()
    setManagingFunds(true)
    try {
      if (manageAction === 'deposit') {
        const res = await api.post('/income', {
          amount: +manageForm.amount,
          source: manageForm.sourceOrCategory || 'Manual Top-up',
          wallet: manageForm.wallet,
          notes: manageForm.notes || `Added to ${manageForm.wallet} wallet`,
        })
        toast.success(`₹${manageForm.amount} added to ${manageForm.wallet}!`)
      } else {
        const res = await api.post('/expense', {
          amount: +manageForm.amount,
          category: manageForm.sourceOrCategory || 'Other',
          wallet: manageForm.wallet,
          notes: manageForm.notes || `Spent from ${manageForm.wallet} wallet`,
        })
        toast.success(`₹${manageForm.amount} spent from ${manageForm.wallet}!`)
        if (res.data.budget_alert) {
          toast(res.data.budget_alert, { icon: '⚠️', style: { border: '1px solid #facc15' } })
        }
      }
      setManageForm({ wallet: manageForm.wallet, amount: '', sourceOrCategory: '', notes: '' })
      setShowManage(false)
      fetchBalances()
      fetchRecentTxns()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update funds')
    } finally {
      setManagingFunds(false)
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
        <div className="flex flex-wrap gap-3">
          <button onClick={() => { setShowManage(!showManage); if(!showManage) setShowTransfer(false); }}
            className={`flex items-center gap-2 text-sm transition-all focus:outline-none ${
              showManage 
                ? 'btn-secondary text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30' 
                : 'btn-secondary'
            }`}>
            {showManage ? <X size={16} /> : <TrendingUp size={16} />} 
            {showManage ? 'Cancel' : 'Manage Funds'}
          </button>
          <button onClick={() => { setShowTransfer(!showTransfer); if(!showTransfer) setShowManage(false); }}
            className={`flex items-center gap-2 text-sm transition-all focus:outline-none ${
              showTransfer 
                ? 'btn-secondary text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30' 
                : 'btn-secondary'
            }`}>
            {showTransfer ? <X size={16} /> : <ArrowLeftRight size={16} />} 
            {showTransfer ? 'Cancel' : 'Transfer Wallets'}
          </button>
          <button onClick={() => { fetchBalances(); fetchRecentTxns(); }}
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
            <div 
              onClick={() => setActiveWallet('cash')}
              className={`card cursor-pointer transition-all border-2 ${activeWallet === 'cash' ? 'ring-2 ring-emerald-500/50 bg-gradient-to-br from-emerald-600/30 to-teal-700/30 border-emerald-500' : 'bg-gradient-to-br from-emerald-600/10 to-teal-700/10 border-transparent hover:border-emerald-500/30'} col-span-1`}>
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
            <div 
              onClick={() => setActiveWallet('upi')}
              className={`card cursor-pointer transition-all border-2 ${activeWallet === 'upi' ? 'ring-2 ring-blue-500/50 bg-gradient-to-br from-blue-600/30 to-violet-700/30 border-blue-500' : 'bg-gradient-to-br from-blue-600/10 to-violet-700/10 border-transparent hover:border-blue-500/30'} col-span-1`}>
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
            <div 
              onClick={() => setActiveWallet('all')}
              className={`card cursor-pointer transition-all border-2 ${activeWallet === 'all' ? 'ring-2 ring-primary-500/50 bg-gradient-to-br from-primary-600/30 to-violet-700/30 border-primary-500' : 'bg-gradient-to-br from-primary-600/10 to-violet-700/10 border-transparent hover:border-primary-500/30'} col-span-1`}>
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

          {/* Manage Funds */}
          {showManage && (
            <div className="card animate-slide-up border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Banknote size={18} className="text-emerald-400" /> Manage Wallet Funds
                </h3>
              </div>

              {/* Action Toggle */}
              <div className="flex gap-2 mb-5 p-1 rounded-xl bg-white/5 border border-white/10 max-w-sm">
                <button 
                  onClick={() => setManageAction('deposit')}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all focus:outline-none ${manageAction === 'deposit' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' : 'text-gray-400 hover:text-gray-200'}`}>
                  Deposit Money
                </button>
                <button 
                  onClick={() => setManageAction('spend')}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all focus:outline-none ${manageAction === 'spend' ? 'bg-red-500/30 text-red-300 border border-red-500/40' : 'text-gray-400 hover:text-gray-200'}`}>
                  Spend Money
                </button>
              </div>

              <form onSubmit={handleManageFunds} className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative z-10">
                <div>
                  <label className="label">Wallet</label>
                  <select id="manage-funds-wallet" className="input" value={manageForm.wallet}
                    onChange={e => setManageForm({...manageForm, wallet: e.target.value})}>
                    <option value="cash">💵 Cash</option>
                    <option value="upi">📱 UPI</option>
                  </select>
                </div>
                <div>
                  <label className="label">Amount (₹)</label>
                  <input id="manage-funds-amount" type="number" className="input" placeholder="0.00" min="1" step="0.01" required
                    value={manageForm.amount} onChange={e => setManageForm({...manageForm, amount: e.target.value})} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">{manageAction === 'deposit' ? 'Source' : 'Category'}</label>
                  {manageAction === 'deposit' ? (
                    <input type="text" className="input" placeholder="Salary, Gift, Cash..." required
                      value={manageForm.sourceOrCategory} onChange={e => setManageForm({...manageForm, sourceOrCategory: e.target.value})} />
                  ) : (
                    <select className="input" required value={manageForm.sourceOrCategory}
                      onChange={e => setManageForm({...manageForm, sourceOrCategory: e.target.value})}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c._id} value={c.name}>{c.icon} {c.name}</option>)}
                    </select>
                  )}
                </div>
                <div className="sm:col-span-4 flex justify-between items-center mt-2">
                  <input type="text" className="input w-full max-w-sm text-sm py-2 mr-4" placeholder="Optional notes... (e.g., Grocery shopping at D-Mart)"
                      value={manageForm.notes} onChange={e => setManageForm({...manageForm, notes: e.target.value})} />
                  
                  <div className="flex gap-3">
                    <button type="button" className="btn-secondary" onClick={() => setShowManage(false)}>Cancel</button>
                    <button id="manage-funds-submit" type="submit" className={`flex items-center gap-2 ${manageAction === 'deposit' ? 'btn-success' : 'btn-danger'}`} disabled={managingFunds}>
                      {managingFunds ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (manageAction === 'deposit' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>)}
                      {manageAction === 'deposit' ? 'Add Funds' : 'Record Expense'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Transfer Between Wallets */}
          {showTransfer && (
            <div className="card animate-slide-up relative overflow-hidden border border-white/10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-primary-500/5 blur-[80px] rounded-full pointer-events-none" />
              <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                <ArrowLeftRight size={18} className="text-primary-400" />
                Transfer Between Wallets
              </h3>
              <form onSubmit={handleTransfer} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end relative z-10">
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
                  <button type="button" 
                    onClick={() => setForm({ ...form, from_wallet: form.to_wallet, to_wallet: form.from_wallet })}
                    className="p-2 rounded-full bg-primary-500/20 border border-primary-500/30 hover:bg-primary-500/40 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                    <ArrowLeftRight size={18} className="text-primary-400" />
                  </button>
                </div>
                <div>
                  <label className="label">To</label>
                  <select id="transfer-to" className="input" value={form.to_wallet}
                    onChange={e => {
                      const tw = e.target.value
                      setForm({ ...form, to_wallet: tw, from_wallet: tw === 'cash' ? 'upi' : 'cash' })
                    }}>
                    <option value="upi">📱 UPI</option>
                    <option value="cash">💵 Cash</option>
                  </select>
                </div>
                <div>
                  <label className="label">Amount (₹)</label>
                  <input id="transfer-amount" type="number" className="input" placeholder="0.00" min="1" step="0.01" required
                    value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="sm:col-span-4 flex justify-between items-center mt-2">
                  <div />
                  <div className="flex gap-3">
                    <button type="button" className="btn-secondary" onClick={() => setShowTransfer(false)}>Cancel</button>
                    <button id="transfer-submit" type="submit"
                      className="btn-primary flex items-center gap-2" disabled={submitting}>
                      {submitting
                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <ArrowLeftRight size={16} />}
                      Transfer Now
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Recent Transactions List */}
          <div className="card p-0 overflow-hidden">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Search size={18} className="text-primary-400" />
                Recent Transactions {activeWallet !== 'all' && <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 ml-2 capitalize">{activeWallet} Only</span>}
              </h3>
            </div>
            
            {loadingTxns ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : recentTxns.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                No recent transactions found for {activeWallet === 'all' ? 'any wallet' : activeWallet}.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentTxns.map((txn) => {
                  const uiType = transactionUiType(txn)
                  const cfg = typeConfig[uiType] || typeConfig.expense
                  const Icon = cfg.icon
                  const isCredit = isCreditUiType(uiType)
                  return (
                    <div key={txn._id} className="flex flex-wrap sm:flex-nowrap items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors">
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
                            {txn.wallet === 'cash' ? '💵' : '📱'} {displayCategoryForUi(txn.category) || txn.source || ''}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold ${isCredit ? 'text-emerald-400' : cfg.color}`}>
                          {isCredit ? '+' : '-'}{fmt(txn.amount)}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {txn.timestamp ? new Date(txn.timestamp).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : ''}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
