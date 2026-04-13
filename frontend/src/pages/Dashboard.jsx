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
import { transactionUiType, isCreditUiType } from '../utils/transactionsUi'

const PIE_COLORS = ['#8B5CF6', '#3B82F6', '#00FFA3', '#F59E0B', '#F43F5E', '#A855F7']

/* ── Stat mini-card ─────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, accentClass, iconBg, delayIdx = 1, badge }) {
  return (
    <div className={`bg-[#0A0B0E]/80 backdrop-blur-2xl border border-white/5 rounded-[24px] p-6 flex flex-col gap-4 animate-stagger-${delayIdx} group hover:border-white/10 hover:bg-[#0A0B0E] transition-all relative overflow-hidden`}>
      <div className="flex items-start justify-between relative z-10">
        <div className={`p-3 rounded-2xl ${iconBg}`}>
          <Icon size={20} className={accentClass} />
        </div>
        {badge && (
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${iconBg} border-[currentColor]/20 uppercase tracking-widest ${accentClass}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="mt-2 relative z-10">
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-sm font-medium text-[#8B92A5] mt-1">{label}</p>
        {sub && <p className={`text-[11px] mt-2 font-bold tracking-wide ${accentClass}`}>{sub}</p>}
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-[#050505]/90 backdrop-blur-sm transition-all"
         onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md mx-auto rounded-[32px] bg-[#0A0B0E] relative overflow-hidden shadow-2xl border border-white/10 animate-stagger-1 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-white/5">
          <h2 className="font-bold text-xl tracking-wide">Log Transaction</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 text-[#8B92A5] hover:text-white hover:bg-white/10 transition-colors"><X size={18} /></button>
        </div>

        {/* Type toggle */}
        <div className="px-8 mt-6 mb-6">
          <div className="flex p-1.5 bg-[#050505] rounded-2xl border border-white/5 relative">
            <div className={`absolute top-1.5 bottom-1.5 w-[calc(33.33%-4px)] bg-[#1A1D27] rounded-[14px] transition-all duration-300 ${type === 'income' ? 'translate-x-0' : type === 'expense' ? 'translate-x-[100%]' : 'translate-x-[200%]'}`} />
            <button type="button" onClick={() => setType('income')} className={`flex-1 py-2.5 rounded-[14px] text-xs font-bold uppercase tracking-widest z-10 transition-colors ${type === 'income' ? 'text-[#00FFA3]' : 'text-[#8B92A5]'}`}>Income</button>
            <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2.5 rounded-[14px] text-xs font-bold uppercase tracking-widest z-10 transition-colors ${type === 'expense' ? 'text-rose-400' : 'text-[#8B92A5]'}`}>Expense</button>
            <button type="button" onClick={() => setType('transfer')} className={`flex-1 py-2.5 rounded-[14px] text-xs font-bold uppercase tracking-widest z-10 transition-colors ${type === 'transfer' ? 'text-purple-400' : 'text-[#8B92A5]'}`}>Transfer</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
          {/* Amount */}
          <div className="relative group">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#8B92A5] font-bold text-xl">₹</span>
            <input type="number" min="1" step="0.01" autoFocus required placeholder="0.00"
              value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-white font-display text-3xl font-bold focus:outline-none focus:border-indigo-500 transition-all shadow-inner" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isTransfer ? (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-[#8B92A5] uppercase tracking-widest mb-2 ml-2">From</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setWallet('upi'); setToWallet('cash'); }} className={`flex-1 py-4 rounded-xl text-sm font-bold border transition-all ${wallet === 'upi' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-[#050505] border-white/5 text-[#8B92A5]'}`}>UPI</button>
                    <button type="button" onClick={() => { setWallet('cash'); setToWallet('upi'); }} className={`flex-1 py-4 rounded-xl text-sm font-bold border transition-all ${wallet === 'cash' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-[#050505] border-white/5 text-[#8B92A5]'}`}>CASH</button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#8B92A5] uppercase tracking-widest mb-2 ml-2">To</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setToWallet('upi'); setWallet('cash'); }} className={`flex-1 py-4 rounded-xl text-sm font-bold border transition-all ${toWallet === 'upi' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-[#050505] border-white/5 text-[#8B92A5]'}`}>UPI</button>
                    <button type="button" onClick={() => { setToWallet('cash'); setWallet('upi'); }} className={`flex-1 py-4 rounded-xl text-sm font-bold border transition-all ${toWallet === 'cash' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-[#050505] border-white/5 text-[#8B92A5]'}`}>CASH</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-[#8B92A5] uppercase tracking-widest mb-2 ml-2">
                    {!isIncome ? 'Category' : 'Source'}
                  </label>
                  <select value={!isIncome ? cat : src} onChange={e => !isIncome ? setCat(e.target.value) : setSrc(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-5 py-4 text-white text-sm font-bold focus:outline-none focus:border-indigo-500 appearance-none">
                    {(!isIncome ? EXPENSE_CATS : INCOME_SRCS).map(opt => <option key={opt} value={opt} className="bg-[#0A0B0E]">{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#8B92A5] uppercase tracking-widest mb-2 ml-2">Wallet</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setWallet('upi')}
                      className={`flex-1 py-4 rounded-xl text-sm font-bold border transition-all ${wallet === 'upi' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-[#050505] border-white/5 text-[#8B92A5]'}`}>
                      UPI
                    </button>
                    <button type="button" onClick={() => setWallet('cash')}
                      className={`flex-1 py-4 rounded-xl text-sm font-bold border transition-all ${wallet === 'cash' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-[#050505] border-white/5 text-[#8B92A5]'}`}>
                      CASH
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {!isIncome && !isTransfer && cat === 'Person' && (
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <input type="text" placeholder="Person's Name" required value={personName} onChange={e => setPersonName(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl px-5 py-3.5 text-white text-sm focus:outline-none focus:border-rose-500 font-bold" />
              <label className="flex items-center gap-3 mt-4 cursor-pointer">
                <input type="checkbox" checked={noDebit} onChange={e => setNoDebit(e.target.checked)} className="w-5 h-5 rounded bg-[#050505] border-white/20 text-rose-500" />
                <span className="text-xs font-bold text-rose-400">Already paid — don't deduct</span>
              </label>
            </div>
          )}

          {!isTransfer && (
            <div>
              <input type="text" placeholder="Add a note (optional)..." maxLength={80} value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:outline-none focus:border-indigo-500 font-bold" />
            </div>
          )}

          <button type="submit" disabled={loading || done}
            className={`w-full py-4.5 rounded-xl font-bold tracking-widest uppercase text-xs flex justify-center mt-2 transition-all shadow-lg py-4 ${
              done ? 'bg-indigo-500 text-white' : 
              'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/50'
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
    <div className="bg-[#0A0B0E] border border-indigo-500/20 rounded-xl p-4 shadow-2xl min-w-[120px]">
      <p className="text-[#8B92A5] text-[10px] font-bold mb-2 uppercase tracking-widest">{displayLabel}</p>
      <p className="text-white font-bold text-2xl">{fmt(payload[0].value)}</p>
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
           <div className="h-10 w-72 bg-[#1C1E26] rounded-xl relative overflow-hidden" />
           <div className="h-4 w-48 bg-[#1C1E26] rounded relative overflow-hidden" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-64 lg:col-span-2 bg-[#1C1E26] rounded-[32px] relative overflow-hidden" />
        <div className="h-64 bg-[#1C1E26] rounded-[32px] relative overflow-hidden" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-[#1C1E26] rounded-[24px] relative overflow-hidden" />)}
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

      {/* ── HEADER (FINTRACK MANAGER STYLE) ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between animate-stagger-1 text-white gap-4">
         <div>
            <h1 className="text-3xl font-bold tracking-tight text-white font-display">Welcome back, {user?.email?.split('@')[0] || 'User'}!</h1>
            <p className="text-[#8B92A5] text-sm mt-1.5 font-medium">Here's your financial overview for the month.</p>
         </div>
         <div className="flex items-center gap-3">
            <button onClick={refresh} className="w-10 h-10 rounded-full bg-[#0A0B0E] border border-white/5 flex items-center justify-center text-[#8B92A5] hover:text-white hover:bg-[#1E2235] transition-all">
               <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowQuickAdd(true)} className="px-5 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20">
               <Plus size={16} strokeWidth={3} />
               New Transaction
            </button>
         </div>
      </div>

      {/* ── ROW 1: BALANCE OVERVIEW (FinTrack Manager Layout) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-stagger-1 text-white">
        
        {/* Left Panel: Total Amount + Cash/UPI */}
        <div className="col-span-1 lg:col-span-2 rounded-[32px] p-8 lg:p-10 relative overflow-hidden bg-gradient-to-br from-[#2E3155] to-[#1A1B2E] border border-indigo-500/20 shadow-lg min-h-[260px]">
           <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
           
           <div className="relative z-10 flex flex-col h-full justify-between">
             <div>
               <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2 text-indigo-300">
                     <Sparkles size={16} />
                     <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Total Balance</span>
                  </div>
                  <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors">
                     <Wallet size={16} />
                  </button>
               </div>
               
               <div className="mb-4">
                  <h2 className="text-[54px] lg:text-[64px] font-bold tracking-tight text-white leading-none">
                     {fmt(data?.total_balance)}
                  </h2>
               </div>
             </div>

             <div className="flex items-center gap-12 mt-auto pt-6 border-t border-white/5 w-full">
               <div className="flex-1">
                 <p className="text-indigo-200/70 text-[10px] font-bold uppercase tracking-widest mb-2.5">Cash Wallet</p>
                 <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-inner">
                       <Banknote size={14} className="text-emerald-400" />
                    </div>
                    <p className="text-white text-2xl font-bold tracking-tight">{fmt(data?.cash_balance)}</p>
                 </div>
               </div>
               
               <div className="flex-shrink-0 w-px h-12 bg-white/10"></div>
               
               <div className="flex-1">
                 <p className="text-indigo-200/70 text-[10px] font-bold uppercase tracking-widest mb-2.5">UPI Wallet</p>
                 <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#38BDF8]/20 border border-[#38BDF8]/30 flex items-center justify-center shadow-inner">
                       <Smartphone size={14} className="text-[#38BDF8]" />
                    </div>
                    <p className="text-white text-2xl font-bold tracking-tight">{fmt(data?.upi_balance)}</p>
                 </div>
               </div>
             </div>
           </div>
        </div>

        {/* Right Panel: Net Worth + Receivables */}
        <div className="col-span-1 rounded-[32px] p-8 lg:p-10 relative overflow-hidden bg-[#0A0B0E]/80 backdrop-blur-2xl border border-white/5 min-h-[260px]">
           <div className="absolute top-0 right-0 p-24 bg-[#00FFA3]/5 rounded-full blur-3xl pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>

           <div className="relative z-10 flex flex-col h-full justify-between">
             <div>
               <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#00FFA3]/10 border border-[#00FFA3]/20 flex items-center justify-center text-[#00FFA3]">
                     <TrendingUp size={18} />
                  </div>
                  <ArrowUpRight size={20} className="text-[#8B92A5]" />
               </div>
               
               <div>
                  <p className="text-[#8B92A5] text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Net Worth</p>
                  <h2 className="text-[34px] font-bold tracking-tight text-white leading-none">
                     {fmt((data?.total_balance || 0) + (data?.pending_amount || 0))}
                  </h2>
               </div>
             </div>

             <div className="mt-auto pt-6 border-t border-white/5 w-full border-dashed">
                <p className="text-[#8B92A5] text-[10px] font-bold uppercase tracking-[0.2em] mb-2">To Receive</p>
                <div className="flex items-center gap-3">
                   <p className="text-2xl font-bold tracking-tight text-[#00FFA3]">{fmt(data?.pending_amount)}</p>
                   {data?.pending_receivables_count > 0 && (
                      <span className="text-[10px] font-bold tracking-wide px-2.5 py-0.5 bg-white/5 rounded text-[#8B92A5]">
                         {data.pending_receivables_count} active
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
          accentClass="text-rose-400" 
          iconBg="bg-rose-500/10" 
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
          accentClass={savingsGood ? "text-[#00FFA3]" : "text-orange-400"}
          iconBg={savingsGood ? "bg-[#00FFA3]/10" : "bg-orange-500/10"}
          delayIdx={3} 
        />
        <StatCard 
          icon={Target} 
          label="Spent Today" 
          value={fmt(data?.today_spending)} 
          sub="Last 24h"
          accentClass="text-indigo-400" 
          iconBg="bg-indigo-500/10" 
          delayIdx={4} 
        />
      </div>

      {/* ── ROW 3: CHARTS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-stagger-3 mt-2">
        
        {/* Left Column (2 spans): Weekly Spending */}
        <div className="bg-[#0A0B0E]/80 backdrop-blur-2xl border border-white/5 col-span-1 xl:col-span-2 p-6 md:p-8 h-[400px] flex flex-col rounded-[32px]">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-white font-bold tracking-wide text-[16px]">Weekly Spending</h3>
             <span className="text-[10px] px-3 py-1.5 rounded-full border border-white/10 text-[#8B92A5] font-bold uppercase tracking-widest bg-white/5">LAST 7 DAYS</span>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.weekly_spending?.length ? data.weekly_spending : [{amount: 0, day: '-'}]} barSize={32} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <Tooltip content={<ChartTip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#8B92A5', fontSize: 12, fontWeight: 700 }}
                  dy={15}
                />
                <Bar dataKey="amount" fill="#8B5CF6" radius={[6,6,6,6]}>
                  {(data?.weekly_spending || [{amount: 0}]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="url(#neonPurpleManager)" />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="neonPurpleManager" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column (1 span): Category Pie Chart */}
        <div className="bg-[#0A0B0E]/80 backdrop-blur-2xl border border-white/5 col-span-1 p-6 md:p-8 h-[400px] flex flex-col rounded-[32px]">
          <h3 className="text-white font-bold tracking-wide mb-4 text-[16px]">By Category</h3>
          <div className="flex-1 flex flex-col items-center justify-center relative">
             <ResponsiveContainer width="100%" height="100%">
               <RePie>
                 <Pie 
                    data={data?.category_breakdown?.length ? data.category_breakdown : [{category:'Empty',amount:1}]} 
                    dataKey="amount" nameKey="category" cx="50%" cy="50%" 
                    innerRadius={80} outerRadius={110} paddingAngle={6} stroke="none"
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
                     <span className="text-[12px] text-[#8B92A5] uppercase tracking-widest font-bold mb-1">{data.category_breakdown[0].category}</span>
                     <span className="text-2xl font-bold text-white">₹{fmt(data.category_breakdown[0].amount)}</span>
                  </>
               )}
             </div>
             
             {/* Minimal Legend below Pie */}
             <div className="flex flex-col gap-3 mt-auto w-full pt-4">
                {data?.category_breakdown?.slice(0, 3).map((c, i) => (
                   <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-white" style={{backgroundColor: PIE_COLORS[i % PIE_COLORS.length]}}></div>
                        <span className="text-xs text-white font-bold tracking-wide">{c.category}</span>
                      </div>
                      <span className="text-xs font-bold text-[#8B92A5]">{fmt(c.amount)}</span>
                   </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
