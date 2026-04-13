import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fmt } from '../utils/format'
import { useDashboard } from '../hooks/useDashboard'
import {
  Wallet, TrendingUp, Users, ArrowUpRight, ArrowDownRight, HandCoins,
  RefreshCw, Target, Plus, X, Check, Banknote, Smartphone,
  Zap, PieChart as PieChartIcon, Bell, Sparkles, ArrowRight, ArrowLeftRight
} from 'lucide-react'
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RePie, Pie, Cell, Legend, CartesianGrid
} from 'recharts'
import toast from 'react-hot-toast'
import api from '../api/axios'

const PIE_COLORS = ['#00FFA3', '#8B5CF6', '#38BDF8', '#F59E0B', '#F43F5E', '#A855F7']

/* ── Stat mini-card ─────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, accentClass, valueClass = 'text-foreground', delayIdx = 1, badge }) {
  return (
    <div className={`panel p-6 flex flex-col animate-stagger-${delayIdx} group`}>
      <div className="flex items-start justify-between relative z-10">
        <div className={`w-10 h-10 rounded bg-[#15161A] border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:border-white/10 transition-colors`}>
          <Icon size={14} className={accentClass} />
        </div>
        {badge && (
          <span className={`text-[9px] font-bold px-2.5 py-1 bg-[#15161A] rounded border border-white/5 uppercase tracking-[0.1em] font-display ${accentClass}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="mt-6 relative z-10">
        <p className="text-muted text-[10px] font-bold font-display uppercase tracking-[0.15em] mb-1">{label}</p>
        <p className={`obsidian-value text-2xl ${valueClass}`}>{value}</p>
        {sub && <p className={`text-[10px] mt-2 font-bold font-display uppercase tracking-[0.1em] ${accentClass || 'text-muted'}`}>{sub}</p>}
      </div>
    </div>
  )
}

/* ── Quick Add Modal ───────────────────────────────────────────────────────── */
const EXPENSE_CATS = ['Food & Dining','Transport','Shopping','Entertainment','Health','Bills & Utilities','Education','Travel','Groceries','Other', 'Person']
const INCOME_SRCS  = ['Pocket Money','Salary','Freelance','Business','Gift','Refund','Other']

function QuickAddModal({ onClose, onSuccess }) {
  const [type, setType]     = useState('income')
  const [amount, setAmount] = useState('')
  const [cat, setCat]       = useState('Food & Dining')
  const [src, setSrc]       = useState('Pocket Money')
  const [wallet, setWallet] = useState('upi')
  const [toWallet, setToWallet] = useState('cash')
  const [notes, setNotes]   = useState('')
  const [personName, setPersonName] = useState('')
  const [noDebit, setNoDebit]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)

  const isIncome = type === 'income'
  const isTransfer = type === 'transfer'

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return }
    if (isTransfer && wallet === toWallet) { toast.error('Cannot transfer to the same wallet'); return }
    
    setLoading(true)
    try {
      if (isTransfer) {
        await api.post('/transfer', { amount: amt, from_wallet: wallet, to_wallet: toWallet })
      } else if (!isIncome) {
        if (cat === 'Person') {
          if (!personName.trim()) { toast.error('Please enter the person\'s name'); setLoading(false); return; }
          await api.post('/lend', { person_name: personName, amount: amt, wallet, notes: notes || 'Lent money', no_debit: noDebit })
        } else {
          const res = await api.post('/expense', { amount: amt, category: cat, wallet, notes })
          if (res.data.budget_alert) toast(res.data.budget_alert, { icon: '⚠️' })
        }
      } else {
        await api.post('/income', { amount: amt, source: src, wallet, notes: notes || 'Added via dashboard' })
      }
      toast.success(`₹${amt.toLocaleString('en-IN')} ${type} recorded!`)
      setDone(true)
      setTimeout(() => { onSuccess(); onClose() }, 700)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-[#050505]/95 backdrop-blur-sm transition-all"
         onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md mx-auto panel !border-white/[0.08] relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)] animate-stagger-1 text-white p-6 sm:p-8 rounded-lg !bg-surface/90">
        
        <div className={`absolute top-0 left-0 w-1 h-full ${isIncome ? 'bg-accent' : isTransfer ? 'bg-purple-500' : 'bg-danger'}`} />

        <div className="flex items-center justify-between mb-6">
          <h3 className="obsidian-label text-foreground">LOG ACTIVITY</h3>
          <button onClick={onClose} className="p-1.5 rounded bg-[#15161A] border border-white/5 text-muted hover:text-foreground transition-colors"><X size={16} /></button>
        </div>

        <div className="flex p-1.5 bg-[#15161A] rounded-[4px] border border-white/5 mb-6 max-w-full relative line-clamp-1">
          <div className={`absolute top-1.5 bottom-1.5 w-[calc(33.33%-4px)] bg-[#1A1C21] rounded shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-300 ${type === 'income' ? 'translate-x-[0]' : type === 'expense' ? 'translate-x-[100%]' : 'translate-x-[200%]'}`} />
          <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 text-[10px] sm:text-[11px] uppercase tracking-widest font-bold z-10 transition-colors ${type === 'income' ? 'text-accent' : 'text-muted'}`}>Income</button>
          <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 text-[10px] sm:text-[11px] uppercase tracking-widest font-bold z-10 transition-colors ${type === 'expense' ? 'text-danger' : 'text-muted'}`}>Expense</button>
          <button type="button" onClick={() => setType('transfer')} className={`flex-1 py-3 text-[10px] sm:text-[11px] uppercase tracking-widest font-bold z-10 transition-colors ${type === 'transfer' ? 'text-purple-400' : 'text-muted'}`}>Transfer</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-3 ml-1 flex justify-between">Net Impact (₹)</label>
            <div className="relative group">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-xl group-focus-within:text-white">₹</span>
              <input type="number" min="1" step="0.01" autoFocus required placeholder="0.00"
                value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full bg-[#15161A] border border-white/5 rounded-lg py-4 pl-10 pr-5 text-white font-display text-2xl font-bold focus:outline-none focus:border-white/20 transition-all shadow-inner" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isTransfer ? (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-3 ml-1">From Vault</label>
                  <select className="w-full bg-[#15161A] border border-white/5 rounded-lg px-5 py-4 text-white text-sm font-display focus:outline-none focus:border-white/20 uppercase tracking-widest"
                    value={wallet} onChange={e => setWallet(e.target.value)}>
                    <option value="upi" className="bg-surface">UPI</option>
                    <option value="cash" className="bg-surface">CASH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-3 ml-1">To Vault</label>
                  <select className="w-full bg-[#15161A] border border-white/5 rounded-lg px-5 py-4 text-white text-sm font-display focus:outline-none focus:border-white/20 uppercase tracking-widest"
                    value={toWallet} onChange={e => setToWallet(e.target.value)}>
                    <option value="upi" className="bg-surface">UPI</option>
                    <option value="cash" className="bg-surface">CASH</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-3 ml-1">
                    {!isIncome ? 'Classification' : 'Source'}
                  </label>
                  <select value={!isIncome ? cat : src} onChange={e => !isIncome ? setCat(e.target.value) : setSrc(e.target.value)}
                    className="w-full bg-[#15161A] border border-white/5 rounded-lg px-4 py-4 text-white text-sm font-display focus:outline-none focus:border-white/20">
                    {(!isIncome ? EXPENSE_CATS : INCOME_SRCS).map(opt => <option key={opt} value={opt} className="bg-surface uppercase">{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-3 ml-1">Vault</label>
                  <select className="w-full bg-[#15161A] border border-white/5 rounded-lg px-5 py-4 text-white text-sm font-display focus:outline-none focus:border-white/20 uppercase tracking-widest"
                    value={wallet} onChange={e => setWallet(e.target.value)}>
                    <option value="upi" className="bg-surface">UPI</option>
                    <option value="cash" className="bg-surface">CASH</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {!isIncome && !isTransfer && cat === 'Person' && (
            <div className="p-5 rounded-lg bg-danger/5 border border-danger/20">
              <input type="text" placeholder="Person's Name" required value={personName} onChange={e => setPersonName(e.target.value)}
                className="w-full bg-[#15161A] border border-white/5 rounded-lg px-5 py-3 text-white text-sm focus:outline-none focus:border-danger font-display" />
              <label className="flex items-center gap-3 mt-4 cursor-pointer">
                <input type="checkbox" checked={noDebit} onChange={e => setNoDebit(e.target.checked)} className="w-5 h-5 rounded bg-[#15161A] border-white/20 text-danger" />
                <span className="text-xs font-bold font-display uppercase tracking-widest text-danger">Already Paid</span>
              </label>
            </div>
          )}

          {!isTransfer && (
            <div>
              <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-3 ml-1">Notes</label>
              <input type="text" placeholder="..." maxLength={80} value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full bg-[#15161A] border border-white/5 rounded-lg px-5 py-4 text-white text-sm focus:outline-none focus:border-white/20 font-display" />
            </div>
          )}

          <div className="flex justify-end gap-4 mt-2">
            <button type="button" onClick={onClose}
              className="px-8 py-3.5 rounded text-muted font-display uppercase font-bold text-[11px] tracking-widest hover:bg-white/5 transition-colors border border-white/5">
              Cancel
            </button>
            <button type="submit" disabled={loading || done}
              className={`btn-primary flex items-center justify-center gap-2 ${done ? 'bg-accent text-black' : isTransfer ? 'bg-purple-500 text-black shadow-none' : isIncome ? 'bg-accent text-black shadow-none' : 'bg-surface text-foreground border border-white/5 shadow-none hover:bg-white/5 hover:text-white'} disabled:opacity-70 flex-1`}>
              {done ? 'Saved!' : loading ? <span className="w-4 h-4 border-2 border-[currentColor]/30 border-t-[currentColor] rounded-full animate-spin" /> : `Commit Record`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Custom chart tooltip ──────────────────────────────────────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const displayLabel = label || payload[0]?.name
  return (
    <div className="bg-[#15161A] border border-white/5 rounded p-4 shadow-2xl min-w-[120px]">
      <p className="text-muted text-[10px] font-bold mb-2 uppercase tracking-widest font-display">{displayLabel}</p>
      <p className="obsidian-value text-xl text-foreground">{fmt(payload[0].value)}</p>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════════════════════ */
/* ── Dashboard Skeleton ─────────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 lg:space-y-8 pb-20 animate-stagger-1 w-full relative z-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
           <div className="h-10 w-72 bg-[#1C1E26] rounded relative overflow-hidden" />
           <div className="h-4 w-48 bg-[#1C1E26] rounded relative overflow-hidden" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-64 lg:col-span-2 bg-[#1C1E26] rounded-2xl relative overflow-hidden" />
        <div className="h-64 bg-[#1C1E26] rounded-2xl relative overflow-hidden" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-[#1C1E26] rounded-2xl relative overflow-hidden" />)}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, loading, refreshing, refresh, refetch } = useDashboard()
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  if (loading) return <DashboardSkeleton />

  const savingsGood = data?.savings_rate > 20

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 w-full relative z-10 font-sans">
      {showQuickAdd && <QuickAddModal onClose={() => setShowQuickAdd(false)} onSuccess={() => refetch(true)} />}

      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 animate-stagger-1">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-widest uppercase text-foreground">Overview</h1>
          <p className="obsidian-label mt-2">
             FINANCIAL INTELLIGENCE CENTER
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={refresh} className="panel px-4 py-3 bg-transparent hover:bg-white/5 border border-white/5 text-muted hover:text-foreground transition-colors flex items-center gap-3 font-display uppercase tracking-widest font-bold text-[10px] rounded h-[42px]">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Refresh Data</span>
          </button>
          
          <button onClick={() => setShowQuickAdd(true)} className="btn-primary flex items-center gap-2 h-[42px]">
            <Plus size={16} />
            Log Activity
          </button>
        </div>
      </div>

      {/* ── ROW 1: BALANCE OVERVIEW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-stagger-1 text-white">
        
        {/* Left Panel: Total Amount + Cash/UPI */}
        <div className="col-span-1 lg:col-span-2 panel p-8 lg:p-10 relative overflow-hidden min-h-[260px] flex flex-col justify-between border-l-4 border-l-accent">
           
           <div className="relative z-10 flex flex-col h-full justify-between">
             <div>
               <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2 text-accent">
                     <Target size={14} />
                     <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-display">Consolidated Vaults</span>
                  </div>
               </div>
               
               <div className="mb-4">
                  <h2 className="obsidian-value text-[54px] lg:text-[64px] leading-none text-foreground">
                     {fmt(data?.total_balance)}
                  </h2>
               </div>
             </div>

             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 lg:gap-12 mt-auto pt-6 border-t border-white/5 w-full">
               <div className="flex-1 w-full">
                 <p className="text-muted text-[10px] font-bold font-display uppercase tracking-[0.15em] mb-3">Cash Vault</p>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-[#15161A] border border-white/5 flex items-center justify-center flex-shrink-0">
                       <Banknote size={16} className="text-accent" />
                    </div>
                    <p className="obsidian-value text-2xl">{fmt(data?.cash_balance)}</p>
                 </div>
               </div>
               
               <div className="hidden sm:block flex-shrink-0 w-px h-12 bg-white/5"></div>
               
               <div className="flex-1 w-full">
                 <p className="text-muted text-[10px] font-bold font-display uppercase tracking-[0.15em] mb-3">UPI Platform</p>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-[#15161A] border border-white/5 flex items-center justify-center flex-shrink-0">
                       <Smartphone size={16} className="text-[#38BDF8]" />
                    </div>
                    <p className="obsidian-value text-2xl">{fmt(data?.upi_balance)}</p>
                 </div>
               </div>
             </div>
           </div>
        </div>

        {/* Right Panel: Net Worth + Receivables */}
        <div className="col-span-1 panel p-8 lg:p-10 relative overflow-hidden min-h-[260px] flex flex-col justify-between">
           <div className="relative z-10 flex flex-col h-full justify-between">
             <div>
               <div className="flex justify-between items-start mb-6 text-muted">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-display">Net Worth</span>
                  <ArrowUpRight size={14} />
               </div>
               
               <div>
                  <h2 className="obsidian-value text-[34px] leading-none text-foreground">
                     {fmt((data?.total_balance || 0) + (data?.pending_amount || 0))}
                  </h2>
               </div>
             </div>

             <div className="mt-auto pt-6 border-t border-white/5 border-dashed w-full">
                <p className="text-muted text-[10px] font-bold uppercase font-display tracking-[0.2em] mb-3">Pending Intel</p>
                <div className="flex items-center justify-between">
                   <p className="obsidian-value text-2xl text-accent">{fmt(data?.pending_amount)}</p>
                   {data?.pending_receivables_count > 0 && (
                      <span className="text-[9px] font-bold tracking-[0.1em] px-2.5 py-1 bg-[#15161A] border border-white/5 rounded font-display text-muted uppercase">
                         {data.pending_receivables_count} Active
                      </span>
                   )}
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* ── ROW 2: STAT CARDS (4 Columns) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-stagger-2">
        <StatCard 
          icon={ArrowDownRight} 
          label="Spent This Month" 
          value={fmt(data?.monthly_expense)} 
          accentClass="text-danger" 
          valueClass="text-foreground"
          delayIdx={1} 
        />
        <StatCard 
          icon={ArrowUpRight} 
          label="Earned This Month" 
          value={`+${fmt(data?.monthly_income)}`} 
          accentClass="text-success" 
          valueClass="text-success"
          delayIdx={2} 
        />
        <StatCard 
          icon={Zap} 
          label="Savings Rate" 
          value={`${data?.savings_rate ?? 0}%`} 
          sub={savingsGood ? "Metric OK" : "Sub-Optimal"}
          accentClass={savingsGood ? "text-accent" : "text-warning"}
          valueClass={savingsGood ? "text-accent" : "text-warning"}
          delayIdx={3} 
        />
        <StatCard 
          icon={ArrowDownRight} 
          label="Spent Today" 
          value={`-${fmt(data?.today_spending)}`} 
          sub="Last 24h Window"
          accentClass="text-muted" 
          valueClass="text-foreground"
          delayIdx={4} 
        />
      </div>

      {/* ── ROW 3: CHARTS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-stagger-3 mt-2">
        
        {/* Left Column (2 spans): Weekly Spending */}
        <div className="bg-[#0A0B0E] border border-white/5 col-span-1 xl:col-span-2 p-6 md:p-8 h-[440px] flex flex-col rounded-2xl">
          <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
             <h3 className="text-foreground font-bold tracking-widest text-[13px] uppercase font-display">Weekly Impact</h3>
             <span className="text-[9px] px-2.5 py-1 rounded border border-white/5 text-muted font-bold font-display uppercase tracking-[0.1em] bg-[#15161A]">LAST 7 DAYS</span>
          </div>
          <div className="flex-1 w-full min-h-0 pt-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.weekly_spending?.length ? data.weekly_spending : [{amount: 0, day: '-'}]} barSize={40} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <Tooltip content={<ChartTip />} cursor={{ fill:'rgba(255,255,255,0.02)' }} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#8B92A5', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                  dy={15}
                />
                <Bar dataKey="amount" fill="#00FFA3" radius={[2,2,0,0]}>
                  {(data?.weekly_spending || [{amount: 0}]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="url(#neonAccentTerminal)" />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="neonAccentTerminal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00FFA3" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#00FFA3" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column (1 span): Category Pie Chart */}
        <div className="bg-[#0A0B0E] border border-white/5 col-span-1 p-6 md:p-8 h-[440px] flex flex-col rounded-2xl">
          <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
             <h3 className="text-foreground font-bold tracking-widest text-[13px] uppercase font-display">Distribution</h3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center relative">
             <ResponsiveContainer width="100%" height="100%">
               <RePie>
                 <Pie 
                    data={data?.category_breakdown?.length ? data.category_breakdown : [{category:'Empty',amount:1}]} 
                    dataKey="amount" nameKey="category" cx="50%" cy="50%" 
                    innerRadius={80} outerRadius={105} paddingAngle={2} stroke="none"
                  >
                   {(data?.category_breakdown?.length ? data.category_breakdown : [{category:'Empty',amount:1}]).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                 </Pie>
                 {data?.category_breakdown?.length > 0 && <Tooltip content={<ChartTip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />}
               </RePie>
             </ResponsiveContainer>
             
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2">
               {data?.category_breakdown?.length > 0 && (
                  <>
                     <span className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1 font-display">{data.category_breakdown[0].category}</span>
                     <span className="obsidian-value text-xl text-foreground">₹{fmt(data.category_breakdown[0].amount)}</span>
                  </>
               )}
             </div>
             
             <div className="flex flex-col gap-3 mt-auto w-full pt-6">
                {data?.category_breakdown?.slice(0, 3).map((c, i) => (
                   <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2" style={{backgroundColor: PIE_COLORS[i % PIE_COLORS.length]}}></div>
                        <span className="text-[11px] text-muted font-bold tracking-widest uppercase font-display">{c.category}</span>
                      </div>
                      <span className="text-[13px] font-bold obsidian-value">{fmt(c.amount)}</span>
                   </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
