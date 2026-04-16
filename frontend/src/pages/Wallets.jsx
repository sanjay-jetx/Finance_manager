import { useState } from 'react'
import api from '../api/axios'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import { ArrowDownRight, ArrowLeftRight, Banknote, RefreshCw, Smartphone, TrendingUp, ArrowUpRight, Search, Plus, X, Users, Target, Layers } from 'lucide-react'
import { transactionUiType, isCreditUiType } from '../utils/transactionsUi'
import { useWallets } from '../hooks/useWallets'

const typeConfig = {
  expense:            { label: 'Expense',     color: 'text-foreground', bg: 'bg-surface/30 border border-white/[0.04]', icon: ArrowDownRight },
  income:             { label: 'Income',      color: 'text-accent',     bg: 'bg-accent/[0.02] border border-white/[0.04]',   icon: ArrowUpRight },
  lend:               { label: 'You lent',    color: 'text-warning',    bg: 'bg-surface/30 border border-white/[0.04]',   icon: Users },
  debt_return:        { label: 'Received',    color: 'text-accent',     bg: 'bg-accent/[0.02] border border-white/[0.04]',     icon: ArrowUpRight },
  receivable_return:  { label: 'Received',    color: 'text-accent',     bg: 'bg-accent/[0.02] border border-white/[0.04]',     icon: ArrowUpRight },
  transfer:           { label: 'Transfer',    color: 'text-purple-400', bg: 'bg-purple-500/[0.02] border border-purple-500/10', icon: ArrowLeftRight },
  goal_transfer:      { label: 'Goal Save',   color: 'text-info',       bg: 'bg-info/[0.02] border border-info/10',         icon: Target },
}

export default function Wallets() {
  const {
    balances, loading, recentTxns, loadingTxns,
    categories, activeWallet, setActiveWallet, refresh,
  } = useWallets()

  const [form, setForm]           = useState({ from_wallet: 'cash', to_wallet: 'upi', amount: '' })
  const [submitting, setSubmitting] = useState(false)
  const [manageAction, setManageAction] = useState('deposit')
  const [manageForm, setManageForm]     = useState({ wallet: 'cash', amount: '', sourceOrCategory: '', notes: '' })
  const [managingFunds, setManagingFunds] = useState(false)
  const [showManage, setShowManage]     = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)

  const handleTransfer = async (e) => {
    e.preventDefault()
    if (form.from_wallet === form.to_wallet) return toast.error('Select operational difference in wallets.')
    setSubmitting(true)
    try {
      await api.post('/transfer', { from_wallet: form.from_wallet, to_wallet: form.to_wallet, amount: +form.amount })
      toast.success(`₹${form.amount} transfer sequence complete.`)
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
        toast.success(`₹${manageForm.amount} routed to ${manageForm.wallet}.`)
      } else {
        const res = await api.post('/expense', { amount: +manageForm.amount, category: manageForm.sourceOrCategory || 'Other', wallet: manageForm.wallet, notes: manageForm.notes || `Spent from ${manageForm.wallet}` })
        toast.success(`₹${manageForm.amount} disbursed from ${manageForm.wallet}.`)
        if (res.data.budget_alert) toast(res.data.budget_alert, { icon: '⚠️' })
      }
      setManageForm({ wallet: manageForm.wallet, amount: '', sourceOrCategory: '', notes: '' })
      setShowManage(false)
      refresh()
    } catch (err) { toast.error(err.response?.data?.detail || 'Sequence Failed') }
    finally { setManagingFunds(false) }
  }

  const cashPct = balances.total_balance > 0 ? (balances.cash_balance / balances.total_balance) * 100 : 50
  const upiPct  = balances.total_balance > 0 ? (balances.upi_balance  / balances.total_balance) * 100 : 50

  return (
    <div className="space-y-6 lg:space-y-8 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-stagger-1">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-widest uppercase text-foreground">Operational Wallets</h1>
          <p className="obsidian-label mt-2">ACTIVE LIQUIDITY PROTOCOLS</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => { setShowManage(!showManage); if(!showManage) setShowTransfer(false); }}
            className={`panel px-4 py-3 bg-surface hover:bg-white/5 border border-white/[0.05] text-muted hover:text-white transition-colors flex items-center gap-3 font-display uppercase tracking-widest font-bold text-[10px] ${showManage ? 'border-accent text-accent' : ''}`}>
            {showManage ? <X size={14} /> : <TrendingUp size={14} />} Fund Control
          </button>
          <button onClick={() => { setShowTransfer(!showTransfer); if(!showTransfer) setShowManage(false); }}
            className={`panel px-4 py-3 bg-surface hover:bg-white/5 border border-white/[0.05] text-muted hover:text-white transition-colors flex items-center gap-3 font-display uppercase tracking-widest font-bold text-[10px] ${showTransfer ? 'border-accent text-accent' : ''}`}>
            {showTransfer ? <X size={14} /> : <ArrowLeftRight size={14} />} Relay Vector
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
              className={`panel relative p-6 flex flex-col justify-between cursor-pointer transition-all border ${activeWallet === 'cash' ? 'border-accent/40 bg-accent/[0.02]' : 'border-white/[0.05] hover:border-white/20'}`}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded border border-white/5 bg-[#0C0D10] flex items-center justify-center">
                        <Banknote size={16} className={activeWallet === 'cash' ? 'text-accent' : 'text-muted'} />
                    </div>
                    <span className="text-[10px] font-bold text-muted tracking-[0.2em] uppercase font-display">Reserves</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-1 bg-[#0C0D10] border border-white/[0.05] rounded uppercase tracking-[0.1em] font-display ${activeWallet === 'cash' ? 'text-accent border-accent/20' : 'text-muted'}`}>Physical</span>
              </div>
              <div className="relative">
                <p className={`font-mono font-bold tracking-tight text-3xl mb-1 ${activeWallet === 'cash' ? 'text-accent' : 'text-foreground'}`}>{fmt(balances.cash_balance)}</p>
                <div className="flex items-center justify-between mt-4 mb-2"><p className="text-[10px] text-muted font-bold font-display uppercase tracking-[0.2em]">Allocation</p><p className={`text-[10px] font-mono font-bold ${activeWallet === 'cash' ? 'text-accent' : 'text-muted'}`}>{cashPct.toFixed(0)}%</p></div>
                <div className="h-1 bg-[#0A0B0E] rounded border border-white/[0.02] overflow-hidden">
                  <div className={`${activeWallet === 'cash' ? 'bg-accent' : 'bg-muted'} h-full transition-all duration-1000 ease-out`} style={{ width: `${cashPct}%` }} />
                </div>
              </div>
            </div>

            {/* UPI */}
            <div onClick={() => setActiveWallet('upi')}
              className={`panel relative p-6 flex flex-col justify-between cursor-pointer transition-all border ${activeWallet === 'upi' ? 'border-accent/40 bg-accent/[0.02]' : 'border-white/[0.05] hover:border-white/20'}`}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded border border-white/5 bg-[#0C0D10] flex items-center justify-center">
                        <Smartphone size={16} className={activeWallet === 'upi' ? 'text-accent' : 'text-muted'} />
                    </div>
                    <span className="text-[10px] font-bold text-muted tracking-[0.2em] uppercase font-display">Linked Networks</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-1 bg-[#0C0D10] border border-white/[0.05] rounded uppercase tracking-[0.1em] font-display ${activeWallet === 'upi' ? 'text-accent border-accent/20' : 'text-muted'}`}>Digital</span>
              </div>
              <div className="relative">
                <p className={`font-mono font-bold tracking-tight text-3xl mb-1 ${activeWallet === 'upi' ? 'text-accent' : 'text-foreground'}`}>{fmt(balances.upi_balance)}</p>
                <div className="flex items-center justify-between mt-4 mb-2"><p className="text-[10px] text-muted font-bold font-display uppercase tracking-[0.2em]">Allocation</p><p className={`text-[10px] font-mono font-bold ${activeWallet === 'upi' ? 'text-accent' : 'text-muted'}`}>{upiPct.toFixed(0)}%</p></div>
                <div className="h-1 bg-[#0A0B0E] rounded border border-white/[0.02] overflow-hidden">
                  <div className={`${activeWallet === 'upi' ? 'bg-accent' : 'bg-muted'} h-full transition-all duration-1000 ease-out`} style={{ width: `${upiPct}%` }} />
                </div>
              </div>
            </div>

            {/* Total */}
            <div onClick={() => setActiveWallet('all')}
              className={`panel relative p-6 flex flex-col justify-between cursor-pointer transition-all border ${activeWallet === 'all' ? 'border-accent/40 bg-accent/[0.02]' : 'border-white/[0.05] hover:border-white/20'}`}>
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded border border-accent/20 bg-accent/10 flex items-center justify-center">
                        <Layers size={16} className="text-accent" />
                    </div>
                    <span className="text-[10px] font-bold text-accent tracking-[0.2em] uppercase font-display">Total Liquidity</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-1 bg-[#0C0D10] border border-white/[0.05] rounded uppercase tracking-[0.1em] font-display text-muted`}>Aggregate</span>
              </div>
              <div className="relative z-10">
                <p className={`font-mono font-bold tracking-tight text-3xl mb-1 text-foreground`}>{fmt(balances.total_balance)}</p>
                <div className="flex items-center justify-between mt-4 mb-2"><p className="text-[10px] text-muted font-bold font-display uppercase tracking-[0.2em]">Distribution</p></div>
                <div className="h-1 bg-[#0A0B0E] rounded border border-white/[0.02] overflow-hidden flex">
                  <div className="bg-muted h-full transition-all duration-1000 ease-out opacity-40" style={{ width: `${cashPct}%` }} />
                  <div className="bg-accent h-full transition-all duration-1000 ease-out" style={{ width: `${upiPct}%` }} />
                </div>
              </div>
            </div>
            
          </div>

          {/* Manage Funds Form */}
          {showManage && (
            <div className="panel p-6 sm:p-8 animate-stagger-2 mt-6 relative overflow-hidden bg-surface/80 backdrop-blur-3xl border border-white/[0.04] shadow-2xl rounded outline outline-1 outline-white/[0.02]">
              <div className={`absolute top-0 left-0 w-1 h-full ${manageAction === 'deposit' ? 'bg-accent' : 'bg-danger'}`} />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] font-display text-muted mb-6">INTELLIGENCE RECORD CONTROL</h3>
              
              <div className="flex p-1.5 bg-[#15161A] rounded-[4px] border border-white/5 mb-6 max-w-sm relative">
                <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#1A1C21] rounded shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-300 ${manageAction === 'spend' ? 'translate-x-full' : 'translate-x-0'}`} />
                <button type="button" onClick={() => setManageAction('deposit')} className={`flex-1 py-3 text-[11px] uppercase tracking-widest font-bold z-10 transition-colors ${manageAction === 'deposit' ? 'text-accent' : 'text-muted'}`}>Deposit</button>
                <button type="button" onClick={() => setManageAction('spend')} className={`flex-1 py-3 text-[11px] uppercase tracking-widest font-bold z-10 transition-colors ${manageAction === 'spend' ? 'text-danger' : 'text-muted'}`}>Expense</button>
              </div>

              <form onSubmit={handleManageFunds} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Operational Wallet</label>
                  <select className="w-full bg-[#15161A] border border-white/5 rounded py-4 px-5 text-white font-mono text-[14px] focus:outline-none focus:border-accent transition-all shadow-inner"
                    value={manageForm.wallet} onChange={e => setManageForm({...manageForm, wallet: e.target.value})}>
                    <option value="cash" className="bg-surface">RESERVES: CASH</option>
                    <option value="upi" className="bg-surface">NETWORK: UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Capital Output (₹)</label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-xl group-focus-within:text-white">₹</span>
                    <input type="number" min="1" step="0.01" required placeholder="0.00"
                      value={manageForm.amount} onChange={e => setManageForm({...manageForm, amount: e.target.value})}
                      className="w-full bg-[#15161A] border border-white/5 rounded py-4 pl-12 pr-5 text-white font-mono text-xl font-bold focus:outline-none focus:border-accent transition-all shadow-inner" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">{manageAction === 'deposit' ? 'Source Vector' : 'Category Classification'}</label>
                  {manageAction === 'deposit' ? (
                    <input type="text" className="w-full bg-[#15161A] border border-white/5 rounded py-4 px-5 text-white font-mono text-[14px] focus:outline-none focus:border-accent transition-all shadow-inner"
                      placeholder="Salary, Gift, Return..." required value={manageForm.sourceOrCategory} onChange={e => setManageForm({...manageForm, sourceOrCategory: e.target.value})} />
                  ) : (
                    <select className="w-full bg-[#15161A] border border-white/5 rounded py-4 px-5 text-white font-mono text-[14px] focus:outline-none focus:border-accent transition-all shadow-inner"
                      required value={manageForm.sourceOrCategory} onChange={e => setManageForm({...manageForm, sourceOrCategory: e.target.value})}>
                      <option value="" className="bg-surface">Awaiting Classification</option>
                      {categories.map(c => <option key={c._id} value={c.name} className="bg-surface">{c.name}</option>)}
                    </select>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Intelligence Data (Optional)</label>
                  <input type="text" className="w-full bg-[#15161A] border border-white/5 rounded py-4 px-5 text-white font-mono text-[14px] focus:outline-none focus:border-accent transition-all shadow-inner"
                    placeholder="Supplementary context..." value={manageForm.notes} onChange={e => setManageForm({...manageForm, notes: e.target.value})} />
                </div>

                <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                  <button type="button" className="px-8 py-3 rounded text-muted font-display uppercase font-bold text-[11px] tracking-widest hover:bg-white/5 transition-colors border border-white/5" onClick={() => setShowManage(false)}>Cancel</button>
                  <button type="submit" disabled={managingFunds} className={`btn-primary flex items-center justify-center gap-2 ${manageAction === 'deposit' ? 'bg-accent text-black shadow-none' : 'bg-surface text-foreground shadow-none border border-white/10 hover:bg-white/5'} disabled:opacity-70`}>
                    {managingFunds ? <span className="w-4 h-4 border-2 border-[currentColor]/30 border-t-[currentColor] rounded-full animate-spin" /> : null}
                    {manageAction === 'deposit' ? 'Commit Inflow' : 'Record Disbursement'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Transfer Form */}
          {showTransfer && (
            <div className="panel p-6 sm:p-8 animate-stagger-2 mt-6 relative overflow-hidden bg-surface/80 backdrop-blur-3xl border border-white/[0.04] shadow-2xl rounded outline outline-1 outline-white/[0.02]">
               <div className={`absolute top-0 left-0 w-1 h-full bg-purple-500`} />
               <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] font-display text-muted mb-6">LIQUIDITY RELAY PROTOCOL</h3>
               <form onSubmit={handleTransfer} className="grid grid-cols-1 md:grid-cols-7 gap-6 items-end">
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Origin Node</label>
                    <select className="w-full bg-[#15161A] border border-white/5 rounded py-4 px-5 text-white font-mono text-[14px] focus:outline-none focus:border-accent transition-all shadow-inner"
                      value={form.from_wallet} onChange={e => { const fw = e.target.value; setForm({ ...form, from_wallet: fw, to_wallet: fw === 'cash' ? 'upi' : 'cash' }) }}>
                      <option value="cash" className="bg-surface">RESERVES: CASH</option>
                      <option value="upi" className="bg-surface">NETWORK: UPI</option>
                    </select>
                  </div>
                  <div className="md:col-span-1 flex items-center justify-center pb-[5px]">
                    <button type="button" onClick={() => setForm({ ...form, from_wallet: form.to_wallet, to_wallet: form.from_wallet })}
                      className="p-3 rounded bg-[#101115] border border-white/5 hover:bg-white/5 transition-all text-muted hover:text-white mt-1">
                      <ArrowLeftRight size={20} />
                    </button>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Destination Node</label>
                    <select className="w-full bg-[#15161A] border border-white/5 rounded py-4 px-5 text-white font-mono text-[14px] focus:outline-none focus:border-accent transition-all shadow-inner"
                      value={form.to_wallet} onChange={e => { const tw = e.target.value; setForm({ ...form, to_wallet: tw, from_wallet: tw === 'cash' ? 'upi' : 'cash' }) }}>
                      <option value="upi" className="bg-surface">NETWORK: UPI</option>
                      <option value="cash" className="bg-surface">RESERVES: CASH</option>
                    </select>
                  </div>
                  <div className="md:col-span-7 mt-2">
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Relay Volume (₹)</label>
                    <div className="relative group">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-xl group-focus-within:text-white">₹</span>
                      <input type="number" min="1" step="0.01" required placeholder="0.00"
                        value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                        className="w-full bg-[#15161A] border border-white/5 rounded py-4 pl-12 pr-5 text-white font-mono text-xl font-bold focus:outline-none focus:border-accent transition-all shadow-inner" />
                    </div>
                  </div>
                  <div className="md:col-span-7 flex justify-end gap-3 pt-4">
                    <button type="button" className="px-8 py-3 rounded text-muted font-display uppercase font-bold text-[11px] tracking-widest hover:bg-white/5 transition-colors border border-white/5" onClick={() => setShowTransfer(false)}>Cancel</button>
                    <button type="submit" disabled={submitting} className={`btn-primary flex items-center justify-center gap-2 bg-surface text-foreground shadow-none border border-white/10 hover:border-purple-500/50 hover:bg-white/5 disabled:opacity-70`}>
                      {submitting ? <span className="w-4 h-4 border-2 border-[currentColor]/30 border-t-[currentColor] rounded-full animate-spin" /> : null}
                      Relay Now
                    </button>
                  </div>
               </form>
            </div>
          )}

          {/* Recent TXNs */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-5 animate-stagger-3">
              <h3 className="obsidian-label text-foreground">Recent Network Activity</h3>
              {activeWallet !== 'all' && <span className="text-[9px] font-bold uppercase tracking-[0.1em] font-display bg-[#0C0D10] border border-white/5 text-muted px-2 py-1 rounded">{activeWallet} Node</span>}
            </div>

            {loadingTxns ? (
               <div className="panel p-3 flex flex-col gap-2 animate-stagger-3 border-transparent">
               {[...Array(4)].map((_, i) => (
                 <div key={i} className="flex items-center gap-4 px-6 py-5 rounded border border-white/[0.02] bg-surface/20">
                   <div className="skeleton w-10 h-10 rounded flex-shrink-0" />
                   <div className="flex-1 space-y-2">
                     <div className="skeleton h-3 w-40" />
                     <div className="skeleton h-2 w-24" />
                   </div>
                 </div>
               ))}
             </div>
            ) : recentTxns.length === 0 ? (
              <div className="panel p-16 flex flex-col items-center justify-center text-center animate-stagger-3 border-dashed">
                <Search size={28} className="text-muted mb-4 opacity-50" />
                <p className="text-foreground font-display font-bold text-xl mb-2">No Records Detected</p>
                <p className="text-muted text-sm font-mono max-w-xs">Data streams for this wallet node are currently inactive.</p>
              </div>
            ) : (
              <div className="panel animate-stagger-3 mt-4">
                  <div className="grid grid-cols-12 gap-4 px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted font-display mb-2 border-b border-white/[0.02]">
                      <div className="col-span-12 sm:col-span-5 pl-2">Record Identifier</div>
                      <div className="hidden sm:flex sm:col-span-4">Classification</div>
                      <div className="hidden sm:block sm:col-span-3 text-right pr-2">Delta</div>
                  </div>
                  <div className="flex flex-col gap-2 px-4 pb-4 mt-2">
                  {recentTxns.map((txn) => {
                    const uiType = transactionUiType(txn)
                    const cfg = typeConfig[uiType] || typeConfig.expense
                    const Icon = cfg.icon
                    const isCredit = isCreditUiType(uiType)
                    
                    const boxStyle = uiType === 'transfer'
                      ? 'bg-purple-500/[0.02] border border-purple-500/10 hover:border-purple-500/30'
                      : isCredit
                      ? 'bg-accent/[0.02] border border-white/[0.04] hover:border-accent/40'
                      : 'bg-surface/30 border border-white/[0.04] hover:border-white/10';

                    return (
                      <div key={txn._id} className={`grid grid-cols-12 gap-4 px-4 py-4 rounded items-center transition-all relative group ${boxStyle}`}>
                        <div className="col-span-12 sm:col-span-5 flex items-center gap-4">
                          <div className={`w-10 h-10 rounded border bg-[#0A0B0E] flex items-center justify-center flex-shrink-0 ${isCredit ? 'border-accent/20' : 'border-white/5'}`}>
                            {uiType === 'transfer' ? <RefreshCw size={14} className="text-purple-400" /> : isCredit ? <ArrowUpRight size={14} className="text-accent" /> : <ArrowDownRight size={14} className="text-danger" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-foreground font-display font-semibold text-[13px] truncate">
                              {txn.notes || txn.source || txn.category || cfg.label}
                            </p>
                            <p className="text-muted text-[10px] mt-1 hidden sm:block font-mono tracking-widest">{txn.timestamp ? new Date(txn.timestamp).toLocaleDateString('en-US',{month:'short', day:'2-digit'}) : ''} • {txn.wallet === 'cash' ? 'Cash' : 'UPI'}</p>
                            <div className="sm:hidden flex items-center gap-2 mt-1">
                              <p className={`font-mono font-bold tracking-tight text-[15px] ${isCredit ? 'text-accent' : 'text-foreground'}`}>
                                {isCredit ? '+' : '-'}{fmt(txn.amount)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="hidden sm:flex sm:col-span-4 items-center">
                           <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded bg-[#0B0C10] border border-white/[0.05] font-display">
                             {cfg.label}
                           </span>
                        </div>

                        <div className="text-right hidden sm:block sm:col-span-3 pr-2">
                          <p className={`font-mono font-bold tracking-tight text-[15px] ${isCredit ? 'text-accent' : 'text-foreground'}`}>
                            {isCredit ? '+' : '-'}{fmt(txn.amount)}
                          </p>
                        </div>

                      </div>
                    )
                  })}
                  </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
