import { useEffect, useState, useCallback } from 'react'
import api from '../api/axios'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import {
  RefreshCw, Save, TrendingUp, TrendingDown,
  Gem, Coins, Info, ChevronDown, Sparkles, BarChart3
} from 'lucide-react'

/* ─── Local-storage key ──────────────────────────────────────────────────── */
const LS_KEY = 'fintrack_metal_rates_cache'

/* ─── Purity options ─────────────────────────────────────────────────────── */
const PURITIES = [
  { value: '24K', label: '24K — 99.9% Pure', badge: '✦ Investment Grade' },
  { value: '22K', label: '22K — 91.7% (Jewellery)', badge: '💍 Most Common' },
  { value: '18K', label: '18K — 75.0% (Mixed)', badge: '🔀 Alloy' },
]

/* ─── Glass card wrapper ─────────────────────────────────────────────────── */
function GCard({ children, style = {}, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-[24px] border border-white/[0.07] ${className}`}
      style={{
        background: 'linear-gradient(145deg,rgba(17,24,39,0.9),rgba(5,5,8,0.95))',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 40px -12px rgba(0,0,0,0.5)',
        cursor: onClick ? 'pointer' : undefined,
        ...style
      }}
    >
      {children}
    </div>
  )
}

/* ─── Animated number ticker ─────────────────────────────────────────────── */
function Ticker({ value, prefix = '₹', suffix = '', decimals = 0, color = '#fff', size = 32 }) {
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals, minimumFractionDigits: decimals
  }).format(value || 0)
  return (
    <span style={{ color, fontSize: size, fontWeight: 900, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
      {prefix}{formatted}{suffix}
    </span>
  )
}

/* ─── Rate badge ─────────────────────────────────────────────────────────── */
function RateBadge({ label, value, color, icon: Icon }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-2xl border"
         style={{ background: color + '0d', borderColor: color + '22' }}>
      <div className="flex items-center gap-1.5">
        <Icon size={12} style={{ color }} />
        <span style={{ color: 'rgba(148,163,184,0.7)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>{label}</span>
      </div>
      <span style={{ color, fontSize: 15, fontWeight: 900 }}>₹{new Intl.NumberFormat('en-IN').format(value)}<span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(100,116,139,0.7)' }}>/g</span></span>
    </div>
  )
}

/* ─── Holding display row ────────────────────────────────────────────────── */
function HoldingRow({ icon, color, name, grams, rate, value, purity, accent }) {
  if (grams <= 0) return null
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border"
         style={{ background: color + '08', borderColor: color + '18', animation: 'riseIn 0.4s ease-out both' }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
           style={{ background: color + '18', border: `1px solid ${color}25` }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 15 }}>{name}{purity ? ` (${purity})` : ''}</p>
        <p style={{ color: 'rgba(100,116,139,0.7)', fontSize: 12, fontWeight: 600, marginTop: 2 }}>
          {grams}g × ₹{new Intl.NumberFormat('en-IN').format(rate)}/g
        </p>
      </div>
      <div className="text-right">
        <p style={{ color, fontSize: 18, fontWeight: 900 }}>{fmt(value)}</p>
        <p style={{ color: 'rgba(100,116,139,0.5)', fontSize: 11, marginTop: 2 }}>{grams}g held</p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function Metals() {
  const [portfolio, setPortfolio] = useState(null)
  const [rates, setRates]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showPurityDrop, setShowPurityDrop] = useState(false)

  // Form state (mirrors holdings)
  const [goldGrams,   setGoldGrams]   = useState('')
  const [goldPurity,  setGoldPurity]  = useState('24K')
  const [silverGrams, setSilverGrams] = useState('')

  /* ── fetch portfolio + rates ──────────────────────────────────────────── */
  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [pRes, rRes] = await Promise.all([
        api.get('/metals/portfolio'),
        api.get('/metals/rates'),
      ])
      setPortfolio(pRes.data)
      setRates(rRes.data)

      // Pre-fill form from saved holdings
      setGoldGrams(pRes.data.gold.grams > 0 ? String(pRes.data.gold.grams) : '')
      setSilverGrams(pRes.data.silver.grams > 0 ? String(pRes.data.silver.grams) : '')
      setGoldPurity(pRes.data.gold.purity || '24K')

      // Also cache rates in localStorage for offline fallback
      try { localStorage.setItem(LS_KEY, JSON.stringify({ ...rRes.data, ts: Date.now() })) } catch {}
    } catch (err) {
      // Try local-storage fallback for rates
      try {
        const cached = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
        if (cached) { setRates(cached); toast('⚡ Showing cached rates (offline)', { icon: 'ℹ️' }) }
      } catch {}
      if (!silent) toast.error('Failed to load metal prices')
    } finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  /* ── save holdings ────────────────────────────────────────────────────── */
  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post('/metals/holdings', {
        gold_grams:   parseFloat(goldGrams)   || 0,
        gold_purity:  goldPurity,
        silver_grams: parseFloat(silverGrams) || 0,
      })
      toast.success('Holdings saved! 🏅')
      fetchAll(true)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save')
    } finally { setSaving(false) }
  }

  /* ── live preview while typing ────────────────────────────────────────── */
  const liveGoldRate  = rates ? rates.gold[goldPurity]  || rates.gold['24K'] : 0
  const liveSilverRate = rates?.silver || 0
  const liveGoldVal   = (parseFloat(goldGrams) || 0) * liveGoldRate
  const liveSilverVal = (parseFloat(silverGrams) || 0) * liveSilverRate
  const liveTotalVal  = liveGoldVal + liveSilverVal

  const ratesAge = portfolio?.fetched_at
    ? Math.round((Date.now() - new Date(portfolio.fetched_at).getTime()) / 60000)
    : null

  const purityLabel = PURITIES.find(p => p.value === goldPurity)?.label || goldPurity

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div style={{ width: 40, height: 40, border: '2px solid rgba(245,158,11,0.2)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6" style={{ animation: 'riseIn 0.4s ease-out' }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em' }}>
            Gold & Silver Tracker
          </h1>
          <p style={{ color: 'rgba(100,116,139,0.7)', fontSize: 14, fontWeight: 600, marginTop: 4 }}>
            Live India market rates · Chennai reference price
          </p>
        </div>
        <button
          onClick={() => fetchAll(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.07] text-sm font-bold"
          style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(148,163,184,0.8)' }}
        >
          <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} />
          Refresh
        </button>
      </div>

      {/* ── Live Rate Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RateBadge label="Gold 24K" value={rates?.gold?.['24K'] || 0} color="#f59e0b" icon={Gem} />
        <RateBadge label="Gold 22K" value={rates?.gold?.['22K'] || 0} color="#fbbf24" icon={Gem} />
        <RateBadge label="Gold 18K" value={rates?.gold?.['18K'] || 0} color="#d97706" icon={Gem} />
        <RateBadge label="Silver"   value={rates?.silver || 0}        color="#94a3b8" icon={Coins} />
      </div>

      {/* Source & freshness */}
      <div className="flex items-center gap-2" style={{ marginTop: -8 }}>
        <Info size={12} style={{ color: 'rgba(100,116,139,0.5)' }} />
        <p style={{ color: 'rgba(100,116,139,0.5)', fontSize: 11, fontWeight: 600 }}>
          {portfolio?.source || 'Live rates'} ·{' '}
          {ratesAge !== null ? (ratesAge < 1 ? 'Just updated' : `${ratesAge}m ago`) : ''}
          {ratesAge !== null && ratesAge > 60 && (
            <span style={{ color: '#f59e0b' }}> · Rates cached (refresh for live)</span>
          )}
        </p>
      </div>

      {/* ── Main grid: Total Value + Edit Form ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left: Total portfolio value */}
        <GCard className="lg:col-span-2 p-7 flex flex-col justify-between min-h-[260px]"
          style={{
            background: 'linear-gradient(135deg,rgba(245,158,11,0.18),rgba(120,53,15,0.12),rgba(5,5,8,0.9))',
            borderColor: 'rgba(245,158,11,0.2)',
          }}>
          <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 1,
            background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.6),transparent)' }} />

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} style={{ color: '#f59e0b' }} />
              <span style={{ color: 'rgba(245,158,11,0.8)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '3px' }}>
                Total Metal Value
              </span>
            </div>
            <Ticker value={liveTotalVal} size={36} color="#fff" />
            <p style={{ color: 'rgba(148,163,184,0.6)', fontSize: 13, fontWeight: 600, marginTop: 6 }}>
              Live portfolio estimate
            </p>
          </div>

          <div className="space-y-3 mt-4">
            {(parseFloat(goldGrams) || 0) > 0 && (
              <div className="flex items-center justify-between py-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 18 }}>🥇</span>
                  <span style={{ color: 'rgba(148,163,184,0.8)', fontSize: 13, fontWeight: 700 }}>
                    {goldGrams}g Gold ({goldPurity})
                  </span>
                </div>
                <span style={{ color: '#fbbf24', fontWeight: 900, fontSize: 14 }}>{fmt(liveGoldVal)}</span>
              </div>
            )}
            {(parseFloat(silverGrams) || 0) > 0 && (
              <div className="flex items-center justify-between py-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 18 }}>🥈</span>
                  <span style={{ color: 'rgba(148,163,184,0.8)', fontSize: 13, fontWeight: 700 }}>
                    {silverGrams}g Silver
                  </span>
                </div>
                <span style={{ color: '#94a3b8', fontWeight: 900, fontSize: 14 }}>{fmt(liveSilverVal)}</span>
              </div>
            )}
            {liveTotalVal === 0 && (
              <p style={{ color: 'rgba(100,116,139,0.5)', fontSize: 13, fontWeight: 600, textAlign: 'center', paddingTop: 8 }}>
                Enter your holdings →
              </p>
            )}
          </div>
        </GCard>

        {/* Right: Input form */}
        <GCard className="lg:col-span-3 p-7">
          <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 1,
            background: 'linear-gradient(90deg,transparent,rgba(139,92,246,0.5),transparent)' }} />

          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em', marginBottom: 20 }}>
            Update Your Holdings
          </h2>

          <div className="space-y-5">

            {/* Gold Section */}
            <div className="p-5 rounded-2xl border border-yellow-500/[0.12]"
                 style={{ background: 'rgba(245,158,11,0.06)' }}>
              <div className="flex items-center gap-2 mb-4">
                <span style={{ fontSize: 22 }}>🥇</span>
                <h3 style={{ color: '#fbbf24', fontWeight: 900, fontSize: 15 }}>Gold Holdings</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Grams */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color:'rgba(100,116,139,0.7)', textTransform:'uppercase', letterSpacing:'2.5px', marginBottom: 7 }}>
                    Weight (grams)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="gold-grams"
                      type="number" min="0" step="0.1" placeholder="0.0"
                      value={goldGrams}
                      onChange={e => setGoldGrams(e.target.value)}
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '12px 40px 12px 14px',
                        background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(245,158,11,0.2)',
                        borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: 700, outline: 'none',
                      }}
                    />
                    <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'rgba(245,158,11,0.6)', fontSize:11, fontWeight:800 }}>g</span>
                  </div>
                  {goldGrams && liveGoldRate > 0 && (
                    <p style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700, marginTop: 6 }}>
                      ≈ {fmt(liveGoldVal)}
                    </p>
                  )}
                </div>

                {/* Purity dropdown */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color:'rgba(100,116,139,0.7)', textTransform:'uppercase', letterSpacing:'2.5px', marginBottom: 7 }}>
                    Purity
                  </label>
                  <div style={{ position: 'relative' }}>
                    <button
                      id="gold-purity-btn"
                      type="button"
                      onClick={() => setShowPurityDrop(d => !d)}
                      style={{
                        width: '100%', padding: '12px 40px 12px 14px', textAlign: 'left',
                        background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(245,158,11,0.2)',
                        borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', outline: 'none',
                      }}
                    >
                      {goldPurity}
                      <ChevronDown size={14} style={{ position:'absolute', right:12, top:'50%', transform:`translateY(-50%) rotate(${showPurityDrop?180:0}deg)`, color:'rgba(245,158,11,0.6)', transition:'transform 0.2s' }} />
                    </button>
                    {showPurityDrop && (
                      <div className="absolute z-20 left-0 right-0 mt-1 rounded-2xl border border-white/[0.08] overflow-hidden"
                           style={{ background:'rgba(15,23,42,0.98)', boxShadow:'0 20px 40px rgba(0,0,0,0.5)' }}>
                        {PURITIES.map((p, i) => (
                          <button key={p.value} type="button"
                            onClick={() => { setGoldPurity(p.value); setShowPurityDrop(false) }}
                            className={`w-full text-left px-4 py-3 transition-colors ${i ? 'border-t border-white/[0.05]' : ''}`}
                            style={{ background: goldPurity === p.value ? 'rgba(245,158,11,0.12)' : 'transparent' }}>
                            <p style={{ color: goldPurity === p.value ? '#fbbf24' : '#e2e8f0', fontWeight: 800, fontSize: 14 }}>{p.value}</p>
                            <p style={{ color: 'rgba(100,116,139,0.6)', fontSize: 11, fontWeight: 600 }}>{p.badge}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p style={{ color:'rgba(245,158,11,0.6)', fontSize:11, fontWeight:700, marginTop:6 }}>
                    Rate: ₹{new Intl.NumberFormat('en-IN').format(liveGoldRate)}/g
                  </p>
                </div>
              </div>
            </div>

            {/* Silver Section */}
            <div className="p-5 rounded-2xl border border-slate-500/[0.15]"
                 style={{ background: 'rgba(148,163,184,0.04)' }}>
              <div className="flex items-center gap-2 mb-4">
                <span style={{ fontSize: 22 }}>🥈</span>
                <h3 style={{ color: '#94a3b8', fontWeight: 900, fontSize: 15 }}>Silver Holdings</h3>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color:'rgba(100,116,139,0.7)', textTransform:'uppercase', letterSpacing:'2.5px', marginBottom: 7 }}>
                  Weight (grams)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="silver-grams"
                    type="number" min="0" step="1" placeholder="0"
                    value={silverGrams}
                    onChange={e => setSilverGrams(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '12px 40px 12px 14px',
                      background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(148,163,184,0.15)',
                      borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: 700, outline: 'none',
                    }}
                  />
                  <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'rgba(148,163,184,0.5)', fontSize:11, fontWeight:800 }}>g</span>
                </div>
                {silverGrams && liveSilverRate > 0 && (
                  <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, marginTop: 6 }}>
                    ≈ {fmt(liveSilverVal)} · Rate: ₹{liveSilverRate}/g
                  </p>
                )}
              </div>
            </div>

            {/* Save button */}
            <button
              id="save-metals-btn"
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                borderRadius: 16, padding: '15px 20px',
                background: saving ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg,#f59e0b,#d97706)',
                color: '#000', fontWeight: 900, fontSize: 14, textTransform: 'uppercase', letterSpacing: '2px',
                boxShadow: saving ? 'none' : '0 8px 24px rgba(245,158,11,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.2s',
              }}
            >
              {saving
                ? <><span style={{ width:16, height:16, border:'2.5px solid rgba(0,0,0,0.25)', borderTopColor:'#000', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} /> Saving...</>
                : <><Save size={16} /> Save Holdings</>}
            </button>
          </div>
        </GCard>
      </div>

      {/* ── Your Holdings Summary ─────────────────────────────────────────── */}
      {portfolio && (portfolio.gold.grams > 0 || portfolio.silver.grams > 0) && (
        <div style={{ animation: 'riseIn 0.4s ease-out 0.2s both' }}>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em', marginBottom: 12 }}>
            📊 Your Holdings
          </h2>
          <div className="space-y-3">
            <HoldingRow
              icon="🥇" color="#f59e0b" name="Gold"
              grams={portfolio.gold.grams} purity={portfolio.gold.purity}
              rate={portfolio.gold.rate_per_gram} value={portfolio.gold.value}
            />
            <HoldingRow
              icon="🥈" color="#94a3b8" name="Silver"
              grams={portfolio.silver.grams}
              rate={portfolio.silver.rate_per_gram} value={portfolio.silver.value}
            />
          </div>

          {/* Grand total */}
          <GCard className="mt-4 p-5 flex items-center justify-between"
            style={{ borderColor: 'rgba(245,158,11,0.15)', background: 'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(5,5,8,0.9))' }}>
            <div className="flex items-center gap-3">
              <BarChart3 size={20} style={{ color: '#f59e0b' }} />
              <div>
                <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>Total Metal Portfolio Value</p>
                <p style={{ color: 'rgba(100,116,139,0.5)', fontSize: 11, marginTop: 2 }}>Gold + Silver combined</p>
              </div>
            </div>
            <Ticker value={portfolio.total_value} size={26} color="#fbbf24" />
          </GCard>
        </div>
      )}

      {/* ── Tip card ──────────────────────────────────────────────────────── */}
      <GCard className="p-5 flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <Info size={16} style={{ color: '#a78bfa' }} />
        </div>
        <div>
          <p style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 13, marginBottom: 4 }}>How rates work</p>
          <p style={{ color: 'rgba(100,116,139,0.7)', fontSize: 12, fontWeight: 600, lineHeight: 1.6 }}>
            Rates are fetched live from market APIs and cached for 24 hours to avoid limits.
            The value shown is an estimate based on market price — actual buying/selling rates may vary
            by ±2-3% depending on your jeweller or platform. 24K price reflects MCX/spot price.
            To get live rates, add <code style={{ color:'#f59e0b', background:'rgba(245,158,11,0.1)', padding:'1px 4px', borderRadius:4 }}>GOLD_API_KEY</code> to your backend <code style={{ color:'#f59e0b', background:'rgba(245,158,11,0.1)', padding:'1px 4px', borderRadius:4 }}>.env</code>.
          </p>
        </div>
      </GCard>

      <style>{`
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        #gold-grams::placeholder, #silver-grams::placeholder { color: rgba(100,116,139,0.3); }
        #gold-grams:focus, #silver-grams::focus { border-color: rgba(245,158,11,0.5) !important; }
      `}</style>
    </div>
  )
}
