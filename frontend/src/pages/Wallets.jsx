import { useState } from 'react'
import api from '../api/axios'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import { ArrowDownRight, ArrowLeftRight, Banknote, RefreshCw, Smartphone, TrendingUp, TrendingDown, ArrowUpRight, Search, Plus, X, Users, Target } from 'lucide-react'
import { transactionUiType, isCreditUiType, displayCategoryForUi } from '../utils/transactionsUi'
import { useWallets } from '../hooks/useWallets'

const typeConfig = {
  expense:            { label: 'Expense',     color: 'text-danger',     bg: 'bg-danger/10 border-danger/20',     icon: ArrowDownRight },
  income:             { label: 'Income',      color: 'text-success',    bg: 'bg-success/10 border-success/20',   icon: ArrowUpRight },
  lend:               { label: 'You lent',    color: 'text-warning',    bg: 'bg-warning/10 border-warning/20',   icon: Users },
  debt_return:        { label: 'Received',    color: 'text-accent',     bg: 'bg-accent/10 border-accent/20',     icon: ArrowUpRight },
  receivable_return:  { label: 'Received',    color: 'text-accent',     bg: 'bg-accent/10 border-accent/20',     icon: ArrowUpRight },
  transfer:           { label: 'Transfer',    color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', icon: ArrowLeftRight },
  goal_transfer:      { label: 'Goal Save',   color: 'text-info',       bg: 'bg-info/10 border-info/20',         icon: Target },
}

export default function Wallets() {
  // ── Data from hook ──────────────────────────────────────────────────────
  const {
    balances, loading, recentTxns, loadingTxns,
    categories, activeWallet, setActiveWallet, refresh,
  } = useWallets()

  // ── UI-only state (forms / modals) ──────────────────────────────────────
  const [form, setForm]           = useState({ from_wallet: 'cash', to_wallet: 'upi', amount: '' })
  const [submitting, setSubmitting] = useState(false)
  const [manageAction, setManageAction] = useState('deposit')
  const [manageForm, setManageForm]     = useState({ wallet: 'cash', amount: '', sourceOrCategory: '', notes: '' })
  const [managingFunds, setManagingFunds] = useState(false)
  const [showManage, setShowManage]     = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)

  const handleTransfer = async (e) => {
    e.preventDefault()
    if (form.from_wallet === form.to_wallet) return toast.error('Select different wallets')
    setSubmitting(true)
    try {
      await api.post('/transfer', { from_wallet: form.from_wallet, to_wallet: form.to_wallet, amount: +form.amount })
      toast.success(`₹${form.amount} transferred!`)
      setForm({ ...form, amount: '' })
      refresh()
      setShowTransfer(false)
    } catch (err) { toast.error(err.response?.data?.detail || 'Transfer failed') }
    finally { setSubmitting(false) }
  }

  const handleManageFunds = async (e) => {
    e.preventDefault()
    setManagingFunds(true)
    try {
      if (manageAction === 'deposit') {
        await api.post('/income', { amount: +manageForm.amount, source: manageForm.sourceOrCategory || 'Top-up', wallet: manageForm.wallet, notes: manageForm.notes || `Added to ${manageForm.wallet}` })
        toast.success(`₹${manageForm.amount} added to ${manageForm.wallet}!`)
      } else {
        const res = await api.post('/expense', { amount: +manageForm.amount, category: manageForm.sourceOrCategory || 'Other', wallet: manageForm.wallet, notes: manageForm.notes || `Spent from ${manageForm.wallet}` })
        toast.success(`₹${manageForm.amount} spent from ${manageForm.wallet}!`)
        if (res.data.budget_alert) toast(res.data.budget_alert, { icon: '⚠️' })
      }
      setManageForm({ wallet: manageForm.wallet, amount: '', sourceOrCategory: '', notes: '' })
      setShowManage(false)
      refresh()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
    finally { setManagingFunds(false) }
  }

  const cashPct = balances.total_balance > 0 ? (balances.cash_balance / balances.total_balance) * 100 : 50
  const upiPct  = balances.total_balance > 0 ? (balances.upi_balance  / balances.total_balance) * 100 : 50

  return (
    <div className="space-y-6 lg:space-y-8 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-stagger-1">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">My Wallets</h1>
          <p className="text-muted mt-1 font-medium">Manage your cash and UPI balances</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => { setShowManage(!showManage); if(!showManage) setShowTransfer(false); }}
            className={`px-4 py-2 bg-surface hover:bg-white/5 border border-border text-muted hover:text-foreground transition-colors flex items-center gap-2 font-semibold text-sm rounded-xl ${showManage ? 'border-accent text-accent' : ''}`}>
            {showManage ? <X size={16} /> : <TrendingUp size={16} />} Manage Funds
          </button>
          <button onClick={() => { setShowTransfer(!showTransfer); if(!showTransfer) setShowManage(false); }}
            className={`px-4 py-2 bg-surface hover:bg-white/5 border border-border text-muted hover:text-foreground transition-colors flex items-center gap-2 font-semibold text-sm rounded-xl ${showTransfer ? 'border-accent text-accent' : ''}`}>
            {showTransfer ? <X size={16} /> : <ArrowLeftRight size={16} />} Transfer
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-[3px] border-accent/20 border-t-accent rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-stagger-2">
            {/* Cash */}
            <div onClick={() => setActiveWallet('cash')}
              className={`panel p-6 flex flex-col justify-between cursor-pointer transition-all ${activeWallet === 'cash' ? 'ring-1 ring-success border-success/50 bg-success/5' : 'hover:border-success/30'}`}>
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center">
                  <Banknote size={20} className="text-success" />
                </div>
                <span className="text-[10px] font-bold text-success px-2 py-0.5 rounded-full border border-success/20 uppercase tracking-widest bg-success/10">Cash</span>
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-foreground mb-1">{fmt(balances.cash_balance)}</p>
                <div className="flex items-center justify-between mt-4 mb-2"><p className="text-[10px] text-muted font-bold uppercase tracking-widest">Physical Cash</p><p className="text-[10px] text-success font-bold">{cashPct.toFixed(0)}%</p></div>
                <div className="h-1.5 bg-black/40 rounded-full border border-white/5 overflow-hidden">
                  <div className="bg-success h-full transition-all duration-1000 ease-out" style={{ width: `${cashPct}%` }} />
                </div>
              </div>
            </div>

            {/* UPI */}
            <div onClick={() => setActiveWallet('upi')}
              className={`panel p-6 flex flex-col justify-between cursor-pointer transition-all ${activeWallet === 'upi' ? 'ring-1 ring-info border-info/50 bg-info/5' : 'hover:border-info/30'}`}>
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-info/10 border border-info/20 flex items-center justify-center">
                  <Smartphone size={20} className="text-info" />
                </div>
                <span className="text-[10px] font-bold text-info px-2 py-0.5 rounded-full border border-info/20 uppercase tracking-widest bg-info/10">UPI</span>
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-foreground mb-1">{fmt(balances.upi_balance)}</p>
                <div className="flex items-center justify-between mt-4 mb-2"><p className="text-[10px] text-muted font-bold uppercase tracking-widest">Digital Banks</p><p className="text-[10px] text-info font-bold">{upiPct.toFixed(0)}%</p></div>
                <div className="h-1.5 bg-black/40 rounded-full border border-white/5 overflow-hidden">
                  <div className="bg-info h-full transition-all duration-1000 ease-out" style={{ width: `${upiPct}%` }} />
                </div>
              </div>
            </div>

            {/* Total */}
            <div onClick={() => setActiveWallet('all')}
              className={`panel p-6 flex flex-col justify-between cursor-pointer transition-all overflow-hidden ${activeWallet === 'all' ? 'ring-1 ring-accent border-accent/50 group' : 'hover:border-accent/30 group'}`}>
              <div className="absolute top-[-50%] right-[-10%] w-[80%] h-[150%] bg-accent/20 blur-[80px] pointer-events-none group-hover:bg-accent/30 transition-all duration-700" />
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <TrendingUp size={20} className="text-accent" />
                </div>
                <span className="text-[10px] font-bold text-accent px-2 py-0.5 rounded-full border border-accent/20 uppercase tracking-widest bg-accent/10">Total</span>
              </div>
              <div className="relative z-10">
                <p className="text-3xl font-display font-bold text-foreground mb-1">{fmt(balances.total_balance)}</p>
                <div className="flex items-center justify-between mt-4 mb-2"><p className="text-[10px] text-muted font-bold uppercase tracking-widest">Combined</p></div>
                <div className="h-1.5 bg-black/40 rounded-full border border-white/5 overflow-hidden flex">
                  <div className="bg-success h-full transition-all duration-1000 ease-out" style={{ width: `${cashPct}%` }} />
                  <div className="bg-info h-full transition-all duration-1000 ease-out" style={{ width: `${upiPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Manage Funds Form */}
          {showManage && (
            <div className="panel p-6 sm:p-8 animate-stagger-2 mt-6 relative overflow-hidden">
              <h3 className="text-foreground font-display font-bold text-xl mb-6">Manage Wallet Funds</h3>
              
              <div className="flex p-1.5 bg-black/40 rounded-[14px] border border-white/5 mb-6 max-w-sm relative">
                <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-surface rounded-xl border border-white/10 shadow-sm transition-all duration-300 ${manageAction === 'spend' ? 'translate-x-full' : 'translate-x-0'}`} />
                <button type="button" onClick={() => setManageAction('deposit')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold z-10 transition-colors ${manageAction === 'deposit' ? 'text-success' : 'text-muted'}`}>Deposit Money</button>
                <button type="button" onClick={() => setManageAction('spend')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold z-10 transition-colors ${manageAction === 'spend' ? 'text-danger' : 'text-muted'}`}>Record Expense</button>
              </div>

              <form onSubmit={handleManageFunds} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Wallet</label>
                  <select className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-medium focus:outline-none focus:border-accent"
                    value={manageForm.wallet} onChange={e => setManageForm({...manageForm, wallet: e.target.value})}>
                    <option value="cash" className="bg-surface">CASH</option>
                    <option value="upi" className="bg-surface">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Amount (₹)</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-lg group-focus-within:text-accent">₹</span>
                    <input type="number" min="1" step="0.01" required placeholder="0.00"
                      value={manageForm.amount} onChange={e => setManageForm({...manageForm, amount: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-[16px] py-3.5 pl-9 pr-4 text-white font-display text-lg font-bold focus:outline-none focus:border-accent focus:bg-accent/5 transition-all shadow-inner" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">{manageAction === 'deposit' ? 'Source' : 'Category'}</label>
                  {manageAction === 'deposit' ? (
                    <input type="text" className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm focus:outline-none focus:border-accent"
                      placeholder="Salary, Gift, Cash..." required value={manageForm.sourceOrCategory} onChange={e => setManageForm({...manageForm, sourceOrCategory: e.target.value})} />
                  ) : (
                    <select className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm focus:outline-none focus:border-accent"
                      required value={manageForm.sourceOrCategory} onChange={e => setManageForm({...manageForm, sourceOrCategory: e.target.value})}>
                      <option value="" className="bg-surface">Select Category</option>
                      {categories.map(c => <option key={c._id} value={c.name} className="bg-surface">{c.name}</option>)}
                    </select>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Notes (Optional)</label>
                  <input type="text" className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm focus:outline-none focus:border-accent"
                    placeholder="Optional notes..." value={manageForm.notes} onChange={e => setManageForm({...manageForm, notes: e.target.value})} />
                </div>

                <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                  <button type="button" className="px-6 py-3 border border-border rounded-xl text-muted font-bold hover:bg-white/5 transition-colors" onClick={() => setShowManage(false)}>Cancel</button>
                  <button type="submit" disabled={managingFunds} className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 ${manageAction === 'deposit' ? 'bg-gradient-success text-white text-black' : 'bg-white text-black hover:bg-gray-200'}`}>
                    {managingFunds ? <span className="w-4 h-4 border-2 border-[currentColor]/30 border-t-[currentColor] rounded-full animate-spin" /> : null}
                    {manageAction === 'deposit' ? 'Add Funds' : 'Record Expense'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Transfer Form */}
          {showTransfer && (
            <div className="panel p-6 sm:p-8 animate-stagger-2 mt-6 relative overflow-hidden">
               <h3 className="text-foreground font-display font-bold text-xl mb-6">Internal Transfer</h3>
               <form onSubmit={handleTransfer} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">From</label>
                    <select className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-medium focus:outline-none focus:border-accent"
                      value={form.from_wallet} onChange={e => { const fw = e.target.value; setForm({ ...form, from_wallet: fw, to_wallet: fw === 'cash' ? 'upi' : 'cash' }) }}>
                      <option value="cash" className="bg-surface">CASH</option>
                      <option value="upi" className="bg-surface">UPI</option>
                    </select>
                  </div>
                  <div className="md:col-span-1 flex items-center justify-center pb-[5px]">
                    <button type="button" onClick={() => setForm({ ...form, from_wallet: form.to_wallet, to_wallet: form.from_wallet })}
                      className="p-3 rounded-xl bg-surface border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer text-muted hover:text-white">
                      <ArrowLeftRight size={20} />
                    </button>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">To</label>
                    <select className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-medium focus:outline-none focus:border-accent"
                      value={form.to_wallet} onChange={e => { const tw = e.target.value; setForm({ ...form, to_wallet: tw, from_wallet: tw === 'cash' ? 'upi' : 'cash' }) }}>
                      <option value="upi" className="bg-surface">UPI</option>
                      <option value="cash" className="bg-surface">CASH</option>
                    </select>
                  </div>
                  <div className="md:col-span-7 mt-2">
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Amount (₹)</label>
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-lg group-focus-within:text-accent">₹</span>
                      <input type="number" min="1" step="0.01" required placeholder="0.00"
                        value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-[16px] py-3.5 pl-9 pr-4 text-white font-display text-lg font-bold focus:outline-none focus:border-accent focus:bg-accent/5 transition-all shadow-inner" />
                    </div>
                  </div>
                  <div className="md:col-span-7 flex justify-end gap-3 pt-4">
                    <button type="button" className="px-6 py-3 border border-border rounded-xl text-muted font-bold hover:bg-white/5 transition-colors" onClick={() => setShowTransfer(false)}>Cancel</button>
                    <button type="submit" disabled={submitting} className={`px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-white text-black hover:bg-gray-200 disabled:opacity-70`}>
                      {submitting ? <span className="w-4 h-4 border-2 border-[currentColor]/30 border-t-[currentColor] rounded-full animate-spin" /> : null}
                      Transfer Now
                    </button>
                  </div>
               </form>
            </div>
          )}

          {/* Recent TXNs */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-5 px-1 animate-stagger-3">
              <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">Recent Transactions</h3>
              {activeWallet !== 'all' && <span className="text-[10px] uppercase font-bold tracking-widest bg-white/10 text-muted px-2.5 py-1 rounded-full">{activeWallet} Wallet</span>}
            </div>

            {loadingTxns ? (
               <div className="flex justify-center py-10"><div className="w-6 h-6 border-[3px] border-accent/20 border-t-accent rounded-full animate-spin" /></div>
            ) : recentTxns.length === 0 ? (
              <div className="panel p-10 flex flex-col items-center justify-center text-center animate-stagger-3 border-dashed">
                <Search size={24} className="text-muted mb-3" />
                <p className="text-foreground font-display font-bold">No transactions found</p>
              </div>
            ) : (
              <div className="panel divide-y divide-border/50 animate-stagger-3">
                {recentTxns.map((txn) => {
                  const uiType = transactionUiType(txn)
                  const cfg = typeConfig[uiType] || typeConfig.expense
                  const Icon = cfg.icon
                  const isCredit = isCreditUiType(uiType)
                  return (
                    <div key={txn._id} className="flex flex-wrap sm:flex-nowrap items-center gap-4 px-6 py-5 hover:bg-surfaceHover transition-colors">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${cfg.bg} shadow-inner`}>
                        <Icon size={20} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-semibold text-[15px] truncate transition-colors">
                          {txn.notes || txn.source || txn.category || cfg.label}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                          <span className="text-muted/40">•</span>
                          <span className="text-muted text-xs font-medium">{txn.wallet === 'cash' ? 'Cash' : 'UPI'}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-display font-bold text-[17px] ${isCredit ? 'text-success' : 'text-foreground'}`}>
                          {isCredit ? '+' : '-'}{fmt(txn.amount)}
                        </p>
                        <p className="text-muted text-[11px] font-semibold mt-1 uppercase tracking-widest">
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
