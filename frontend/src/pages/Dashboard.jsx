import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { fmt } from '../utils/format'
import {
  Wallet, TrendingUp, TrendingDown, Users, ArrowUpRight, ArrowDownRight,
  Banknote, Smartphone, Clock, RefreshCw, Target, Plus, X, Check, ChevronDown, ArrowDownLeft
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import toast from 'react-hot-toast'
import { transactionUiType, isCreditUiType, displayCategoryForUi } from '../utils/transactionsUi'

const PIE_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6']

function StatCard({ icon: Icon, label, value, sub, gradient, change, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`stat-card bg-gradient-to-br ${gradient} border-0 ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-' + gradient.split('-')[1] + '-500/20 transition-all duration-300' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-white/10">
          <Icon size={20} className="text-white" />
        </div>
        {change !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full
            ${change >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm font-medium text-white/80">{label}</p>
      {sub && <p className="text-xs text-white/50 mt-1">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-dark border border-white/10 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-white font-bold">{fmt(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

const typeConfig = {
  expense:             { label: 'Expense',              cls: 'bg-red-500/20 text-red-400',        icon: ArrowDownRight },
  income:              { label: 'Income',               cls: 'bg-emerald-500/20 text-emerald-400', icon: ArrowUpRight },
  lend:                { label: 'You lent',             cls: 'bg-amber-500/20 text-amber-400',     icon: Users },
  debt_return:         { label: 'Receivable received',    cls: 'bg-blue-500/20 text-blue-400',       icon: ArrowUpRight },
  receivable_return:   { label: 'Receivable received', cls: 'bg-blue-500/20 text-blue-400',       icon: ArrowUpRight },
  transfer:            { label: 'Transfer',             cls: 'bg-violet-500/20 text-violet-400',   icon: RefreshCw },
  goal_transfer:       { label: 'Goal Save',            cls: 'bg-teal-500/20 text-teal-400',       icon: Target },
}

// ── Add Money Modal ─────────────────────────────────────────────────────────
function AddMoneyModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    amount: '',
    wallet: 'cash',
    source: 'Salary',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [sourceOpen, setSourceOpen] = useState(false)

  const SOURCES = ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Refund', 'Other']

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setLoading(true)
    try {
      await api.post('/income', {
        amount,
        wallet: form.wallet,
        source: form.source,
        notes: form.notes || `Added via dashboard`,
      })
      setDone(true)
      toast.success(`₹${amount.toLocaleString('en-IN')} added to ${form.wallet === 'cash' ? 'Cash' : 'UPI'} wallet!`)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 800)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add money')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 shadow-2xl animate-slide-up"
        style={{ background: 'linear-gradient(135deg,#1a1f2e 0%,#12151f 100%)' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/20">
              <Plus size={18} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Add Money</h2>
              <p className="text-gray-500 text-xs">Deposit to your wallet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Amount */}
          <div>
            <label className="label">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
              <input
                id="add-money-amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                required
                autoFocus
                className="input pl-9 text-xl font-bold"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
              />
            </div>
          </div>

          {/* Wallet Selector */}
          <div>
            <label className="label">Add to Wallet</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'cash', label: 'Cash',  icon: '💵', desc: 'Physical cash' },
                { value: 'upi',  label: 'UPI',   icon: '📱', desc: 'GPay / PhonePe' },
              ].map(w => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => setForm({ ...form, wallet: w.value })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    form.wallet === w.value
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="text-2xl block mb-1">{w.icon}</span>
                  <p className="text-white font-semibold text-sm">{w.label}</p>
                  <p className="text-gray-500 text-xs">{w.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Source — custom dark dropdown */}
          <div className="relative">
            <label className="label">Income Source</label>
            <button
              id="add-money-source"
              type="button"
              onClick={() => setSourceOpen(o => !o)}
              className="input flex items-center justify-between w-full text-left"
            >
              <span className="text-white">{form.source}</span>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform duration-200 ${
                  sourceOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {sourceOpen && (
              <div
                className="absolute z-10 left-0 right-0 mt-1 rounded-xl border border-white/10 overflow-hidden shadow-2xl"
                style={{ background: '#1a1f2e' }}
              >
                {SOURCES.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, source: s })
                      setSourceOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between
                      ${
                        form.source === s
                          ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }
                      ${ i !== 0 ? 'border-t border-white/5' : '' }
                    `}
                  >
                    {s}
                    {form.source === s && <Check size={14} className="text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes (optional) */}
          <div>
            <label className="label">Notes <span className="text-gray-600">(optional)</span></label>
            <input
              id="add-money-notes"
              type="text"
              className="input"
              placeholder="e.g. Monthly salary, client payment..."
              maxLength={80}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Submit */}
          <button
            id="add-money-submit"
            type="submit"
            disabled={loading || done}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6
              rounded-xl font-semibold text-white transition-all
              bg-gradient-to-r from-emerald-600 to-teal-600
              hover:from-emerald-500 hover:to-teal-500
              disabled:opacity-60 disabled:cursor-not-allowed
              shadow-lg shadow-emerald-500/20"
          >
            {done ? (
              <><Check size={18} /> Money Added!</>
            ) : loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Plus size={18} /> Add Money</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Dashboard ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddMoney, setShowAddMoney] = useState(false)

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard')
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboard() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    )
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">

      {showAddMoney && (
        <AddMoneyModal
          onClose={() => setShowAddMoney(false)}
          onSuccess={fetchDashboard}
        />
      )}

      {/* Header — Human Personalization */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-100 border-2 border-white shadow-sm flex items-center justify-center text-primary-600 font-bold text-lg">
            {user?.user_name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">{greeting},</p>
            <h1 className="text-2xl font-bold text-slate-900">
               {user?.user_name?.split(' ')[0]} 👋
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={fetchDashboard} className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
             <RefreshCw size={20} />
           </button>
           <button onClick={() => setShowAddMoney(true)} className="p-2.5 rounded-2xl bg-primary-600 text-white hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/20">
             <Plus size={20} />
           </button>
        </div>
      </div>

      {/* Hero Section: Balance Card & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Balance Card — Dribbble Style */}
        <div className="lg:col-span-2 balance-card flex flex-col justify-between h-[240px]">
          <div>
            <p className="text-white/80 font-medium text-sm">Total Balance</p>
            <h2 className="text-4xl font-extrabold mt-1 tracking-tight">{fmt(data?.total_balance)}</h2>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-8">
              <div>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Cash</p>
                <p className="text-xl font-bold mt-0.5">{fmt(data?.cash_balance)}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">UPI</p>
                <p className="text-xl font-bold mt-0.5">{fmt(data?.upi_balance)}</p>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md">
              <Wallet size={24} />
            </div>
          </div>
        </div>

        {/* Secondary Stat: Receivables */}
        <div className="card flex flex-col justify-between border-primary-100 bg-primary-50/30">
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-2xl bg-white shadow-sm text-primary-600">
              <ArrowDownLeft size={24} />
            </div>
            <span className="text-[11px] font-bold text-primary-600 uppercase bg-primary-100 px-2 py-1 rounded-lg">Assets</span>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-semibold mt-4">To Receive</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{fmt(data?.pending_amount)}</h3>
            <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
               {data?.pending_receivables_count || 0} Outstanding
            </p>
          </div>
          <button 
            onClick={() => navigate('/receivables')}
            className="w-full mt-4 py-2.5 rounded-xl bg-white border border-primary-100 text-primary-600 text-xs font-bold hover:bg-primary-50 transition-all uppercase tracking-wide"
          >
            Manage Debts
          </button>
        </div>
      </div>

      {/* Monthly Summary & Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Weekly Spending Chart */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-slate-900 font-bold text-lg">Weekly Spending</h3>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-primary-200"></div>
               <span className="text-xs text-slate-400 font-bold uppercase">Expenses</span>
            </div>
          </div>
          {data?.weekly_spending?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.weekly_spending} barSize={36}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="amount" fill="#7C3AED" radius={[12,12,12,12]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-400 italic">No spending data yet</div>
          )}
        </div>

        {/* Category breakdown (Pie) */}
        <div className="card border-0 bg-slate-50/50">
          <h3 className="text-slate-900 font-bold text-lg mb-6">Spending Analysis</h3>
          {data?.category_breakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.category_breakdown} dataKey="amount" nameKey="category"
                  cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2}>
                  {data.category_breakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-slate-500 font-bold text-[11px] uppercase ml-1">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-52 flex items-center justify-center text-slate-400 italic">No categories yet</div>
          )}
        </div>
      </div>

      {/* Budgets Progress */}
      {data?.budgets?.length > 0 && (
        <div className="card">
           <div className="flex items-center justify-between mb-8">
             <h3 className="text-slate-900 font-bold text-lg">Your Budgets</h3>
             <button onClick={() => navigate('/budgets')} className="text-primary-600 font-bold text-xs uppercase hover:underline">Settings</button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
             {data.budgets.map(b => {
               const pct = Math.min((b.spent / b.limit) * 100, 100)
               const isOver = b.spent > b.limit
               return (
                 <div key={b._id} className="space-y-3">
                   <div className="flex justify-between items-end">
                     <div>
                       <p className="text-slate-900 font-bold text-sm">{b.category}</p>
                       <p className="text-slate-400 text-xs mt-0.5">{fmt(b.spent)} of {fmt(b.limit)}</p>
                     </div>
                     <span className={`text-xs font-bold ${isOver ? 'text-red-500' : 'text-primary-600'}`}>{Math.round(pct)}%</span>
                   </div>
                   <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className={`h-full transition-all duration-700 ${isOver ? 'bg-red-500' : 'bg-primary-600'}`} style={{ width: `${pct}%` }} />
                   </div>
                 </div>
               )
             })}
           </div>
        </div>
      )}

      {/* Recent Activity List */}
      <div className="card border-0 shadow-none bg-transparent p-0">
        <h3 className="text-slate-900 font-extrabold text-xl mb-6">Recent Activity</h3>
        {data?.recent_transactions?.length > 0 ? (
          <div className="space-y-4">
            {data.recent_transactions.map((txn) => {
              const uiType = transactionUiType(txn)
              const cfg = typeConfig[uiType] || typeConfig.expense
              const Icon = cfg.icon
              const isCredit = isCreditUiType(uiType)
              
              // Map legacy colors to new Dribbble circles
              const circleColor = isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-primary-50 text-primary-600'
              if (uiType === 'expense') {
                 // Use category hash for varied colors if you want, but sticking to clean 2-tone for now
              }

              return (
                <div key={txn._id} className="flex items-center gap-5 p-4 rounded-[24px] bg-white border border-slate-100 hover:border-primary-100 transition-all shadow-sm">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${circleColor}`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 font-bold text-base truncate">
                       {txn.notes || txn.category || txn.source || cfg.label}
                    </p>
                    <p className="text-slate-400 text-xs font-bold uppercase mt-1">
                       {txn.wallet === 'cash' ? 'Cash Wallet' : 'UPI Wallet'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-lg ${isCredit ? 'text-emerald-500' : 'text-slate-900'}`}>
                      {isCredit ? '+' : '-'}{fmt(txn.amount)}
                    </p>
                    <p className="text-slate-400 text-[11px] font-bold mt-1">
                      {txn.timestamp ? new Date(txn.timestamp).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
             <Wallet size={48} className="mx-auto mb-4 text-slate-300" />
             <p className="text-slate-500 font-bold">No transactions yet.</p>
             <button onClick={() => setShowAddMoney(true)} className="mt-4 text-primary-600 font-bold text-sm hover:underline uppercase tracking-widest">Start Tracking</button>
          </div>
        )}
      </div>
    </div>
  )
}
