import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fmt } from '../utils/format'
import { useDashboard } from '../hooks/useDashboard'
import {
  Wallet, TrendingUp, Users, ArrowUpRight, ArrowDownRight, HandCoins,
  Banknote, Smartphone, RefreshCw, Target, Plus, X, Check,
  Zap, PieChart as PieChartIcon, Bell, Sparkles, ArrowRight, ArrowLeftRight
} from 'lucide-react'
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RePie, Pie, Cell, Legend, CartesianGrid
} from 'recharts'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { transactionUiType, isCreditUiType } from '../utils/transactionsUi'

const PIE_COLORS = ['#00FFA3', '#8B5CF6', '#F59E0B', '#38BDF8', '#F43F5E', '#A855F7']

/* ── Stat mini-card ─────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, accentClass, iconBg, delayIdx = 1, badge }) {
  return (
    <div className={`panel p-6 flex flex-col gap-4 animate-stagger-${delayIdx} group`}>
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-[14px] ${iconBg} shadow-inner`}>
          <Icon size={20} className={accentClass} />
        </div>
        {badge && (
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${iconBg} ${accentClass} border-[currentColor]/20 uppercase tracking-widest`}>
            {badge}
          </span>
        )}
      </div>
      <div className="mt-2">
        <p className="text-3xl font-display font-bold text-foreground tracking-tight group-hover:text-white transition-colors">{value}</p>
        <p className="text-sm font-medium text-muted mt-1">{label}</p>
        {sub && <p className={`text-xs mt-2 font-medium ${accentClass} opacity-90`}>{sub}</p>}
      </div>
    </div>
  )
}

/* ── Quick Add Modal ───────────────────────────────────────────────────────── */
const EXPENSE_CATS = ['Food', 'Gym', 'Petrol', 'Snacks', 'Shopping', 'Entertainment', 'Health', 'Person', 'Other']
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
    <div className="fixed inset-0 z-50 flex flex-col p-0 sm:p-4 bg-black/60 sm:bg-background/80 backdrop-blur-md transition-all justify-end sm:justify-center"
         onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md mx-auto rounded-t-[32px] sm:rounded-[24px] bg-surface/60 backdrop-blur-3xl relative overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-white/[0.08] animate-stagger-1 border-b-0 sm:border-b">
        <div className={`absolute top-0 left-0 right-0 h-1.5 sm:h-1 ${isIncome ? 'bg-gradient-success' : isTransfer ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-gradient-to-r from-rose-500 to-pink-600'}`} />
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-7 pb-5">
          <h2 className="text-foreground font-display font-bold text-xl">Log Transaction</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/5 text-muted hover:text-white transition-colors"><X size={18} /></button>
        </div>

        {/* Type toggle */}
        <div className="px-6 mb-6">
          <div className="flex p-1.5 bg-black/40 rounded-[14px] border border-white/5 relative">
            <div className={`absolute top-1.5 bottom-1.5 w-[calc(33.33%-4px)] bg-surface rounded-xl border border-white/10 shadow-sm transition-all duration-300 ${type === 'income' ? 'translate-x-0' : type === 'expense' ? 'translate-x-full' : 'translate-x-[200%]'}`} />
            <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 rounded-xl text-sm font-bold z-10 transition-colors ${type === 'income' ? 'text-success' : 'text-muted'}`}>Income</button>
            <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 rounded-xl text-sm font-bold z-10 transition-colors ${type === 'expense' ? 'text-danger' : 'text-muted'}`}>Expense</button>
            <button type="button" onClick={() => setType('transfer')} className={`flex-1 py-2 rounded-xl text-sm font-bold z-10 transition-colors ${type === 'transfer' ? 'text-purple-400' : 'text-muted'}`}>Transfer</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* Amount */}
          <div className="relative group">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-xl group-focus-within:text-accent transition-colors">₹</span>
            <input type="number" min="1" step="0.01" autoFocus required placeholder="0.00"
              value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-[16px] py-4 pl-10 pr-5 text-white font-display text-2xl font-bold focus:outline-none focus:border-accent focus:bg-accent/5 transition-all shadow-inner" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isTransfer ? (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">From</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setWallet('upi'); setToWallet('cash'); }} className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border transition-all ${wallet === 'upi' ? 'bg-purple-500/15 border-purple-500/50 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-black/50 border-white/10 text-muted'}`}>UPI</button>
                    <button type="button" onClick={() => { setWallet('cash'); setToWallet('upi'); }} className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border transition-all ${wallet === 'cash' ? 'bg-purple-500/15 border-purple-500/50 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-black/50 border-white/10 text-muted'}`}>CASH</button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">To</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setToWallet('upi'); setWallet('cash'); }} className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border transition-all ${toWallet === 'upi' ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-black/50 border-white/10 text-muted'}`}>UPI</button>
                    <button type="button" onClick={() => { setToWallet('cash'); setWallet('upi'); }} className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border transition-all ${toWallet === 'cash' ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-black/50 border-white/10 text-muted'}`}>CASH</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">
                    {!isIncome ? 'Category' : 'Source'}
                  </label>
                  <select value={!isIncome ? cat : src} onChange={e => !isIncome ? setCat(e.target.value) : setSrc(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-medium focus:outline-none focus:border-accent">
                    {(!isIncome ? EXPENSE_CATS : INCOME_SRCS).map(opt => <option key={opt} value={opt} className="bg-surface">{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Wallet</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setWallet('upi')}
                      className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border transition-all ${wallet === 'upi' ? 'bg-accent/15 border-accent text-accent shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-black/50 border-white/10 text-muted'}`}>
                      UPI
                    </button>
                    <button type="button" onClick={() => setWallet('cash')}
                      className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border transition-all ${wallet === 'cash' ? 'bg-accent/15 border-accent text-accent shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-black/50 border-white/10 text-muted'}`}>
                      CASH
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {!isIncome && !isTransfer && cat === 'Person' && (
            <div className="p-4 rounded-2xl bg-danger/5 border border-danger/20">
              <input type="text" placeholder="Person's Name" required value={personName} onChange={e => setPersonName(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-danger" />
              <label className="flex items-center gap-3 mt-3 cursor-pointer">
                <input type="checkbox" checked={noDebit} onChange={e => setNoDebit(e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-black text-danger focus:ring-danger" />
                <span className="text-xs font-medium text-danger/80">Already paid — don't deduct</span>
              </label>
            </div>
          )}

          {!isTransfer && (
            <div>
              <input type="text" placeholder="Add a note (optional)..." maxLength={80} value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
          )}

          <button type="submit" disabled={loading || done}
            className={`w-full py-4 rounded font-display tracking-widest uppercase text-[12px] font-bold flex flex-col items-center justify-center gap-1 mt-4 transition-all shadow-lg ${
              done ? 'bg-success text-black' : 
              isIncome ? 'bg-accent text-black hover:bg-accent-light' : 'bg-[#1C1E26] text-white border border-white/10 hover:border-white/20'
            } disabled:opacity-70 disabled:cursor-not-allowed`}>
            {done ? 'Saved!' : loading ? 'Processing...' : `Save ${type}`}

          </button>
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
    <div className="bg-background/95 backdrop-blur border border-white/10 rounded-xl p-3 shadow-soft-drop min-w-[100px]">
      <p className="text-muted text-xs font-semibold mb-1 uppercase tracking-widest">{displayLabel}</p>
      <p className="text-foreground font-display font-bold text-lg">{fmt(payload[0].value)}</p>
    </div>
  )
}

/* ── Transaction Config ───────────────────────────────────────────────── */
const txnCfg = {
  expense:           { label:'Expense',  class:'text-danger',   bg:'bg-danger/10 border-danger/20', icon: ArrowDownRight },
  income:            { label:'Income',   class:'text-success',  bg:'bg-success/10 border-success/20', icon: ArrowUpRight },
  lend:              { label:'You lent', class:'text-warning',  bg:'bg-warning/10 border-warning/20', icon: Users },
  debt_return:       { label:'Received', class:'text-accent',   bg:'bg-accent/10 border-accent/20', icon: ArrowUpRight },
  receivable_return: { label:'Received', class:'text-accent',   bg:'bg-accent/10 border-accent/20', icon: ArrowUpRight },
  transfer:          { label:'Transfer', class:'text-purple-400', bg:'bg-purple-500/10 border-purple-500/20', icon: RefreshCw },
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════════════════════ */
/* ── Dashboard Skeleton ─────────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 lg:space-y-8 pb-20 animate-stagger-1">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-9 w-64" />
          <div className="skeleton h-4 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="skeleton h-52 lg:col-span-2" />
        <div className="skeleton h-52" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="skeleton h-80 xl:col-span-2" />
        <div className="skeleton h-80" />
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
    <div className="space-y-6 lg:space-y-8 pb-20">
      {showQuickAdd && <QuickAddModal onClose={() => setShowQuickAdd(false)} onSuccess={() => refetch(true)} />}

      {/* ── ROW 1: BALANCE OVERVIEW (Based on Screenshot) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-stagger-1 text-white">
        
        {/* Left Panel: Total Amount + Cash/UPI (Takes 2 columns) */}
        <div className="panel col-span-1 lg:col-span-2 p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#12162A]/80 to-[#0A0D18]/90">
           <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full" />
           <div className="z-10">
              <h2 className="text-6xl lg:text-[80px] font-display font-bold tracking-tighter drop-shadow-md text-white mb-10 mt-2">
                 {fmt(data?.total_balance)}
              </h2>
              
              <div className="flex items-center gap-8 lg:gap-14 border-t border-white/10 pt-6 mt-auto">
                 <div className="flex-1">
                    <p className="obsidian-label text-[10px] text-muted uppercase tracking-widest font-bold mb-2">CASH WALLET</p>
                    <div className="flex items-center gap-3">
                       <div className="w-6 h-6 rounded bg-success/20 flex items-center justify-center border border-success/30"><Banknote size={12} className="text-success" /></div>
                       <p className="obsidian-value text-2xl font-bold">{fmt(data?.cash_balance)}</p>
                    </div>
                 </div>
                 
                 <div className="w-px h-12 bg-white/10"></div>
                 
                 <div className="flex-1">
                    <p className="obsidian-label text-[10px] text-muted uppercase tracking-widest font-bold mb-2">UPI WALLET</p>
                    <div className="flex items-center gap-3">
                       <div className="w-6 h-6 rounded bg-[#38BDF8]/20 flex items-center justify-center border border-[#38BDF8]/30"><Smartphone size={12} className="text-[#38BDF8]" /></div>
                       <p className="obsidian-value text-2xl font-bold">{fmt(data?.upi_balance)}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Panel: Net Worth + Receivables (Takes 1 column) */}
        <div className="panel col-span-1 p-8 lg:p-10 flex flex-col relative overflow-hidden bg-gradient-to-br from-[#10141A]/90 to-[#090C10]/90">
           <div className="absolute -top-10 -right-10 w-64 h-64 bg-accent/5 blur-[80px] pointer-events-none rounded-full" />
           <div className="z-10 flex-col flex h-full">
             <div className="mb-10">
               <p className="text-white/60 text-[10px] uppercase tracking-widest font-bold font-display mb-3">CONSOLIDATED NET WORTH</p>
               <h2 className="text-4xl lg:text-5xl font-display font-bold tracking-tight text-white">
                 {fmt((data?.total_balance || 0) + (data?.pending_amount || 0))}
               </h2>
             </div>
             
             <div className="mt-auto border-t border-white/10 pt-6 flex flex-col items-start gap-1">
                <p className="text-white/60 text-[10px] uppercase tracking-widest font-bold font-display mb-2">TO RECEIVE</p>
                <div className="flex items-end gap-3 h-full">
                   <p className="obsidian-value text-3xl font-bold text-[#00FFA3]">{fmt(data?.pending_amount)}</p>
                   <span className="text-[10px] px-2 py-1 bg-white/5 rounded text-muted mb-1">{data?.pending_receivables_count || 0} active</span>
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
          accentClass="text-[#FF3366]" 
          iconBg="bg-[#FF3366]/10" 
          delayIdx={1} 
        />
        <StatCard 
          icon={ArrowUpRight} 
          label="Earned This Month" 
          value={fmt(data?.monthly_income)} 
          accentClass="text-[#00FFA3]" 
          iconBg="bg-[#00FFA3]/10" 
          delayIdx={2} 
        />
        <StatCard 
          icon={Zap} 
          label="Savings Rate" 
          value={`${data?.savings_rate ?? 0}%`} 
          sub={savingsGood ? "On track!" : "Needs attention"}
          accentClass={savingsGood ? "text-[#00FFA3]" : "text-warning"}
          iconBg={savingsGood ? "bg-[#00FFA3]/10" : "bg-warning/10"}
          delayIdx={3} 
        />
        <StatCard 
          icon={Target} 
          label="Spent Today" 
          value={fmt(data?.today_spending)} 
          sub="Last 24h"
          accentClass="text-[#38BDF8]" 
          iconBg="bg-[#38BDF8]/10" 
          delayIdx={4} 
        />
      </div>

      {/* ── ROW 3: CHARTS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-stagger-3">
        
        {/* Left Column (2 spans): Weekly Spending */}
        <div className="panel col-span-1 xl:col-span-2 p-6 md:p-8 h-[360px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-white font-display font-bold tracking-wide">Weekly Spending</h3>
             <span className="text-[10px] px-3 py-1.5 rounded-full border border-indigo-500/30 text-indigo-400 font-display font-bold uppercase tracking-widest bg-indigo-500/5">Last 7 Days</span>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.weekly_spending?.length ? data.weekly_spending : [{amount: 0, day: '-'}]} barSize={24} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <Tooltip content={<ChartTip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666', fontSize: 10, fontFamily: 'Outfit' }}
                  dy={10}
                />
                <Bar dataKey="amount" fill="#8B5CF6" radius={[4,4,4,4]}>
                  {(data?.weekly_spending || [{amount: 0}]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="url(#neonPurple)" />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="neonPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column (1 span): Category Pie Chart */}
        <div className="panel col-span-1 p-6 md:p-8 h-[360px] flex flex-col">
          <h3 className="text-white font-display font-bold tracking-wide mb-2">By Category</h3>
          <div className="flex-1 flex flex-col items-center justify-center relative">
             <ResponsiveContainer width="100%" height="100%">
               <RePie>
                 <Pie 
                    data={data?.category_breakdown?.length ? data.category_breakdown : [{category:'Empty',amount:1}]} 
                    dataKey="amount" nameKey="category" cx="50%" cy="50%" 
                    innerRadius={70} outerRadius={95} paddingAngle={4} stroke="none"
                  >
                   {(data?.category_breakdown?.length ? data.category_breakdown : [{category:'Empty',amount:1}]).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                 </Pie>
                 {data?.category_breakdown?.length > 0 && <Tooltip content={<ChartTip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />}
               </RePie>
             </ResponsiveContainer>
             
             {/* Dynamic inner text for the largest category */}
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2">
               {data?.category_breakdown?.length > 0 && (
                  <>
                     <span className="text-[11px] text-muted font-display uppercase tracking-widest font-bold">{data.category_breakdown[0].category}</span>
                     <span className="text-lg font-bold text-white mt-1">₹{fmt(data.category_breakdown[0].amount)}</span>
                  </>
               )}
             </div>
             
             {/* Minimal Legend below Pie */}
             <div className="flex flex-wrap gap-4 items-center justify-center mt-auto pb-4 pt-4">
                {data?.category_breakdown?.slice(0, 3).map((c, i) => (
                   <div key={i} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: PIE_COLORS[i % PIE_COLORS.length]}}></div>
                      <span className="text-[10px] text-white/70 font-display font-bold">{c.category}</span>
                   </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: RECENT TRANSACTIONS ── */}
      <div className="animate-stagger-4 pt-6">
        <div className="flex items-center justify-between mb-5 px-1">
          <h3 className="obsidian-label text-muted">Recent Transactions</h3>
          <button onClick={() => navigate('/transactions')} className="obsidian-label text-accent hover:text-accent-light flex items-center gap-2 tracking-[0.2em] transition-colors border-b border-transparent hover:border-accent">
            View All
          </button>
        </div>

        <div className="panel">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted font-display">
            <div className="col-span-8 lg:col-span-6">Transaction Details</div>
            <div className="col-span-hidden lg:col-span-4 hidden lg:block">Category</div>
            <div className="col-span-4 lg:col-span-2 text-right">Amount</div>
          </div>

          {data?.recent_transactions?.length > 0 ? (
            <div className="flex flex-col">
              {data.recent_transactions.map((txn, idx) => {
                const uiType = transactionUiType(txn);
                const isCredit = isCreditUiType(uiType);
                const isTransfer = uiType === 'transfer';
                
                return (
                  <div key={txn._id} className={`grid grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] ${idx === data.recent_transactions.length -1 ? 'border-b-0' : ''}`}>
                    <div className="col-span-8 lg:col-span-6 flex items-center gap-5">
                      <div className="w-12 h-12 rounded bg-[#15161A] border border-white/5 flex items-center justify-center flex-shrink-0">
                        {isTransfer ? <RefreshCw size={16} className="text-muted" /> : isCredit ? <ArrowUpRight size={16} className="text-muted"/> : <ArrowDownRight size={16} className="text-muted" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-foreground font-display font-semibold text-[14px] truncate">{txn.notes || txn.category || txn.source || 'Transaction'}</p>
                        <p className="text-muted text-[11px] mt-1.5 font-medium tracking-wide">{txn.timestamp ? new Date(txn.timestamp).toLocaleString('en-US', {month:'short', day:'numeric', year:'numeric'}) : ''}</p>
                      </div>
                    </div>
                    
                    <div className="col-span-hidden lg:col-span-4 hidden lg:flex items-center">
                       <span className="text-muted text-[11px] uppercase tracking-widest font-bold bg-white/5 px-3 py-1.5 rounded">
                         {txn.category || txn.source || 'Transfer'}
                       </span>
                    </div>

                    <div className="col-span-4 lg:col-span-2 text-right">
                      <p className={`obsidian-value text-[16px] ${isCredit ? 'text-success' : 'text-foreground'}`}>
                        {isCredit ? '+' : '-'}{fmt(txn.amount)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-20 text-center text-muted font-display text-sm tracking-widest uppercase border-dashed border-t border-white/5">No Recent Transactions</div>
          )}
        </div>
      </div>

      {/* Floating Quick Add (Mobile) */}
      <button onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-[110px] right-6 z-40 w-14 h-14 rounded bg-accent flex items-center justify-center text-black shadow-glow-accent lg:hidden active:scale-95 transition-transform">
        <Plus size={24} strokeWidth={2.5} />
      </button>
    </div>
  )
}
