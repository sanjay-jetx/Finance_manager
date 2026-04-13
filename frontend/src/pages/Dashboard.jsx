import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fmt } from '../utils/format'
import { useDashboard } from '../hooks/useDashboard'
import {
  Wallet, TrendingUp, Users, ArrowUpRight, ArrowDownRight, HandCoins,
  Banknote, Smartphone, RefreshCw, Target, Plus, X, Check,
  Zap, PieChart as PieChartIcon, Bell, Sparkles, ArrowRight, ArrowLeftRight, CreditCard
} from 'lucide-react'
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RePie, Pie, Cell, Legend, CartesianGrid
} from 'recharts'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { transactionUiType, isCreditUiType } from '../utils/transactionsUi'

const PIE_COLORS = ['#6366F1', '#8B5CF6', '#10B981', '#3B82F6', '#F43F5E', '#F59E0B']

/* ── Stat mini-card ─────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, value, label, subtext, subcolorClass, isRed, isGreen, isBlue, delayIdx = 1 }) {
  const iconBg = isRed ? 'bg-rose-500/10 text-rose-400' : isGreen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400';
  
  return (
    <div className={`border border-[#1C1F2A] bg-[#12141D] rounded-[24px] p-6 flex flex-col justify-between min-h-[140px] animate-stagger-${delayIdx} hover:border-[#2A2E3D] transition-colors`}>
       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${iconBg}`}>
          <Icon size={18} strokeWidth={2.5} />
       </div>
       <div className="mt-4">
          <h3 className="text-[24px] lg:text-[26px] font-bold text-white tracking-tight">{value}</h3>
          <p className="text-[#8B92A5] text-[13px] font-medium mt-0.5">{label}</p>
          {subtext && <p className={`text-[12px] mt-2 font-medium ${subcolorClass}`}>{subtext}</p>}
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
    <div className="fixed inset-0 z-50 flex flex-col p-0 sm:p-4 bg-black/60 backdrop-blur-md transition-all justify-end sm:justify-center"
         onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md mx-auto rounded-t-[32px] sm:rounded-[24px] bg-[#12141D] border border-[#1C1F2A] relative overflow-hidden shadow-2xl animate-stagger-1 pb-4">
        <div className={`absolute top-0 left-0 right-0 h-1.5 sm:h-1 ${isIncome ? 'bg-emerald-500' : isTransfer ? 'bg-indigo-500' : 'bg-rose-500'}`} />
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-7 pb-5">
          <h2 className="text-white font-bold text-xl">Log Transaction</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-[#1C1F2A] text-[#8B92A5] hover:text-white transition-colors"><X size={18} /></button>
        </div>

        {/* Type toggle */}
        <div className="px-6 mb-6">
          <div className="flex p-1.5 bg-[#0A0D14] rounded-[16px] border border-[#1C1F2A] relative">
            <div className={`absolute top-1.5 bottom-1.5 w-[calc(33.33%-4px)] bg-[#1D2132] rounded-[12px] shadow-sm transition-all duration-300 ${type === 'income' ? 'translate-x-0' : type === 'expense' ? 'translate-x-full' : 'translate-x-[200%]'}`} />
            <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 rounded-xl text-sm font-bold z-10 transition-colors ${type === 'income' ? 'text-emerald-400' : 'text-[#8B92A5]'}`}>Income</button>
            <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 rounded-xl text-sm font-bold z-10 transition-colors ${type === 'expense' ? 'text-rose-400' : 'text-[#8B92A5]'}`}>Expense</button>
            <button type="button" onClick={() => setType('transfer')} className={`flex-1 py-2 rounded-xl text-sm font-bold z-10 transition-colors ${type === 'transfer' ? 'text-indigo-400' : 'text-[#8B92A5]'}`}>Transfer</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* Amount */}
          <div className="relative group">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8B92A5] font-bold text-xl group-focus-within:text-indigo-400 transition-colors">₹</span>
            <input type="number" min="1" step="0.01" autoFocus required placeholder="0.00"
              value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full bg-[#0A0D14] border border-[#1C1F2A] rounded-[16px] py-4 pl-10 pr-5 text-white text-2xl font-bold focus:outline-none focus:border-indigo-500 transition-all shadow-inner" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isTransfer ? (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-[#8B92A5] uppercase tracking-widest mb-2 ml-1">From</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setWallet('upi'); setToWallet('cash'); }} className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border transition-all ${wallet === 'upi' ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-400' : 'bg-[#0A0D14] border-[#1C1F2A] text-[#8B92A5]'}`}>UPI</button>
                    <button type="button" onClick={() => { setWallet('cash'); setToWallet('upi'); }} className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border transition-all ${wallet === 'cash' ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-400' : 'bg-[#0A0D14] border-[#1C1F2A] text-[#8B92A5]'}`}>CASH</button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#8B92A5] uppercase tracking-widest mb-2 ml-1">To</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setToWallet('upi'); setWallet('cash'); }} className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border transition-all ${toWallet === 'upi' ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-400' : 'bg-[#0A0D14] border-[#1C1F2A] text-[#8B92A5]'}`}>UPI</button>
                    <button type="button" onClick={() => { setToWallet('cash'); setWallet('upi'); }} className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border transition-all ${toWallet === 'cash' ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-400' : 'bg-[#0A0D14] border-[#1C1F2A] text-[#8B92A5]'}`}>CASH</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-[#8B92A5] uppercase tracking-widest mb-2 ml-1">
                    {!isIncome ? 'Category' : 'Source'}
                  </label>
                  <select value={!isIncome ? cat : src} onChange={e => !isIncome ? setCat(e.target.value) : setSrc(e.target.value)}
                    className="w-full bg-[#0A0D14] border border-[#1C1F2A] rounded-2xl px-4 py-3.5 text-white text-sm font-medium focus:outline-none focus:border-indigo-500 appearance-none">
                    {(!isIncome ? EXPENSE_CATS : INCOME_SRCS).map(opt => <option key={opt} value={opt} className="bg-[#12141D]">{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#8B92A5] uppercase tracking-widest mb-2 ml-1">Wallet</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setWallet('upi')}
                      className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border transition-all ${wallet === 'upi' ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400' : 'bg-[#0A0D14] border-[#1C1F2A] text-[#8B92A5]'}`}>
                      UPI
                    </button>
                    <button type="button" onClick={() => setWallet('cash')}
                      className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border transition-all ${wallet === 'cash' ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400' : 'bg-[#0A0D14] border-[#1C1F2A] text-[#8B92A5]'}`}>
                      CASH
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {!isIncome && !isTransfer && cat === 'Person' && (
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
              <input type="text" placeholder="Person's Name" required value={personName} onChange={e => setPersonName(e.target.value)}
                className="w-full bg-[#0A0D14] border border-[#1C1F2A] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-rose-500" />
              <label className="flex items-center gap-3 mt-3 cursor-pointer">
                <input type="checkbox" checked={noDebit} onChange={e => setNoDebit(e.target.checked)} className="w-4 h-4 rounded border-[#1C1F2A] bg-[#0A0D14] text-rose-500 focus:ring-rose-500" />
                <span className="text-xs font-medium text-rose-400/80">Already paid — don't deduct</span>
              </label>
            </div>
          )}

          {!isTransfer && (
            <div>
              <input type="text" placeholder="Add a note (optional)..." maxLength={80} value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full bg-[#0A0D14] border border-[#1C1F2A] rounded-2xl px-5 py-3.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          )}

          <button type="submit" disabled={loading || done}
            className={`w-full py-4 rounded-xl text-[13px] font-bold tracking-wide mt-4 transition-all shadow-lg ${
              done ? 'bg-emerald-500 text-black' : 
              'bg-indigo-500 text-white hover:bg-indigo-400'
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
    <div className="bg-[#12141D] border border-[#1C1F2A] rounded-xl p-3 shadow-xl min-w-[100px]">
      <p className="text-[#8B92A5] text-[10px] font-bold mb-1 uppercase tracking-widest">{displayLabel}</p>
      <p className="text-white font-bold text-lg">{fmt(payload[0].value)}</p>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════════════════════ */
/* ── Dashboard Skeleton ─────────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="w-full max-w-[1300px] mx-auto px-6 lg:px-10 pb-20 animate-stagger-1 pt-8">
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-3">
           <div className="h-8 w-64 bg-[#1A1D27] rounded-lg animate-pulse" />
           <div className="h-4 w-48 bg-[#1A1D27] rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="h-[280px] lg:col-span-2 bg-[#1A1D27] rounded-[32px] animate-pulse" />
        <div className="h-[280px] bg-[#1A1D27] rounded-[32px] animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-[140px] bg-[#1A1D27] rounded-[24px] animate-pulse" />)}
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
    <div className="w-full max-w-[1300px] mx-auto pb-24">
      {showQuickAdd && <QuickAddModal onClose={() => setShowQuickAdd(false)} onSuccess={() => refetch(true)} />}

      {/* ── TOP HEADER (IMAGE 2 STYLE) ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-5 px-6 lg:px-10 pt-8 lg:pt-10 animate-stagger-1">
        <div>
          <h1 className="text-3xl lg:text-[34px] font-bold text-white tracking-tight">Welcome back, {user?.user_name || 'sanjay'}!</h1>
          <p className="text-[#8B92A5] mt-2 text-[15px] font-medium">Here's your financial overview for the month.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refresh(true)} className="w-11 h-11 rounded-full bg-[#12141D] border border-[#1C1F2A] flex items-center justify-center text-[#8B92A5] hover:text-white hover:border-[#2A2E3D] transition-all shadow-sm">
            <RefreshCw size={18} strokeWidth={2.5} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowQuickAdd(true)} className="px-5 h-11 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-[14px] flex items-center gap-2 shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] transition-all">
            <Plus size={18} strokeWidth={2.5} />
            New Transaction
          </button>
        </div>
      </div>

      <div className="px-6 lg:px-10 space-y-6">
        
        {/* ── ROW 1: BALANCE & NET WORTH ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-stagger-1">
          
          {/* Total Balance Card */}
          <div className="col-span-1 lg:col-span-2 rounded-[32px] p-8 lg:p-10 relative overflow-hidden bg-gradient-to-br from-[#2E3155] to-[#1A1B2E] border border-indigo-500/20 shadow-lg">
            <div className="absolute top-[-40%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/20 blur-[90px] rounded-full pointer-events-none" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex items-center gap-2.5 text-indigo-300">
                 <Sparkles size={16} />
                 <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-200">Total Balance</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm shadow-inner flex items-center justify-center relative overflow-hidden border border-white/5">
                 <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                 <Wallet size={22} className="text-white relative z-10" />
              </div>
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
               <h2 className="text-[52px] lg:text-[64px] font-bold text-white tracking-tighter mb-8 leading-none">
                 {fmt(data?.total_balance)}
               </h2>
               
               <div className="flex items-center gap-12 mt-auto">
                 <div>
                   <p className="text-indigo-200/70 text-[10px] font-bold uppercase tracking-widest mb-2.5">Cash Wallet</p>
                   <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                         <Banknote size={12} className="text-emerald-400" />
                      </div>
                      <p className="text-white text-[22px] font-bold tracking-tight">{fmt(data?.cash_balance)}</p>
                   </div>
                 </div>
                 
                 <div className="w-px h-10 bg-white/10"></div>
                 
                 <div>
                   <p className="text-indigo-200/70 text-[10px] font-bold uppercase tracking-widest mb-2.5">UPI Wallet</p>
                   <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-[#38BDF8]/20 border border-[#38BDF8]/30 flex items-center justify-center">
                         <Smartphone size={12} className="text-[#38BDF8]" />
                      </div>
                      <p className="text-white text-[22px] font-bold tracking-tight">{fmt(data?.upi_balance)}</p>
                   </div>
                 </div>
               </div>
            </div>
          </div>

          {/* Net Worth Card (Split into Top / Bottom) */}
          <div className="col-span-1 border border-[#1C1F2A] bg-[#12141D] rounded-[32px] p-8 lg:p-10 flex flex-col relative overflow-hidden">
             
             {/* Net worth top section */}
             <div>
                <div className="flex justify-between items-start mb-6">
                   <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <TrendingUp size={20} className="text-emerald-400" />
                   </div>
                   <ArrowUpRight size={20} className="text-[#8B92A5]" />
                </div>
                <div>
                   <p className="text-[#8B92A5] text-[11px] font-bold uppercase tracking-widest mb-2">Net Worth</p>
                   <h2 className="text-[36px] font-bold text-white tracking-tight leading-none">{fmt((data?.total_balance || 0) + (data?.pending_amount || 0))}</h2>
                </div>
             </div>
             
             {/* To receive section */}
             <div className="mt-8 lg:mt-auto pt-6 border-t border-[#1C1F2A]">
                <p className="text-[#8B92A5] text-[10px] font-bold uppercase tracking-widest mb-3">To Receive</p>
                <div className="flex items-center gap-3">
                   <h3 className="text-[28px] font-bold text-emerald-400 leading-none">{fmt(data?.pending_amount)}</h3>
                   <span className="bg-[#1C1F2A] text-[#8B92A5] text-[11px] font-semibold px-2.5 py-1 rounded-lg">{(data?.pending_receivables_count || 0)} active</span>
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
            isRed 
            delayIdx={1} 
          />
          <StatCard 
            icon={ArrowUpRight} 
            label="Earned This Month" 
            value={fmt(data?.monthly_income)} 
            isGreen 
            delayIdx={2} 
          />
          <StatCard 
            icon={Zap} 
            label="Savings Rate" 
            value={`${data?.savings_rate ?? 0}%`} 
            subtext={savingsGood ? "On track!" : "Needs attention"}
            subcolorClass={savingsGood ? "text-emerald-400" : "text-rose-400"}
            isGreen={savingsGood} 
            isRed={!savingsGood}
            delayIdx={3} 
          />
          <StatCard 
            icon={Target} 
            label="Spent Today" 
            value={fmt(data?.today_spending)} 
            subtext={data?.today_food ? `Top: Food` : 'Last 24h'}
            subcolorClass="text-blue-400" 
            isBlue 
            delayIdx={4} 
          />
        </div>

        {/* ── ROW 3: CHARTS ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-stagger-3">
          
          {/* Weekly Spending */}
          <div className="xl:col-span-2 border border-[#1C1F2A] bg-[#12141D] rounded-[32px] p-6 lg:p-8 h-[380px] flex flex-col">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-white font-bold text-[16px]">Weekly Spending</h3>
               <span className="text-[#8B92A5] border border-[#1C1F2A] bg-[#0A0D14] text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full">Last 7 Days</span>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.weekly_spending?.length ? data.weekly_spending : [{amount: 0, day: '-'}]} barSize={28} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <Tooltip content={<ChartTip />} cursor={{ fill:'rgba(255,255,255,0.02)' }} />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#8B92A5', fontSize: 11, fontWeight: 600 }}
                    dy={10}
                  />
                  <Bar dataKey="amount" fill="#6366F1" radius={[6,6,6,6]}>
                    {(data?.weekly_spending || [{amount: 0}]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="url(#neonPurple)" />
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="neonPurple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Pie Chart */}
          <div className="col-span-1 border border-[#1C1F2A] bg-[#12141D] rounded-[32px] p-6 lg:p-8 h-[380px] flex flex-col">
            <h3 className="text-white font-bold text-[16px] mb-4">By Category</h3>
            <div className="flex-1 flex flex-col items-center justify-center relative">
               <ResponsiveContainer width="100%" height="100%">
                 <RePie>
                   <Pie 
                      data={data?.category_breakdown?.length ? data.category_breakdown : [{category:'Empty',amount:1}]} 
                      dataKey="amount" nameKey="category" cx="50%" cy="50%" 
                      innerRadius={80} outerRadius={110} paddingAngle={2} stroke="none"
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
                       <span className="text-[11px] text-[#8B92A5] uppercase tracking-widest font-bold">{data.category_breakdown[0].category}</span>
                       <span className="text-[20px] font-bold text-white mt-1">₹{fmt(data.category_breakdown[0].amount)}</span>
                    </>
                 )}
               </div>
               
               {/* Minimal Legend below Pie */}
               <div className="flex flex-wrap gap-4 items-center justify-center mt-auto pb-2 pt-6">
                  {data?.category_breakdown?.slice(0, 3).map((c, i) => (
                     <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: PIE_COLORS[i % PIE_COLORS.length]}}></div>
                        <span className="text-[11px] text-[#8B92A5] font-bold">{c.category}</span>
                     </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* ── ROW 4: RECENT TRANSACTIONS ── */}
        <div className="animate-stagger-4 pt-4">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-[#8B92A5] font-bold text-[12px] uppercase tracking-widest">Recent Transactions</h3>
            <button onClick={() => navigate('/transactions')} className="text-indigo-400 hover:text-indigo-300 font-semibold text-[13px] flex items-center gap-1.5 transition-colors">
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="bg-[#12141D] border border-[#1C1F2A] rounded-[32px] overflow-hidden shadow-sm">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-[#1C1F2A] text-[10px] font-bold uppercase tracking-widest text-[#8B92A5]">
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
                    <div key={txn._id} className={`grid grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-[#191C26] transition-colors border-b border-[#1C1F2A] ${idx === data.recent_transactions.length -1 ? 'border-b-0' : ''}`}>
                      <div className="col-span-8 lg:col-span-6 flex items-center gap-5">
                        <div className="w-12 h-12 rounded-[14px] bg-[#1C1F2A] flex items-center justify-center flex-shrink-0">
                          {isTransfer ? <RefreshCw size={16} className="text-[#8B92A5]" /> : isCredit ? <ArrowUpRight size={16} className="text-emerald-400"/> : <ArrowDownRight size={16} className="text-rose-400" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-bold text-[14px] truncate">{txn.notes || txn.category || txn.source || 'Transaction'}</p>
                          <p className="text-[#8B92A5] text-[12px] mt-1 font-medium">{txn.timestamp ? new Date(txn.timestamp).toLocaleString('en-US', {month:'short', day:'numeric', year:'numeric'}) : ''}</p>
                        </div>
                      </div>
                      
                      <div className="col-span-hidden lg:col-span-4 hidden lg:flex items-center">
                         <span className="text-[#8B92A5] text-[10px] uppercase tracking-widest font-bold bg-[#1C1F2A] px-3 py-1.5 rounded-lg border border-[#2A2E3D]">
                           {txn.category || txn.source || 'Transfer'}
                         </span>
                      </div>

                      <div className="col-span-4 lg:col-span-2 text-right">
                        <p className={`font-bold text-[16px] tracking-tight ${isCredit ? 'text-emerald-400' : 'text-white'}`}>
                          {isCredit ? '+' : '-'}{fmt(txn.amount)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-20 text-center text-[#8B92A5] font-bold text-[12px] tracking-widest uppercase border-dashed border-t border-[#1C1F2A]">No Recent Transactions</div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
