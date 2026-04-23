import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fmt } from '../utils/format'
import { useDashboard } from '../hooks/useDashboard'
import {
  Wallet, TrendingUp, Users, ArrowUpRight, ArrowDownRight, HandCoins,
  RefreshCw, Target, Plus, X, Check, Banknote, Smartphone,
  Zap, PieChart as PieChartIcon, ArrowRight, ArrowLeftRight, TrendingDown
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
  PieChart as RePie, Pie, Cell, CartesianGrid
} from 'recharts'
import toast from 'react-hot-toast'
import api from '../api/axios'

const PIE_COLORS = ['#00FFA3', '#8B5CF6', '#38BDF8', '#F59E0B', '#F43F5E', '#A855F7']

/* ── Stat mini-card ─────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, accentClass, valueClass = 'text-foreground', delayIdx = 1, badge, onClick, borderClass }) {
  return (
    <div
      className={`panel p-6 flex flex-col animate-stagger-${delayIdx} group rounded outline outline-1 outline-white/[0.02] scan-line transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${borderClass || 'border-white/[0.04]'}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className={`w-10 h-10 rounded border flex items-center justify-center flex-shrink-0 border-white/5 bg-surface group-hover:border-white/10 transition-colors`}>
          <Icon size={16} className={accentClass} />
        </div>
        {badge && (
          <span className={`text-[9px] font-bold px-2 py-1 bg-surface rounded border border-white/10 uppercase tracking-[0.1em] font-display ${accentClass}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="mt-6 relative z-10 border-t border-white/[0.03] pt-4">
        <p className="text-muted text-[10px] font-bold font-display uppercase tracking-[0.15em] mb-2">{label}</p>
        <p className={`font-mono font-bold tracking-tight text-[22px] leading-none ${valueClass}`}>{value}</p>
        {sub && <p className={`text-[9px] mt-2 font-bold font-display uppercase tracking-widest ${accentClass || 'text-muted'}`}>{sub}</p>}
      </div>
    </div>
  )
}

/* ── Quick Add Modal ───────────────────────────────────────────────────────── */
const EXPENSE_CATS = ['Food','Petrol','Transport','Shopping','Entertainment','Health','Bills & Utilities','Education','Travel','Groceries','Snacks','Gym','Other']
const INCOME_SRCS  = ['Pocket Money','Salary','Freelance','Business','Gift','Refund','Other']

function QuickAddModal({ onClose, onSuccess }) {
  const [type, setType]     = useState('income')
  const [amount, setAmount] = useState('')
  const [cat, setCat]       = useState('Food')
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
          if (!personName.trim()) { toast.error('Enter the person\'s name'); setLoading(false); return; }
          await api.post('/lend', { person_name: personName, amount: amt, wallet, notes: notes || 'Lent money', no_debit: noDebit })
        } else {
          const res = await api.post('/expense', { amount: amt, category: cat, wallet, notes })
          if (res.data.budget_alert) toast(res.data.budget_alert, { icon: '⚠️' })
        }
      } else {
        await api.post('/income', { amount: amt, source: src, wallet, notes: notes || 'Added via dashboard' })
      }
      toast.success(`₹${amt.toLocaleString('en-IN')} ${type} recorded`)
      setDone(true)
      setTimeout(() => { onSuccess(); onClose() }, 600)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    } finally { setLoading(false) }
  }

  const typeColors = { income: 'bg-accent', expense: 'bg-danger', transfer: 'bg-purple-400' }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-[#050505]/95 backdrop-blur-sm"
         onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md mx-auto bg-[#0C0D10] border border-white/[0.06] rounded shadow-[0_24px_64px_rgba(0,0,0,0.8)] animate-stagger-1 text-white p-6 sm:p-8 relative overflow-hidden">
        
        <div className={`absolute top-0 left-0 w-full h-[2px] ${typeColors[type]}/70`} />
        <div className={`absolute top-0 left-0 w-1 h-full ${typeColors[type]}`} />

        <div className="flex items-center justify-between mb-6">
          <h3 className="obsidian-label text-foreground">RECORD TRANSACTION</h3>
          <button onClick={onClose} className="p-1.5 rounded bg-[#15161A] border border-white/5 text-muted hover:text-foreground transition-colors"><X size={15} /></button>
        </div>

        {/* Type Switcher */}
        <div className="flex p-1 bg-[#101115] rounded border border-white/5 mb-6 relative">
          <div className={`absolute top-1 bottom-1 w-[calc(33.33%-3px)] rounded bg-[#1A1C22] shadow transition-all duration-200 border border-white/5 ${
            type === 'income' ? 'left-1' : type === 'expense' ? 'left-[calc(33.33%+1px)]' : 'left-[calc(66.66%+1px)]'
          }`} />
          {['income','expense','transfer'].map(t => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`flex-1 py-2.5 text-[10px] uppercase tracking-[0.2em] font-bold font-display z-10 transition-colors ${
                type === t ? (t === 'income' ? 'text-accent' : t === 'expense' ? 'text-danger' : 'text-purple-400') : 'text-muted'
              }`}>{t}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount */}
          <div>
            <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-2.5 ml-1">Amount (₹)</label>
            <div className="relative group">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-2xl group-focus-within:text-white transition-colors">₹</span>
              <input type="number" min="1" step="0.01" autoFocus required placeholder="0.00"
                value={amount} onChange={e => setAmount(e.target.value)}
                className="obsidian-input pl-12 text-3xl font-mono font-bold py-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isTransfer ? (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-2.5 ml-1">From</label>
                  <select className="obsidian-select w-full" value={wallet} onChange={e => setWallet(e.target.value)}>
                    <option value="upi" className="bg-[#0B0C10]">UPI</option>
                    <option value="cash" className="bg-[#0B0C10]">CASH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-2.5 ml-1">To</label>
                  <select className="obsidian-select w-full" value={toWallet} onChange={e => setToWallet(e.target.value)}>
                    <option value="upi" className="bg-[#0B0C10]">UPI</option>
                    <option value="cash" className="bg-[#0B0C10]">CASH</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-2.5 ml-1">
                    {isIncome ? 'Source' : 'Category'}
                  </label>
                  <select value={isIncome ? src : cat} onChange={e => isIncome ? setSrc(e.target.value) : setCat(e.target.value)}
                    className="obsidian-select w-full">
                    {(isIncome ? INCOME_SRCS : EXPENSE_CATS).map(opt => <option key={opt} value={opt} className="bg-[#0B0C10]">{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-2.5 ml-1">Account</label>
                  <select className="obsidian-select w-full" value={wallet} onChange={e => setWallet(e.target.value)}>
                    <option value="upi" className="bg-[#0B0C10]">UPI</option>
                    <option value="cash" className="bg-[#0B0C10]">CASH</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {!isIncome && !isTransfer && cat === 'Person' && (
            <div className="p-5 rounded bg-danger/5 border border-danger/10">
              <input type="text" placeholder="Person's Name" required value={personName} onChange={e => setPersonName(e.target.value)}
                className="obsidian-input mb-4" />
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-[18px] h-[18px] rounded-[2px] border flex items-center justify-center transition-colors ${
                  noDebit ? 'bg-danger border-danger text-white' : 'bg-[#15161A] border-white/10 group-hover:border-white/30'
                }`}>
                  {noDebit && <Check size={12} strokeWidth={3} />}
                </div>
                <input type="checkbox" className="hidden" checked={noDebit} onChange={e => setNoDebit(e.target.checked)} />
                <span className="text-[10px] font-display uppercase tracking-widest font-bold text-muted">Already Paid (No wallet deduction)</span>
              </label>
            </div>
          )}

          {!isTransfer && (
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-2.5 ml-1">Notes (Optional)</label>
              <input type="text" placeholder="What's this for?" maxLength={80} value={notes} onChange={e => setNotes(e.target.value)}
                className="obsidian-input" />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-6 py-3 rounded text-muted font-display uppercase font-bold text-[10px] tracking-widest hover:bg-white/5 transition-colors border border-white/5">
              Abort
            </button>
            <button type="submit" disabled={loading || done}
              className={`flex-1 py-3 rounded font-display uppercase font-bold text-[11px] tracking-widest flex items-center justify-center gap-2 transition-all ${
                done ? 'bg-accent text-black' :
                isTransfer ? 'bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20' :
                isIncome ? 'bg-accent text-black hover:bg-accent/80' :
                'bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20'
              } disabled:opacity-70`}>
              {done ? 'Saved!' : loading ? <span className="w-4 h-4 border-2 border-[currentColor]/30 border-t-[currentColor] rounded-full animate-spin" /> : 'Commit Record'}
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
      <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
        <div className="space-y-3">
           <div className="h-8 w-64 bg-surface rounded relative overflow-hidden" />
           <div className="h-3 w-40 bg-surface rounded relative overflow-hidden" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-64 lg:col-span-2 bg-surface rounded relative overflow-hidden" />
        <div className="h-64 bg-surface rounded relative overflow-hidden" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-surface rounded relative overflow-hidden" />)}
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
      <div className="flex flex-wrap items-center justify-between gap-4 animate-stagger-1 border-b border-white/[0.05] pb-6">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-widest uppercase text-foreground">Overview</h1>
          <div className="flex items-center gap-2.5 mt-2">
             <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(0,255,163,0.8)]" />
             <p className="text-[10px] uppercase font-mono tracking-widest font-bold text-muted">Financial Intelligence Center</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={refresh} className="panel px-4 py-3 bg-transparent hover:bg-surface border border-white/5 text-muted hover:text-foreground flex items-center gap-3 font-display uppercase tracking-widest font-bold text-[10px] rounded h-[42px] transition-all">
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-accent' : ''} /> <span className="hidden sm:inline">Refresh Data</span>
          </button>
          
          <button onClick={() => setShowQuickAdd(true)} className="btn-primary flex items-center gap-2 h-[42px] rounded uppercase font-bold text-[11px] tracking-widest">
            <Plus size={14} />
            Commit Entry
          </button>
        </div>
      </div>

      {/* ── ROW 1: BALANCE OVERVIEW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 animate-stagger-1 text-white">
        
        {/* Left Panel: Total Amount + Cash/UPI (70%) */}
        <div className="col-span-1 lg:col-span-7 panel bg-surface/50 border border-white/[0.03] p-8 lg:p-10 relative overflow-hidden min-h-[260px] flex flex-col justify-between rounded outline outline-1 outline-white/[0.02] shadow-2xl">
           
           <div className="relative z-10 flex flex-col h-full justify-between">
             <div>
               <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                     <div className="bg-accent/10 border border-accent/20 p-2 rounded text-accent">
                        <Target size={14} />
                     </div>
                     <span className="text-[11px] font-bold uppercase tracking-[0.2em] font-display text-muted">System Balance</span>
                  </div>
               </div>
               
               <div className="mb-4">
                  <h2 className="font-mono text-[48px] lg:text-[56px] leading-none text-foreground font-bold tracking-tight">
                     {fmt(data?.total_balance)}
                  </h2>
               </div>
             </div>

             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 lg:gap-12 mt-auto pt-6 border-t border-white/5 w-full">
               <div className="flex-1 w-full relative">
                 <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent/50" />
                 <p className="text-muted text-[10px] font-bold font-display uppercase tracking-[0.15em] mb-3 ml-4">Cash Reserve</p>
                 <div className="flex items-center gap-4 ml-4">
                    <p className="font-mono font-bold text-2xl tracking-tight text-white">{fmt(data?.cash_balance)}</p>
                 </div>
               </div>
               
               <div className="hidden sm:block flex-shrink-0 w-px h-12 bg-white/5"></div>
               
               <div className="flex-1 w-full relative">
                 <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#38BDF8]/50" />
                 <p className="text-muted text-[10px] font-bold font-display uppercase tracking-[0.15em] mb-3 ml-4">Digi-Wallet (UPI)</p>
                 <div className="flex items-center gap-4 ml-4">
                    <p className="font-mono font-bold text-2xl tracking-tight text-white">{fmt(data?.upi_balance)}</p>
                 </div>
               </div>
             </div>
           </div>
        </div>

        {/* Right Panel: Net Worth + Receivables (30%) */}
        <div className="col-span-1 lg:col-span-3 panel bg-[#121318] border border-white/[0.03] p-8 lg:p-10 relative overflow-hidden min-h-[260px] flex flex-col justify-between rounded outline outline-1 outline-white/[0.02]">
           <div className="relative z-10 flex flex-col h-full justify-between">
             <div>
               <div className="flex justify-between items-start mb-6 text-muted">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] font-display">Net Worth Vector</span>
                  <div className="text-white/20"><ArrowUpRight size={16} /></div>
               </div>
               
               <div>
                  <h2 className="font-mono font-bold text-[36px] tracking-tight leading-none text-foreground">
                     {fmt((data?.total_balance || 0) + (data?.pending_amount || 0))}
                  </h2>
               </div>
             </div>

             <div className="mt-auto pt-6 border-t border-white/5 w-full">
                <p className="text-muted text-[10px] font-bold uppercase font-display tracking-[0.2em] mb-3">Pending Capital</p>
                <div className="flex items-center justify-between">
                   <p className="font-mono font-bold text-2xl tracking-tight text-accent">{fmt(data?.pending_amount)}</p>
                   {data?.pending_receivables_count > 0 && (
                      <span className="text-[10px] font-bold tracking-[0.1em] px-2.5 py-1 bg-surface border border-white/10 rounded font-display text-muted uppercase">
                         {data.pending_receivables_count} Active
                      </span>
                   )}
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* ── ROW 2: STAT CARDS (4 Columns) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 animate-stagger-2">
        <StatCard 
          icon={ArrowDownRight} 
          label="Monthly Outflow" 
          value={fmt(data?.monthly_expense)} 
          sub="This month's spending"
          accentClass="text-danger" 
          valueClass="text-foreground"
          borderClass="border-danger/10"
          delayIdx={1}
          onClick={() => navigate('/transactions', { state: { filterType: 'expense', period: 'month' } })}
        />
        <StatCard 
          icon={ArrowUpRight} 
          label="Monthly Inflow" 
          value={`+${fmt(data?.monthly_income)}`} 
          sub="This month's earnings"
          accentClass="text-accent" 
          valueClass="text-accent"
          borderClass="border-accent/10"
          delayIdx={2}
          onClick={() => navigate('/transactions', { state: { filterType: 'income', period: 'month' } })}
        />
        <StatCard 
          icon={Zap} 
          label="Savings Rate" 
          value={`${data?.savings_rate ?? 0}%`} 
          sub={savingsGood ? "Optimal Performance" : "Needs Attention"}
          accentClass={savingsGood ? "text-accent" : "text-warning"}
          valueClass={savingsGood ? "text-accent" : "text-warning"}
          borderClass={savingsGood ? "border-accent/10" : "border-warning/10"}
          delayIdx={3} 
        />
        <StatCard 
          icon={TrendingDown} 
          label="Today's Spend" 
          value={`-${fmt(data?.today_spending)}`} 
          sub="Rolling 24h window"
          accentClass="text-muted" 
          valueClass="text-foreground"
          delayIdx={4} 
        />
      </div>

      {/* ── ROW 3: CHARTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-5 animate-stagger-3 mt-2">
        
        {/* Left Column (70%): Weekly Spending */}
        <div className="panel bg-[#0B0C10] border border-white/[0.04] col-span-1 lg:col-span-7 p-6 md:p-8 h-[380px] flex flex-col rounded outline outline-1 outline-white/[0.02]">
          <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
             <h3 className="text-foreground font-bold tracking-widest text-[11px] uppercase font-display">Weekly Trajectory — Last 7 Days</h3>
             <span className="text-[9px] px-2.5 py-1 rounded border border-white/10 text-muted font-bold font-display uppercase tracking-[0.1em] bg-surface">Spending</span>
          </div>
          <div className="flex-1 w-full min-h-0 pt-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.weekly_spending?.length ? data.weekly_spending : [{amount: 0, day: '-'}]} barSize={28} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <Tooltip content={<ChartTip />} cursor={{ fill:'rgba(255,255,255,0.02)' }} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#8A8F98', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                  dy={12}
                />
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                <Bar dataKey="amount" fill="#00FFA3" radius={[2,2,0,0]}>
                  {(data?.weekly_spending || [{amount: 0}]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="url(#neonBar)" />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="neonBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00FFA3" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#00FFA3" stopOpacity={0.08}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column (30%): Category Pie */}
        <div className="panel bg-[#0B0C10] border border-white/[0.04] col-span-1 lg:col-span-3 p-6 md:p-8 h-[380px] flex flex-col rounded outline outline-1 outline-white/[0.02]">
          <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
             <h3 className="text-foreground font-bold tracking-widest text-[11px] uppercase font-display">Expense Split</h3>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
             {/* Donut chart — fixed height so cy/cx 50% are perfectly centred */}
             <div className="relative" style={{ height: 200 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <RePie>
                   <Pie
                      data={data?.category_breakdown?.length ? data.category_breakdown : [{category:'Empty',amount:1}]}
                      dataKey="amount" nameKey="category" cx="50%" cy="50%"
                      innerRadius={68} outerRadius={86} paddingAngle={3} stroke="none"
                   >
                     {(data?.category_breakdown?.length ? data.category_breakdown : [{category:'Empty',amount:1}]).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                   </Pie>
                   {data?.category_breakdown?.length > 0 && <Tooltip content={<ChartTip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />}
                 </RePie>
               </ResponsiveContainer>

               {/* Centre label — absolutely centred inside the fixed-height box */}
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 {data?.category_breakdown?.length > 0 && (
                   <>
                     <span className="text-[9px] text-muted uppercase tracking-widest font-bold mb-1 font-display">
                       {data.category_breakdown[0].category.substring(0, 10)}
                     </span>
                     <span className="font-mono font-bold tracking-tight text-lg text-foreground">
                       {fmt(data.category_breakdown[0].amount)}
                     </span>
                   </>
                 )}
               </div>
             </div>

             {/* Legend — outside the chart canvas, no interference */}
             <div className="flex flex-col gap-2.5 mt-auto w-full pt-4 border-t border-white/[0.04]">
                {data?.category_breakdown?.slice(0, 4).map((c, i) => (
                   <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-sm flex-shrink-0" style={{backgroundColor: PIE_COLORS[i % PIE_COLORS.length]}} />
                        <span className="text-[10px] text-muted font-bold tracking-[0.1em] uppercase font-display truncate max-w-[80px]">{c.category}</span>
                      </div>
                      <span className="text-[11px] font-bold font-mono text-white">{fmt(c.amount)}</span>
                   </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* ── ROW 4: RECENT ACTIVITY FEED ── */}
      {data?.recent_transactions?.length > 0 && (
        <div className="panel bg-[#0B0C10] border border-white/[0.04] p-6 md:p-8 animate-stagger-4 rounded outline outline-1 outline-white/[0.02]">
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <h3 className="text-foreground font-bold tracking-widest text-[11px] uppercase font-display">Recent Activity</h3>
            <button onClick={() => navigate('/transactions')} className="text-[9px] font-display font-bold uppercase tracking-widest text-muted hover:text-accent transition-colors flex items-center gap-1.5">
              View All <ArrowRight size={10} />
            </button>
          </div>
          <div className="flex flex-col divide-y divide-white/[0.03]">
            {data.recent_transactions.slice(0, 5).map((txn, i) => {
              const isInc = txn.type === 'income' || txn.type === 'debt_return' || txn.type === 'receivable_return'
              const isTransfer = txn.type === 'transfer'
              return (
                <div key={txn._id || i} className="flex items-center gap-4 py-3.5 table-row-hover">
                  <div className={`w-8 h-8 rounded flex-shrink-0 flex items-center justify-center border ${
                    isTransfer ? 'border-purple-500/20 bg-purple-500/5' :
                    isInc ? 'border-accent/20 bg-accent/5' :
                    'border-white/5 bg-surface'
                  }`}>
                    {isTransfer ? <ArrowLeftRight size={12} className="text-purple-400" /> :
                     isInc ? <ArrowUpRight size={12} className="text-accent" /> :
                     <ArrowDownRight size={12} className="text-muted" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-[12px] font-display font-semibold truncate">
                      {txn.notes || txn.source || txn.category || txn.type}
                    </p>
                    <p className="text-muted text-[10px] font-mono mt-0.5 opacity-60">
                      {txn.wallet === 'cash' ? 'Cash' : 'UPI'} · {txn.timestamp ? new Date(txn.timestamp).toLocaleDateString('en-US', {month: 'short', day: '2-digit'}) : ''}
                    </p>
                  </div>
                  <p className={`font-mono font-bold text-[14px] flex-shrink-0 ${
                    isInc ? 'text-accent' : isTransfer ? 'text-purple-400' : 'text-foreground'
                  }`}>
                    {isInc ? '+' : isTransfer ? '↔' : '-'}{fmt(txn.amount)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
