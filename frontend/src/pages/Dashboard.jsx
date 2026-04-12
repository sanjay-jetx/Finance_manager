import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fmt } from '../utils/format'
import { useDashboard } from '../hooks/useDashboard'
import {
  Wallet, TrendingUp, Users, ArrowUpRight, ArrowDownRight,
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

const PIE_COLORS = ['#6366f1','#10b981','#f59e0b','#ec4899','#8b5cf6','#0ea5e9']

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
      <div className="w-full max-w-md mx-auto rounded-t-[32px] sm:rounded-[24px] bg-surface relative overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)] sm:shadow-soft-drop border border-white/10 animate-stagger-1 border-b-0 sm:border-b">
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
            className={`w-full py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 mt-4 transition-all overflow-hidden relative shadow-lg ${
              done ? 'bg-success text-white' : 
              isTransfer ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' :
              isIncome ? 'bg-gradient-success text-white' : 'bg-white text-black hover:bg-gray-200'
            } disabled:opacity-70 disabled:cursor-not-allowed`}>
            {done ? 'Saved!' : loading ? 'Processing...' : `Save ${type.charAt(0).toUpperCase() + type.slice(1)}`}

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
  goal_transfer:     { label:'Goal Save',class:'text-info',     bg:'bg-info/10 border-info/20', icon: Target },
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

      {/* Header */}
      <div className="flex items-center justify-between animate-stagger-1">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Welcome back, {user?.user_name?.split(' ')[0] || 'there'}!</h1>
          <p className="text-muted mt-1 font-medium">Here's your financial overview for the month.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={refresh}
            className="p-3 rounded-xl bg-surface border border-border text-muted hover:text-white transition-all shadow-sm">
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowQuickAdd(true)} className="btn-primary hidden sm:flex">
            <Plus size={16} /> New Transaction
          </button>
        </div>
      </div>



      {/* Main Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Balance Panel */}
        <div className="panel lg:col-span-2 p-8 lg:p-10 flex flex-col justify-between animate-stagger-1 relative overflow-hidden group border-accent/20">
          {/* Stunning Background Glow */}
          <div className="hidden lg:block absolute top-[-50%] right-[-10%] w-[80%] h-[150%] bg-accent/30 blur-[120px] rounded-full pointer-events-none group-hover:bg-accent/40 mix-blend-screen transition-all duration-700" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-primary shadow-[0_0_20px_rgba(99,102,241,0.8)]" />
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-accent uppercase tracking-widest mb-2 flex items-center gap-2">
                <Sparkles size={14} /> Total Balance
              </p>
              <h2 className="text-5xl lg:text-7xl font-display font-bold tracking-tighter text-gradient">{fmt(data?.total_balance)}</h2>
            </div>
            <div className="p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl">
              <Wallet size={28} className="text-white" />
            </div>
          </div>
          
          <div className="flex items-end justify-between mt-12 relative z-10">
            <div className="flex gap-8 lg:gap-16">
              <div>
                <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2">Cash Wallet</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center border border-success/20">
                    <Banknote size={14} className="text-success" />
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">{fmt(data?.cash_balance)}</p>
                </div>
              </div>
              <div className="w-px bg-white/10 hidden sm:block"></div>
              <div>
                <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2">UPI Wallet</p>
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center border border-info/20">
                    <Smartphone size={14} className="text-info" />
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">{fmt(data?.upi_balance)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Net Worth */}
        <div className="panel p-8 flex flex-col justify-between animate-stagger-2 cursor-pointer hover:border-success/40 group relative overflow-hidden"
          onClick={() => navigate('/receivables')}>
          
          <div className="hidden lg:block absolute bottom-[-30%] right-[-20%] w-[80%] h-[120%] bg-success/20 blur-[100px] rounded-full pointer-events-none group-hover:bg-success/30 mix-blend-screen transition-all duration-700" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="p-3 rounded-xl bg-success/10 border border-success/20 shadow-glow-success">
                <TrendingUp size={20} className="text-success" />
              </div>
              <ArrowUpRight size={20} className="text-muted group-hover:text-success transition-colors" />
            </div>
            <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-1.5">Net Worth</p>
            <p className="text-4xl font-display font-bold text-foreground tracking-tight group-hover:text-white transition-colors">{fmt(data?.net_worth)}</p>
          </div>
          <div className="border-t border-white/5 pt-5 mt-6">
            <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-1">To Receive</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-success">{fmt(data?.pending_amount)}</span>
              <span className="text-xs text-muted font-medium bg-black/50 px-2.5 py-1 rounded-full">{data?.pending_receivables_count || 0} active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard icon={ArrowDownRight} label="Spent This Month" value={fmt(data?.monthly_expense)} accentClass="text-danger" iconBg="bg-danger/10" delayIdx={2} />
        <StatCard icon={ArrowUpRight} label="Earned This Month" value={fmt(data?.monthly_income)} accentClass="text-success" iconBg="bg-success/10" delayIdx={2} />
        <StatCard icon={Zap} label="Savings Rate" value={`${data?.savings_rate ?? 0}%`} accentClass={savingsGood ? 'text-success' : 'text-warning'} iconBg={savingsGood ? 'bg-success/10' : 'bg-warning/10'} delayIdx={3} sub={savingsGood ? 'On track!' : 'Below 20% target'} />
        <StatCard icon={Target} label="Spent Today" value={fmt(data?.today_spending)} accentClass="text-info" iconBg="bg-info/10" delayIdx={3} sub={data?.top_category ? `Top: ${data.top_category}` : 'Great job!'} />
      </div>

      {/* Charts & Budgets */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Weekly Chart */}
        <div className="panel xl:col-span-2 p-8 animate-stagger-3">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-display font-bold text-foreground">Weekly Spending</h3>
            <span className="text-[11px] font-bold text-accent uppercase tracking-widest bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20">Last 7 days</span>
          </div>
          {(data?.weekly_spending || []).some(d => d.amount > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.weekly_spending} barSize={28}>
                <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="4 4" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill:'#a1a1aa', fontSize:12, fontWeight:500 }} dy={12} />
                <YAxis hide />
                <Tooltip content={<ChartTip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="amount" fill="#6366f1" radius={[6,6,0,0]}>
                  {data.weekly_spending.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="url(#colorUv)" />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-[260px] flex flex-col items-center justify-center text-muted border border-dashed border-white/10 rounded-2xl">
              <PieChartIcon size={32} className="mb-3 opacity-40 text-accent" />
              <p className="text-sm font-medium">No recent spending data</p>
            </div>
          )}
        </div>

        {/* Category Pie & Budgets */}
        <div className="space-y-6 lg:space-y-8 animate-stagger-4">
          <div className="panel p-8">
            <h3 className="text-lg font-display font-bold text-foreground mb-6">By Category</h3>
            {data?.category_breakdown?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RePie>
                  <Pie data={data.category_breakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3}>
                    {data.category_breakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#121214" strokeWidth={3} />)}
                  </Pie>
                  <Tooltip content={<ChartTip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
                  <Legend iconType="circle" iconSize={8} formatter={(v, entry) => <span className="text-foreground text-xs font-semibold ml-1.5">{v} <span className="text-muted ml-0.5 font-normal">{fmt(entry?.payload?.value)}</span></span>} />
                </RePie>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center border border-dashed border-white/10 rounded-2xl"><p className="text-sm font-medium text-muted">No data yet</p></div>
            )}
          </div>
          

        </div>
        
      </div>

      {/* Recent Activity */}
      <div className="animate-stagger-4 pt-4">
        <div className="flex items-center justify-between mb-5 px-1">
          <h3 className="text-xl font-display font-bold text-foreground">Recent Transactions</h3>
          <button onClick={() => navigate('/transactions')}
            className="text-muted text-sm hover:text-foreground font-semibold flex items-center gap-1.5 transition-colors">
            View all <ArrowRight size={16} />
          </button>
        </div>

        {data?.recent_transactions?.length > 0 ? (
          <div className="panel p-2 flex flex-col gap-1 bg-white/[0.02]">
            {data.recent_transactions.map((txn) => {
              const uiType = transactionUiType(txn)
              const cfg    = txnCfg[uiType] || txnCfg.expense
              const Icon   = cfg.icon
              const isCredit = isCreditUiType(uiType)
              
              return (
                <div key={txn._id} className="flex items-center gap-5 px-6 py-4 rounded-xl hover:bg-white/[0.06] hover:scale-[1.01] transition-all cursor-pointer group border border-transparent hover:border-white/10 hover:shadow-lg">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${cfg.bg} shadow-inner group-hover:scale-110 transition-transform`}>
                    <Icon size={20} className={cfg.class} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-semibold text-[15px] truncate group-hover:text-white transition-colors">
                      {txn.notes || txn.category || txn.source || cfg.label}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.class}`}>{cfg.label}</span>
                      <span className="text-muted/40">•</span>
                      <span className="text-muted text-xs font-medium">{txn.wallet === 'cash' ? 'Cash Wallet' : 'UPI Wallet'}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-display font-bold text-[17px] ${isCredit ? 'text-success drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'text-foreground'}`}>
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
        ) : (
          <div className="panel p-12 flex flex-col items-center justify-center text-center border-dashed">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 shadow-inner">
              <ArrowLeftRight size={24} className="text-muted" />
            </div>
            <p className="text-foreground font-display font-bold text-lg mb-1.5">No transactions yet</p>
            <p className="text-muted text-sm mb-6 max-w-sm">You haven't logged any income or expenses. Start tracking to see insights.</p>
            <button onClick={() => setShowQuickAdd(true)} className="btn-primary">
              <Plus size={16} /> Add First Transaction
            </button>
          </div>
        )}
      </div>

      {/* Floating Quick Add (Mobile) */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-[110px] right-6 z-40 w-16 h-16 rounded-full flex items-center justify-center text-white shadow-glow-accent lg:hidden active:scale-95 transition-transform"
        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>
    </div>
  )
}
