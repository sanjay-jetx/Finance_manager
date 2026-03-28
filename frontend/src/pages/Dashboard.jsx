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
    <div className="space-y-8 animate-slide-up">

      {/* Add Money Modal */}
      {showAddMoney && (
        <AddMoneyModal
          onClose={() => setShowAddMoney(false)}
          onSuccess={fetchDashboard}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title">
            {greeting}, {user?.user_name?.split(' ')[0]} 👋
          </h1>
          <p className="section-sub">Here's your financial overview</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Add Money Button */}
          <button
            id="dashboard-add-money"
            onClick={() => setShowAddMoney(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white
              bg-gradient-to-r from-emerald-600 to-teal-600
              hover:from-emerald-500 hover:to-teal-500
              shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={16} /> Add Money
          </button>
          <button
            onClick={fetchDashboard}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Wallet}      label="Total Balance"    value={fmt(data?.total_balance)}
          gradient="from-primary-600/80 to-violet-700/80"
          sub="Cash + UPI combined" />
        <StatCard icon={Banknote}    label="Cash Balance"     value={fmt(data?.cash_balance)}
          gradient="from-emerald-600/80 to-teal-700/80"
          sub="Physical cash on hand" />
        <StatCard icon={Smartphone}  label="UPI Balance"      value={fmt(data?.upi_balance)}
          gradient="from-blue-600/80 to-cyan-700/80"
          sub="GPay / PhonePe" />
        <StatCard icon={ArrowDownLeft} label="You Will Receive" value={fmt(data?.pending_amount)}
          gradient="from-amber-600/80 to-orange-700/80"
          sub={`${data?.pending_receivables_count ?? data?.pending_debts_count ?? 0} outstanding`}
          onClick={() => navigate('/receivables')} />
      </div>

      {/* Monthly Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp size={24} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">This Month's Income</p>
            <p className="text-2xl font-bold text-emerald-400">{fmt(data?.monthly_income)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <TrendingDown size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">This Month's Expenses</p>
            <p className="text-2xl font-bold text-red-400">{fmt(data?.monthly_expense)}</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Weekly Bar Chart */}
        <div className="card xl:col-span-2">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingDown size={18} className="text-primary-400" />
            Weekly Spending
          </h3>
          {data?.weekly_spending?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.weekly_spending} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="url(#barGrad)" radius={[6,6,0,0]} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-500">
              No spending data yet
            </div>
          )}
        </div>

        {/* Category Pie */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Wallet size={18} className="text-primary-400" />
            Spending by Category
          </h3>
          {data?.category_breakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.category_breakdown} dataKey="amount" nameKey="category"
                  cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {data.category_breakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{color:'#9ca3af',fontSize:'11px'}}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-500 text-sm">
              No category data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h3 className="text-white font-semibold mb-4">Recent Transactions</h3>
        {data?.recent_transactions?.length > 0 ? (
          <div className="space-y-3">
            {data.recent_transactions.map((txn) => {
              const uiType = transactionUiType(txn)
              const cfg = typeConfig[uiType] || typeConfig.expense
              const Icon = cfg.icon
              return (
                <div key={txn._id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className={`p-2 rounded-xl ${cfg.cls.split(' ').slice(0,1).join(' ')}`}>
                    <Icon size={16} className={cfg.cls.split(' ').slice(1).join(' ')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {txn.notes || txn.category || txn.source || cfg.label}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {txn.wallet === 'cash' ? '💵 Cash' : '📱 UPI'} ·{' '}
                      {displayCategoryForUi(txn.category) || txn.source || '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${
                      isCreditUiType(uiType)
                        ? 'text-emerald-400'
                        : uiType === 'goal_transfer' || uiType === 'transfer'
                        ? 'text-violet-400'
                        : 'text-red-400'
                    }`}>
                      {isCreditUiType(uiType) ? '+' : '-'}{fmt(txn.amount)}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {txn.timestamp ? new Date(txn.timestamp).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Wallet size={40} className="mx-auto mb-2 opacity-30" />
            No transactions yet. Start by adding income or an expense!
          </div>
        )}
      </div>
    </div>
  )
}
