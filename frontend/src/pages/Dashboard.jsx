import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { fmt } from '../utils/format'
import {
  Wallet, TrendingUp, TrendingDown, Users, ArrowUpRight, ArrowDownRight,
  Banknote, Smartphone, RefreshCw, Target, Plus, X, Check,
  ChevronDown, ArrowDownLeft, Zap, PieChart, Bell, Sparkles, ArrowRight
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RePie, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts'
import toast from 'react-hot-toast'
import { transactionUiType, isCreditUiType } from '../utils/transactionsUi'

const PIE_COLORS = ['#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#3b82f6']

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const S = (styles) => ({ style: styles })

function GlassCard({ children, className = '', style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-[24px] border border-white/[0.07] ${className}`}
      style={{
        background: 'linear-gradient(145deg,rgba(17,24,39,0.9),rgba(5,5,8,0.95))',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 40px -12px rgba(0,0,0,0.5)',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ── Stat mini-card ─────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, accent, delay = 0, onClick, badge }) {
  const [hov, setHov] = useState(false)
  return (
    <GlassCard
      onClick={onClick}
      className="p-5 flex flex-col gap-3"
      style={{
        animation: `riseIn 0.5s ease-out ${delay}s both`,
        transform: hov && onClick ? 'translateY(-3px)' : undefined,
        boxShadow: hov && onClick ? `0 24px 48px -12px ${accent}44` : undefined,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 1,
        background: `linear-gradient(90deg,transparent,${accent}66,transparent)` }} />
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-xl" style={{ background: accent + '18', border: `1px solid ${accent}25` }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
        {badge && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ background: accent + '20', color: accent, border: `1px solid ${accent}30` }}>
            {badge}
          </span>
        )}
      </div>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        <p className="text-2xl font-black text-white tracking-tight">{value}</p>
        <p className="text-xs font-semibold mt-0.5" style={{ color: 'rgba(148,163,184,0.7)' }}>{label}</p>
        {sub && <p className="text-[11px] mt-1" style={{ color: accent + 'bb' }}>{sub}</p>}
      </div>
    </GlassCard>
  )
}

/* ── Budget Alert Banner ───────────────────────────────────────────────────── */
function AlertBanner({ alerts }) {
  const [visible, setVisible] = useState(true)
  if (!alerts?.length || !visible) return null
  return (
    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border"
         style={{
           background: 'rgba(245,158,11,0.08)',
           borderColor: 'rgba(245,158,11,0.25)',
           animation: 'riseIn 0.4s ease-out both',
         }}>
      <Bell size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
      <p className="text-sm font-semibold flex-1" style={{ color: '#fbbf24' }}>
        Budget alert: <span className="font-black">{alerts.join(', ')}</span>
        {alerts.length === 1 ? ' is' : ' are'} over 80% spent this month.
      </p>
      <button onClick={() => setVisible(false)} style={{ color: 'rgba(148,163,184,0.5)' }}>
        <X size={14} />
      </button>
    </div>
  )
}

/* ── Quick Add Modal ───────────────────────────────────────────────────────── */
const EXPENSE_CATS = ['Food', 'Gym', 'Petrol', 'Snacks', 'Shopping', 'Entertainment', 'Health', 'Person']
const INCOME_SRCS  = ['Pocket Money','Salary','Freelance','Business','Gift','Refund','Other']

function QuickAddModal({ onClose, onSuccess }) {
  const [type, setType]     = useState('income')
  const [amount, setAmount] = useState('')
  const [cat, setCat]       = useState('Food')
  const [src, setSrc]       = useState('Pocket Money')
  const [wallet, setWallet] = useState('cash')
  const [notes, setNotes]   = useState('')
  const [personName, setPersonName] = useState('')
  const [noDebit, setNoDebit]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return }
    setLoading(true)
    try {
      if (type === 'expense') {
        if (cat === 'Person') {
          if (!personName.trim()) { toast.error('Please enter the person\'s name'); setLoading(false); return; }
          await api.post('/lend', {
            person_name: personName,
            amount: amt,
            wallet: wallet,
            notes: notes || 'Given to friend',
            no_debit: noDebit
          })
          toast.success(`₹${amt.toLocaleString('en-IN')} recorded to receive from ${personName}!`)
        } else {
          const res = await api.post('/expense', { amount: amt, category: cat, wallet, notes })
          if (res.data.budget_alert) toast(res.data.budget_alert, { icon: '⚠️' })
          toast.success(`₹${amt.toLocaleString('en-IN')} expense recorded!`)
        }
      } else {
        await api.post('/income', { amount: amt, source: src, wallet, notes: notes || 'Added via dashboard' })
        toast.success(`₹${amt.toLocaleString('en-IN')} income recorded!`)
      }
      setDone(true)
      setTimeout(() => { onSuccess(); onClose() }, 700)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
         onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-[28px] border border-white/[0.08] overflow-hidden"
           style={{
             background: 'linear-gradient(160deg,rgba(17,24,39,0.98),rgba(5,5,8,0.99))',
             boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8)',
             animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
           }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: type === 'expense' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)' }}>
              {type === 'expense' ? <ArrowDownRight size={18} style={{ color: '#f87171' }} />
                                  : <ArrowUpRight  size={18} style={{ color: '#34d399' }} />}
            </div>
            <h2 className="text-white font-black text-lg">Quick Add</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-colors"><X size={16} /></button>
        </div>

        {/* Type toggle */}
        <div className="px-6 mb-4">
          <div className="flex p-1 rounded-2xl border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {['income','expense'].map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className="flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all"
                style={{
                  background: type === t ? (t === 'expense' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)') : 'transparent',
                  color: type === t ? (t === 'expense' ? '#f87171' : '#34d399') : 'rgba(100,116,139,0.7)',
                  border: type === t ? `1px solid ${t === 'expense' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}` : '1px solid transparent',
                }}>
                {t === 'expense' ? '💸 Expense' : '💰 Income'}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
          {/* Amount */}
          <div>
            <label style={{ display:'block', fontSize:10, fontWeight:800, color:'rgba(100,116,139,0.7)', textTransform:'uppercase', letterSpacing:'2px', marginBottom:6 }}>Amount (₹)</label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'rgba(100,116,139,0.6)', fontWeight:700 }}>₹</span>
              <input
                type="number" min="1" step="0.01" autoFocus required placeholder="0.00"
                value={amount} onChange={e => setAmount(e.target.value)}
                style={{
                  width:'100%', boxSizing:'border-box', background:'rgba(255,255,255,0.04)',
                  border:'1.5px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'12px 16px 12px 36px',
                  color:'#fff', fontSize:20, fontWeight:900, outline:'none',
                }}
              />
            </div>
          </div>

          {/* Category / Source */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ display:'block', fontSize:10, fontWeight:800, color:'rgba(100,116,139,0.7)', textTransform:'uppercase', letterSpacing:'2px', marginBottom:6 }}>
                {type === 'expense' ? 'Category' : 'Source'}
              </label>
              {type === 'expense' ? (
                <select value={cat} onChange={e => setCat(e.target.value)}
                  style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1.5px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'11px 12px', color:'#fff', fontSize:13, fontWeight:600, outline:'none' }}>
                  {EXPENSE_CATS.map(c => <option key={c} value={c} style={{ background:'#111827' }}>{c}</option>)}
                </select>
              ) : (
                <select value={src} onChange={e => setSrc(e.target.value)}
                  style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1.5px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'11px 12px', color:'#fff', fontSize:13, fontWeight:600, outline:'none' }}>
                  {INCOME_SRCS.map(s => <option key={s} value={s} style={{ background:'#111827' }}>{s}</option>)}
                </select>
              )}
            </div>
            <div>
              <label style={{ display:'block', fontSize:10, fontWeight:800, color:'rgba(100,116,139,0.7)', textTransform:'uppercase', letterSpacing:'2px', marginBottom:6 }}>Wallet</label>
              <div className="grid grid-cols-2 gap-2">
                {[['cash','💵'],['upi','📱']].map(([w,icon]) => (
                  <button key={w} type="button" onClick={() => setWallet(w)}
                    style={{
                      border: `1.5px solid ${wallet === w ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius:10, padding:'10px 6px', background: wallet === w ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                      color: wallet === w ? '#a78bfa' : 'rgba(100,116,139,0.7)', fontWeight:700, fontSize:11, transition:'all 0.2s',
                    }}>
                    {icon} {w.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Person Name */}
          {type === 'expense' && cat === 'Person' && (
            <div>
              <label style={{ display:'block', fontSize:10, fontWeight:800, color:'rgba(100,116,139,0.7)', textTransform:'uppercase', letterSpacing:'2px', marginBottom:6 }}>Person Name</label>
              <input type="text" placeholder="Who are you lending money to?" required={cat === 'Person'} value={personName} onChange={e => setPersonName(e.target.value)}
                style={{ width:'100%', boxSizing:'border-box', background:'rgba(255,255,255,0.03)', border:'1.5px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'11px 14px', color:'#fff', fontSize:14, outline:'none' }} />
                
              <label className="flex items-center gap-2 cursor-pointer mt-2.5 hover:opacity-80 transition-opacity w-fit select-none">
                <input type="checkbox" checked={noDebit} onChange={e => setNoDebit(e.target.checked)} 
                  className="w-4 h-4 rounded border-gray-600 bg-white/5 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer" />
                <span className="text-[13px] text-gray-400 font-medium">Already paid — <span className="text-gray-500">don't deduct from balance</span></span>
              </label>
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={{ display:'block', fontSize:10, fontWeight:800, color:'rgba(100,116,139,0.7)', textTransform:'uppercase', letterSpacing:'2px', marginBottom:6 }}>
              {type === 'expense' && cat === 'Person' ? 'Reason (optional)' : 'Notes (optional)'}
            </label>
            <input type="text" placeholder={type === 'expense' && cat === 'Person' ? "Reason for giving money..." : "Add a note..."} maxLength={80} value={notes} onChange={e => setNotes(e.target.value)}
              style={{ width:'100%', boxSizing:'border-box', background:'rgba(255,255,255,0.03)', border:'1.5px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'11px 14px', color:'#fff', fontSize:14, outline:'none' }} />
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading || done}
            style={{
              width:'100%', border:'none', cursor: loading || done ? 'not-allowed' : 'pointer',
              borderRadius:16, padding:'14px 20px', marginTop:4,
              background: done ? 'rgba(16,185,129,0.3)' : loading ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg,#8b5cf6,#6366f1)',
              color:'#fff', fontWeight:900, fontSize:14, textTransform:'uppercase', letterSpacing:'2px',
              boxShadow: loading || done ? 'none' : '0 8px 24px rgba(139,92,246,0.35)',
              display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition:'all 0.3s',
            }}>
            {done ? <><Check size={18} /> Saved!</>
             : loading ? <span style={{ width:16, height:16, border:'2.5px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} />
             : <><Sparkles size={16} />Save {type === 'expense' ? 'Expense' : 'Income'}</>}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Custom chart tooltip ──────────────────────────────────────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'rgba(15,23,42,0.95)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'10px 14px', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
      <p style={{ color:'rgba(148,163,184,0.7)', fontSize:11, fontWeight:700, marginBottom:4 }}>{label}</p>
      <p style={{ color:'#fff', fontWeight:900, fontSize:15 }}>{fmt(payload[0].value)}</p>
    </div>
  )
}

/* ── Transaction type config ───────────────────────────────────────────────── */
const txnCfg = {
  expense:           { label:'Expense',             color:'#f87171', icon: ArrowDownRight },
  income:            { label:'Income',              color:'#34d399', icon: ArrowUpRight },
  lend:              { label:'You lent',            color:'#fbbf24', icon: Users },
  debt_return:       { label:'Received',            color:'#60a5fa', icon: ArrowUpRight },
  receivable_return: { label:'Received',            color:'#60a5fa', icon: ArrowUpRight },
  transfer:          { label:'Transfer',            color:'#a78bfa', icon: RefreshCw },
  goal_transfer:     { label:'Goal Save',           color:'#2dd4bf', icon: Target },
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [refreshing, setRefreshing]     = useState(false)

  const fetchDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await api.get('/dashboard')
      setData(res.data)
      // Show budget alerts as toasts if any
      if (res.data.budget_alerts?.length && silent) {
        res.data.budget_alerts.forEach(cat =>
          toast(`⚠️ "${cat}" budget is over 80%!`, { style: { border:'1px solid #f59e0b' }, duration: 5000 })
        )
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? '☀️ Good morning' : hour < 18 ? '🌤️ Good afternoon' : '🌙 Good evening'
  const firstName = user?.user_name?.split(' ')[0] || 'there'

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div style={{ width:40, height:40, border:'2px solid rgba(139,92,246,0.2)', borderTopColor:'#8b5cf6', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    </div>
  )

  const savingsGood = data?.savings_rate > 20

  return (
    <div className="max-w-5xl mx-auto space-y-6" style={{ animation:'riseIn 0.4s ease-out' }}>

      {showQuickAdd && <QuickAddModal onClose={() => setShowQuickAdd(false)} onSuccess={() => fetchDashboard(true)} />}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-base text-white"
               style={{ background:'linear-gradient(135deg,#8b5cf6,#ec4899)', boxShadow:'0 0 20px rgba(139,92,246,0.4)' }}>
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ color:'rgba(100,116,139,0.8)', fontSize:13, fontWeight:600 }}>{greeting},</p>
            <h1 style={{ color:'#fff', fontSize:22, fontWeight:900, letterSpacing:'-0.03em' }}>{firstName} 👋</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchDashboard(true)}
            className="p-2.5 rounded-xl border border-white/[0.07] text-slate-500 hover:text-white transition-colors"
            style={{ background:'rgba(255,255,255,0.03)' }}>
            <RefreshCw size={17} style={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} />
          </button>
          <button onClick={() => setShowQuickAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm text-black uppercase tracking-wider"
            style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow:'0 4px 16px rgba(245,158,11,0.3)' }}>
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* ── Budget alerts ───────────────────────────────────────────────── */}
      <AlertBanner alerts={data?.budget_alerts} />

      {/* ── Hero: Balance + Net Worth ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Main balance card */}
        <GlassCard className="lg:col-span-2 p-7 flex flex-col justify-between min-h-[200px]"
          style={{ animation:'riseIn 0.5s ease-out 0.05s both',
            background:'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(99,102,241,0.15),rgba(6,182,212,0.12))',
            border:'1px solid rgba(139,92,246,0.2)' }}>
          <div style={{ position:'absolute', top:0, left:28, right:28, height:1,
            background:'linear-gradient(90deg,transparent,rgba(139,92,246,0.6),rgba(6,182,212,0.4),transparent)' }} />
          <div>
            <p style={{ color:'rgba(255,255,255,0.55)', fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'3px' }}>Total Wallet Balance</p>
            <h2 style={{ color:'#fff', fontSize:42, fontWeight:900, letterSpacing:'-0.04em', marginTop:6 }}>{fmt(data?.total_balance)}</h2>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex gap-8">
              <div>
                <p style={{ color:'rgba(255,255,255,0.45)', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'3px' }}>Cash</p>
                <div className="flex items-center gap-2 mt-1">
                  <Banknote size={14} style={{ color:'#34d399' }} />
                  <p style={{ color:'#fff', fontSize:18, fontWeight:900 }}>{fmt(data?.cash_balance)}</p>
                </div>
              </div>
              <div>
                <p style={{ color:'rgba(255,255,255,0.45)', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'3px' }}>UPI</p>
                <div className="flex items-center gap-2 mt-1">
                  <Smartphone size={14} style={{ color:'#60a5fa' }} />
                  <p style={{ color:'#fff', fontSize:18, fontWeight:900 }}>{fmt(data?.upi_balance)}</p>
                </div>
              </div>
            </div>
            <button onClick={() => navigate('/wallets')}
              className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-2 rounded-xl border"
              style={{ color:'rgba(255,255,255,0.6)', borderColor:'rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)' }}>
              Manage <ArrowRight size={12} />
            </button>
          </div>
        </GlassCard>

        {/* Net Worth card */}
        <GlassCard className="p-6 flex flex-col justify-between"
          style={{ animation:'riseIn 0.5s ease-out 0.1s both' }}
          onClick={() => navigate('/receivables')}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl" style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.2)' }}>
                <TrendingUp size={18} style={{ color:'#34d399' }} />
              </div>
              <span style={{ fontSize:9, fontWeight:800, color:'#34d399', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:999, padding:'3px 8px', textTransform:'uppercase', letterSpacing:'2px' }}>Net Worth</span>
            </div>
            <p style={{ color:'#fff', fontSize:28, fontWeight:900, letterSpacing:'-0.03em' }}>{fmt(data?.net_worth)}</p>
            <p style={{ color:'rgba(148,163,184,0.6)', fontSize:12, fontWeight:600, marginTop:4 }}>Wallets + Receivables</p>
          </div>
          <div className="border-t border-white/[0.06] pt-4 mt-2">
            <p style={{ color:'rgba(100,116,139,0.7)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'2px' }}>Pending</p>
            <p style={{ color:'#60a5fa', fontWeight:800, fontSize:15, marginTop:2 }}>{fmt(data?.pending_amount)} · {data?.pending_receivables_count || 0} outstanding</p>
          </div>
        </GlassCard>
      </div>

      {/* ── 4 Stat Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ArrowUpRight} label="Income This Month" value={fmt(data?.monthly_income)}
          accent="#34d399" delay={0.12} badge="This Month"
        />
        <StatCard
          icon={ArrowDownRight} label="Spent This Month" value={fmt(data?.monthly_expense)}
          accent="#f87171" delay={0.17}
        />
        <StatCard
          icon={Zap} label="Savings Rate" value={`${data?.savings_rate ?? 0}%`}
          accent={savingsGood ? '#34d399' : '#f59e0b'} delay={0.22}
          sub={savingsGood ? '🔥 Great discipline!' : 'Target: >20%'}
        />
        <StatCard
          icon={Target} label="Spent Today" value={fmt(data?.today_spending)}
          accent="#a78bfa" delay={0.27}
          sub={data?.top_category ? `Top: ${data.top_category}` : undefined}
        />
      </div>

      {/* ── Charts Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* Weekly bar chart */}
        <GlassCard className="xl:col-span-2 p-6" style={{ animation:'riseIn 0.5s ease-out 0.3s both' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 style={{ color:'#fff', fontWeight:900, fontSize:16, letterSpacing:'-0.02em' }}>Weekly Spending</h3>
            <span style={{ color:'rgba(139,92,246,0.8)', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'3px' }}>Last 7 days</span>
          </div>
          {data?.weekly_spending?.some(d => d.amount > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.weekly_spending} barSize={32}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false}
                  tick={{ fill:'rgba(100,116,139,0.7)', fontSize:12, fontWeight:700 }} dy={8} />
                <YAxis hide />
                <Tooltip content={<ChartTip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="amount" fill="url(#barGrad)" radius={[10,10,4,4]} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-2">
              <PieChart size={32} style={{ color:'rgba(100,116,139,0.3)' }} />
              <p style={{ color:'rgba(100,116,139,0.5)', fontSize:13, fontWeight:600 }}>No spending data yet</p>
            </div>
          )}
        </GlassCard>

        {/* Category pie */}
        <GlassCard className="p-6" style={{ animation:'riseIn 0.5s ease-out 0.35s both' }}>
          <h3 style={{ color:'#fff', fontWeight:900, fontSize:16, letterSpacing:'-0.02em', marginBottom:20 }}>By Category</h3>
          {data?.category_breakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RePie>
                <Pie data={data.category_breakdown} dataKey="amount" nameKey="category"
                     cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3}>
                  {data.category_breakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="rgba(5,5,8,0.8)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip formatter={v => fmt(v)} contentStyle={{ background:'rgba(15,23,42,0.95)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12 }} />
                <Legend iconType="circle" iconSize={7}
                  formatter={v => <span style={{ color:'rgba(148,163,184,0.7)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px' }}>{v}</span>} />
              </RePie>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-2">
              <PieChart size={32} style={{ color:'rgba(100,116,139,0.3)' }} />
              <p style={{ color:'rgba(100,116,139,0.5)', fontSize:13, fontWeight:600 }}>No data yet</p>
            </div>
          )}
        </GlassCard>
      </div>

      {/* ── Budgets ─────────────────────────────────────────────────────── */}
      {data?.budgets?.length > 0 && (
        <GlassCard className="p-6" style={{ animation:'riseIn 0.5s ease-out 0.4s both' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 style={{ color:'#fff', fontWeight:900, fontSize:16, letterSpacing:'-0.02em' }}>Budget Tracker</h3>
            <button onClick={() => navigate('/budgets')}
              style={{ color:'#8b5cf6', fontWeight:800, fontSize:11, textTransform:'uppercase', letterSpacing:'2px' }}>
              Manage →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
            {data.budgets.map(b => {
              const pct = Math.min((b.spent / b.limit) * 100, 100)
              const isOver = b.spent > b.limit
              const isWarning = pct >= 80 && !isOver
              const barColor = isOver ? '#ef4444' : isWarning ? '#f59e0b' : '#8b5cf6'
              return (
                <div key={b._id}>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p style={{ color:'#e2e8f0', fontWeight:800, fontSize:14 }}>{b.category}</p>
                      <p style={{ color:'rgba(100,116,139,0.7)', fontSize:11, marginTop:2 }}>{fmt(b.spent)} of {fmt(b.limit)}</p>
                    </div>
                    <span style={{ fontSize:12, fontWeight:900, color: barColor }}>
                      {Math.round(pct)}% {isOver ? '⚠️' : isWarning ? '🔔' : ''}
                    </span>
                  </div>
                  <div style={{ height:6, background:'rgba(255,255,255,0.05)', borderRadius:999, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background: barColor, borderRadius:999, transition:'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>
      )}

      {/* ── Recent Activity ─────────────────────────────────────────────── */}
      <div style={{ animation:'riseIn 0.5s ease-out 0.45s both' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ color:'#fff', fontWeight:900, fontSize:18, letterSpacing:'-0.02em' }}>Recent Activity</h3>
          <button onClick={() => navigate('/transactions')}
            style={{ color:'rgba(100,116,139,0.7)', fontWeight:800, fontSize:11, textTransform:'uppercase', letterSpacing:'2px', display:'flex', alignItems:'center', gap:4 }}>
            See all <ArrowRight size={12} />
          </button>
        </div>

        {data?.recent_transactions?.length > 0 ? (
          <div className="space-y-2">
            {data.recent_transactions.map((txn, i) => {
              const uiType = transactionUiType(txn)
              const cfg    = txnCfg[uiType] || txnCfg.expense
              const Icon   = cfg.icon
              const isCredit = isCreditUiType(uiType)
              return (
                <GlassCard key={txn._id} className="flex items-center gap-4 px-5 py-4"
                  style={{ animation:`riseIn 0.4s ease-out ${0.05 * i}s both` }}>
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                       style={{ background: cfg.color + '18', border:`1px solid ${cfg.color}25` }}>
                    <Icon size={16} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color:'#e2e8f0', fontWeight:700, fontSize:14 }} className="truncate">
                      {txn.notes || txn.category || txn.source || cfg.label}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span style={{ fontSize:10, fontWeight:700, color: cfg.color, background: cfg.color + '15', padding:'2px 6px', borderRadius:6 }}>{cfg.label}</span>
                      <span style={{ fontSize:11, color:'rgba(100,116,139,0.6)' }}>{txn.wallet === 'cash' ? '💵' : '📱'}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p style={{ fontWeight:900, fontSize:16, color: isCredit ? '#34d399' : cfg.color }}>
                      {isCredit ? '+' : '-'}{fmt(txn.amount)}
                    </p>
                    <p style={{ color:'rgba(100,116,139,0.5)', fontSize:11, marginTop:2 }}>
                      {txn.timestamp ? new Date(txn.timestamp).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : ''}
                    </p>
                  </div>
                </GlassCard>
              )
            })}
          </div>
        ) : (
          <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
            <div style={{ width:56, height:56, borderRadius:20, background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.15)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
              <Wallet size={24} style={{ color:'rgba(139,92,246,0.5)' }} />
            </div>
            <p style={{ color:'rgba(100,116,139,0.7)', fontWeight:700, fontSize:14 }}>No transactions yet</p>
            <button onClick={() => setShowQuickAdd(true)}
              style={{ color:'#8b5cf6', fontWeight:800, fontSize:12, textTransform:'uppercase', letterSpacing:'2px', marginTop:12, background:'none', border:'none', cursor:'pointer' }}>
              + Log your first transaction
            </button>
          </GlassCard>
        )}
      </div>

      {/* ── Floating Quick-Add FAB (mobile) ────────────────────────────── */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl lg:hidden"
        style={{
          background: 'linear-gradient(135deg,#f59e0b,#d97706)',
          boxShadow: '0 8px 32px rgba(245,158,11,0.5)',
          border: '2px solid rgba(255,255,255,0.2)',
        }}
      >
        <Plus size={24} color="#000" strokeWidth={3} />
      </button>

      <style>{`
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
