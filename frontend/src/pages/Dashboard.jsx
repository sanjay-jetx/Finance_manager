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

      {/* Hero: Consolidated Net Worth */}
      <div className="panel p-8 lg:p-12 animate-stagger-1 relative overflow-hidden flex flex-col lg:flex-row justify-between items-center gap-10">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-accent/5 blur-[120px] pointer-events-none" />
        
        <div className="w-full lg:w-1/2 z-10 flex flex-col justify-center">
          <p className="obsidian-label text-accent mb-4">Consolidated Net Worth</p>
          <h2 className="text-5xl lg:text-7xl obsidian-value text-white mb-3 tracking-tighter" style={{ textShadow: '0 0 40px rgba(0, 255, 163, 0.2)' }}>
            {fmt(data?.net_worth || data?.total_balance)}
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <ArrowUpRight size={16} className="text-accent" />
            <span className="text-accent font-display font-bold text-sm tracking-widest uppercase">+{fmt(data?.monthly_income)} EARNED</span>
            <span className="text-muted font-display text-[10px] tracking-widest uppercase ml-2">PAST 30 DAYS</span>
          </div>

          <div className="flex lg:flex-row flex-col gap-4 mt-12 w-full max-w-sm">
            <button className="btn-primary w-full" onClick={() => setShowQuickAdd(true)}>
              Execute Rebalance
            </button>
            <button className="btn-secondary w-full" onClick={() => navigate('/budgets')}>
              Detailed Analysis
            </button>
          </div>
        </div>

        <div className="w-full lg:w-[50%] h-[200px] z-10 mt-8 lg:mt-0">
          {/* Abstracted Green Bar Chart */}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.weekly_spending?.length ? data.weekly_spending : [{amount: 0, day: '-'}]} barSize={32} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
              <Tooltip content={<ChartTip />} cursor={{ fill:'rgba(255,255,255,0.02)' }} />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={({ x, y, payload }) => {
                  const dayData = data?.weekly_spending?.find(d => d.day === payload.value);
                  const val = dayData ? dayData.amount : 0;
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} dy={14} textAnchor="middle" fill="#888" fontSize={9} className="font-display font-bold uppercase tracking-widest">{payload.value}</text>
                      {val > 0 && <text x={0} dy={28} textAnchor="middle" fill="#00FFA3" fontSize={9} className="font-display font-bold opacity-80">{fmt(val)}</text>}
                    </g>
                  );
                }} 
              />
              <Bar dataKey="amount" fill="#00FFA3" radius={[4,4,4,4]}>
                {(data?.weekly_spending || [{amount: 0}]).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="url(#neonGreen)" />
                ))}
              </Bar>
              <defs>
                <linearGradient id="neonGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00FFA3" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#00cc82" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Market Pulse (Mini Stats converted) */}
        <div className="space-y-4 animate-stagger-2">
          <p className="obsidian-label mb-4">Market Pulse</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="panel p-6 hover:border-accent/30 cursor-pointer">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#F7931A]/10 flex items-center justify-center text-[#F7931A] font-bold pb-0.5">₿</div>
                  <span className="font-display font-bold uppercase tracking-widest text-[11px]">Bitcoin (INR)</span>
                </div>
                <span className="text-accent font-display font-bold text-[11px]">+2.1%</span>
              </div>
              <p className="obsidian-value text-3xl tracking-tight text-white mb-2">₹54,12,840</p>
              <div className="w-full h-1 bg-white/5 rounded overflow-hidden mt-6"><div className="w-[80%] h-full bg-accent rounded"></div></div>
            </div>

            <div className="panel p-6 hover:border-accent/30 cursor-pointer">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-500"><TrendingUp size={14}/></div>
                  <span className="font-display font-bold uppercase tracking-widest text-[11px]">NIFTY 50</span>
                </div>
                <span className="text-accent font-display font-bold text-[11px]">+0.84%</span>
              </div>
              <p className="obsidian-value text-3xl tracking-tight text-white mb-2">22,514.65</p>
              <div className="w-full h-1 bg-white/5 rounded overflow-hidden mt-6"><div className="w-[65%] h-full bg-accent rounded"></div></div>
            </div>
            
            {/* Real Stats abstracted */}
            <div className="panel p-6 col-span-1 sm:col-span-2 flex justify-between items-center">
               <div>
                  <p className="obsidian-label text-muted mb-2">Liquid Balance</p>
                  <p className="obsidian-value text-2xl">{fmt(data?.total_balance)}</p>
               </div>
               <div className="text-right">
                 <p className="obsidian-label text-muted mb-2">Savings Rate</p>
                 <p className="obsidian-value text-2xl text-accent">{data?.savings_rate ?? 0}%</p>
               </div>
            </div>
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="space-y-4 animate-stagger-3">
          <p className="obsidian-label mb-4">Asset Allocation</p>
          <div className="panel p-8 h-[312px] flex flex-col md:flex-row items-center justify-between gap-8 relative">
            <div className="w-full md:w-1/2 h-full flex items-center justify-center relative pt-4">
               <ResponsiveContainer width="100%" height={260}>
                 <RePie>
                   <Pie 
                      data={data?.category_breakdown?.length ? data.category_breakdown : [{category:'Empty',amount:1}]} 
                      dataKey="amount" nameKey="category" cx="50%" cy="50%" 
                      innerRadius={80} outerRadius={110} paddingAngle={4} stroke="none"
                    >
                     {(data?.category_breakdown?.length ? data.category_breakdown : [{category:'Empty',amount:1}]).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                   </Pie>
                   {data?.category_breakdown?.length > 0 && <Tooltip content={<ChartTip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />}
                 </RePie>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
                 <span className="text-4xl font-display font-bold text-white">{data?.category_breakdown?.length || 0}</span>
                 <span className="obsidian-label mt-2">Assets</span>
               </div>
            </div>

            <div className="w-full md:w-1/2 flex flex-col gap-5 overflow-y-auto max-h-full no-scrollbar pr-2 mt-4 md:mt-0">
               {data?.category_breakdown?.slice(0, 4).map((c, i) => (
                 <div key={i} className="flex justify-between items-center pl-4 border-l-4" style={{borderColor: PIE_COLORS[i % PIE_COLORS.length]}}>
                   <div>
                     <p className="font-display font-bold text-white text-[13px]">{c.category}</p>
                     <p className="obsidian-label mt-1 lowercase opacity-70">{c.category === 'Food' ? 'Consumer' : 'General'}</p>
                   </div>
                   <div className="text-right">
                     <p className="obsidian-value text-[14px]">{fmt(c.amount)}</p>
                   </div>
                 </div>
               ))}
               {!data?.category_breakdown?.length && <p className="text-muted text-sm italic">No asset data</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Intelligent Activity Ledger */}
      <div className="animate-stagger-4 pt-6">
        <div className="flex items-center justify-between mb-5 px-1">
          <h3 className="obsidian-label text-muted">Intelligent Activity</h3>
          <button onClick={() => navigate('/transactions')} className="obsidian-label text-accent hover:text-accent-light flex items-center gap-2 tracking-[0.2em] transition-colors border-b border-transparent hover:border-accent">
            View Full Ledger
          </button>
        </div>

        <div className="panel">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted font-display">
            <div className="col-span-6 sm:col-span-5 lg:col-span-5">Transaction Path</div>
            <div className="col-span-hidden sm:col-span-4 lg:col-span-3 hidden sm:block">Intelligence Insight</div>
            <div className="col-span-4 lg:col-span-2 hidden lg:block">Status</div>
            <div className="col-span-6 sm:col-span-3 lg:col-span-2 text-right">Net Impact</div>
          </div>

          {data?.recent_transactions?.length > 0 ? (
            <div className="flex flex-col">
              {data.recent_transactions.map((txn, idx) => {
                const uiType = transactionUiType(txn);
                const isCredit = isCreditUiType(uiType);
                const isTransfer = uiType === 'transfer';
                
                let insight = isCredit ? { text: 'Autopilot Yield', color: 'bg-[#1A1124] text-[#A855F7] border border-[#A855F7]/30', icon: '⚡' } :
                              isTransfer ? { text: 'Optimized Routing', color: 'bg-[#0A1A12] text-[#00FFA3] border border-[#00FFA3]/30', icon: '⟲' } :
                              { text: 'Risk Adapted', color: 'bg-[#1F0A0E] text-[#FF3366] border border-[#FF3366]/30', icon: '⚠' };

                return (
                  <div key={txn._id} className={`grid grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] ${idx === data.recent_transactions.length -1 ? 'border-b-0' : ''}`}>
                    <div className="col-span-6 sm:col-span-5 lg:col-span-5 flex items-center gap-5">
                      <div className="w-12 h-12 rounded bg-[#15161A] border border-white/5 flex items-center justify-center flex-shrink-0">
                        {isTransfer ? <RefreshCw size={16} className="text-muted" /> : isCredit ? <ArrowUpRight size={16} className="text-muted"/> : <ArrowDownRight size={16} className="text-muted" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-foreground font-display font-semibold text-[14px] truncate">{txn.notes || txn.category || txn.source || 'Transaction'}</p>
                        <p className="text-muted text-[11px] mt-1.5">{txn.timestamp ? new Date(txn.timestamp).toLocaleString('en-US', {hour:'2-digit', minute:'2-digit', month:'short', day:'numeric'}) : ''}</p>
                      </div>
                    </div>
                    
                    <div className="col-span-hidden sm:col-span-4 lg:col-span-3 hidden sm:flex items-center">
                       <span className={`text-[9px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5 rounded flex items-center gap-1.5 font-display ${insight.color}`}>
                         <span>{insight.icon}</span> {insight.text}
                       </span>
                    </div>

                    <div className="col-span-4 lg:col-span-2 hidden lg:flex items-center">
                      <span className="text-muted text-[10px] uppercase tracking-widest font-bold">Completed</span>
                    </div>

                    <div className="col-span-6 sm:col-span-3 lg:col-span-2 text-right">
                      <p className={`obsidian-value text-[16px] ${isCredit ? 'text-success' : 'text-foreground'}`}>
                        {isCredit ? '+' : '-'}{fmt(txn.amount)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-20 text-center text-muted font-display text-sm tracking-widest uppercase border-dashed border-t border-white/5">No Intel Activity</div>
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
