import { useEffect, useState, useCallback } from 'react'
import api from '../api/axios'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import { RefreshCw, Save, Gem, Coins, Info, ChevronDown, BarChart3 } from 'lucide-react'

const LS_KEY = 'fintrack_metal_rates_cache'

const PURITIES = [
  { value: '24K', label: '24K', badge: 'Investment Grade', sub: '99.9% Pure' },
  { value: '22K', label: '22K', badge: 'Most Common',      sub: '91.7% Pure' },
  { value: '18K', label: '18K', badge: 'Alloy Grade',      sub: '75.0% Pure' },
]

/* ── Rate Tile ─────────────────────────────────────────────────────────────── */
function RateTile({ label, value, icon: Icon, active }) {
  return (
    <div className={`panel p-5 border transition-all ${active ? 'border-warning/40 bg-warning/[0.03]' : 'border-white/[0.04] hover:border-white/10'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} className={active ? 'text-warning' : 'text-muted'} />
        <span className="text-[9px] font-bold font-display uppercase tracking-[0.25em] text-muted">{label}</span>
      </div>
      <p className={`text-xl font-mono font-bold tracking-tight ${active ? 'text-warning' : 'text-foreground'}`}>
        {value > 0 ? `₹${new Intl.NumberFormat('en-IN').format(value)}` : <span className="text-muted opacity-40">—</span>}
      </p>
      <p className="text-[9px] font-display font-bold text-muted uppercase tracking-[0.15em] mt-1 opacity-40">per gram</p>
    </div>
  )
}

/* ── Holding Row ───────────────────────────────────────────────────────────── */
function HoldingRow({ icon, labelClass, name, grams, rate, value, purity }) {
  if (!grams || grams <= 0) return null
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded border border-white/[0.04] bg-surface/20 hover:border-white/10 transition-all">
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-display font-bold text-[12px] tracking-wide truncate">
          {name}{purity ? ` · ${purity}` : ''}
        </p>
        <p className="text-muted text-[10px] font-mono mt-0.5 opacity-60">
          {grams}g × ₹{new Intl.NumberFormat('en-IN').format(rate)}/g
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`font-mono font-bold text-[14px] ${labelClass}`}>{fmt(value)}</p>
        <p className="text-[9px] font-display uppercase tracking-widest text-muted font-bold mt-0.5 opacity-50">{grams}g</p>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function Metals() {
  const [portfolio,   setPortfolio]   = useState(null)
  const [rates,       setRates]       = useState(null)
  const [ratesFetchedAt, setRatesFetchedAt] = useState(null)
  const [ratesSource, setRatesSource] = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [refreshing,  setRefreshing]  = useState(false)
  const [showPurityDrop, setShowPurityDrop] = useState(false)

  const [goldGrams,   setGoldGrams]   = useState('')
  const [goldPurity,  setGoldPurity]  = useState('24K')
  const [silverGrams, setSilverGrams] = useState('')

  /* Fetch rates & portfolio independently so one failure can't block the other */
  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    // ── Rates (no auth required) ──
    try {
      const rRes = await api.get('/metals/rates')
      setRates(rRes.data)
      setRatesSource(rRes.data.source)
      setRatesFetchedAt(rRes.data.fetched_at)
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ ...rRes.data, ts: Date.now() }))
      } catch {}
    } catch {
      // Fall back to localStorage cache
      try {
        const cached = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
        if (cached) {
          setRates(cached)
          setRatesSource('Cached rates')
          toast('Showing cached rates — offline', { icon: 'ℹ️' })
        }
      } catch {}
      if (!silent) toast.error('Failed to fetch live metal prices')
    }

    // ── Portfolio (auth required) ──
    try {
      const pRes = await api.get('/metals/portfolio')
      setPortfolio(pRes.data)
      setGoldGrams(pRes.data.gold.grams > 0 ? String(pRes.data.gold.grams) : '')
      setSilverGrams(pRes.data.silver.grams > 0 ? String(pRes.data.silver.grams) : '')
      setGoldPurity(pRes.data.gold.purity || '24K')
    } catch {
      if (!silent) toast.error('Failed to load your holdings')
    }

    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post('/metals/holdings', {
        gold_grams:   parseFloat(goldGrams)   || 0,
        gold_purity:  goldPurity,
        silver_grams: parseFloat(silverGrams) || 0,
      })
      toast.success('Holdings saved successfully.')
      fetchAll(true)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed')
    } finally { setSaving(false) }
  }

  const liveGoldRate   = rates ? (rates.gold?.[goldPurity] ?? rates.gold?.['24K'] ?? 0) : 0
  const liveSilverRate = rates?.silver ?? 0
  const liveGoldVal    = (parseFloat(goldGrams)   || 0) * liveGoldRate
  const liveSilverVal  = (parseFloat(silverGrams) || 0) * liveSilverRate
  const liveTotalVal   = liveGoldVal + liveSilverVal

  const ratesAge = ratesFetchedAt
    ? Math.round((Date.now() - new Date(ratesFetchedAt).getTime()) / 60000)
    : null

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-5">
      <div className="w-10 h-10 border-[3px] border-warning/20 border-t-warning rounded-full animate-spin" />
      <p className="text-muted text-[11px] font-display uppercase tracking-[0.3em] font-bold">Fetching live market rates…</p>
    </div>
  )

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 animate-stagger-1" onClick={() => showPurityDrop && setShowPurityDrop(false)}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.05] pb-6">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-widest uppercase text-foreground">Metal Portfolio</h1>
          <p className="text-[10px] font-display font-bold uppercase tracking-[0.2em] text-muted mt-2">Commodity Holdings Tracker</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); fetchAll(true) }}
          className="panel px-4 py-3 bg-transparent hover:bg-surface border border-white/5 text-muted hover:text-white transition-colors flex items-center gap-3 font-display uppercase tracking-widest font-bold text-[10px] rounded"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin text-warning' : ''} />
          Sync Rates
        </button>
      </div>

      {/* ── Live Rate Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <RateTile label="Gold 24K" value={rates?.gold?.['24K'] ?? 0} icon={Gem}   active={goldPurity === '24K'} />
        <RateTile label="Gold 22K" value={rates?.gold?.['22K'] ?? 0} icon={Gem}   active={goldPurity === '22K'} />
        <RateTile label="Gold 18K" value={rates?.gold?.['18K'] ?? 0} icon={Gem}   active={goldPurity === '18K'} />
        <RateTile label="Silver"   value={rates?.silver         ?? 0} icon={Coins} active={false} />
      </div>

      {/* Rate freshness badge */}
      <div className="flex items-center gap-2.5 px-1 -mt-2">
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ratesAge !== null && ratesAge < 10 ? 'bg-accent animate-pulse' : 'bg-warning'}`} />
        <p className="text-muted text-[9px] font-display uppercase tracking-[0.2em] font-bold">
          {ratesSource || 'Live rates'} —{' '}
          {ratesAge !== null
            ? ratesAge < 1 ? 'Just updated' : `${ratesAge}m ago`
            : 'Updating…'}
          {ratesAge !== null && ratesAge > 60 && <span className="text-warning ml-2">[Cache]</span>}
        </p>
      </div>

      {/* ── Main Layout ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left: Portfolio Value ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Total Value Panel */}
          <div className="panel p-7 relative overflow-hidden border border-warning/10">
            <div className="absolute left-0 top-0 w-1 h-full bg-warning/60" />
            <div className="relative z-10">
              <p className="text-[9px] font-bold font-display uppercase tracking-[0.25em] text-warning mb-3">Total Value</p>
              <p className="text-5xl font-mono font-bold text-foreground tracking-tight leading-none">
                {fmt(liveTotalVal)}
              </p>
              <p className="text-[9px] text-muted font-display uppercase font-bold tracking-widest mt-3 opacity-50">
                Live Portfolio Estimate
              </p>

              {liveTotalVal > 0 ? (
                <div className="mt-7 pt-5 border-t border-white/[0.04] space-y-4">
                  {(parseFloat(goldGrams) || 0) > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded border border-warning/20 bg-warning/5 flex items-center justify-center text-sm">🥇</div>
                        <div>
                          <p className="text-foreground text-[12px] font-display font-bold">{goldGrams}g Gold · {goldPurity}</p>
                          <p className="text-[10px] font-mono text-muted opacity-50">@ ₹{new Intl.NumberFormat('en-IN').format(liveGoldRate)}/g</p>
                        </div>
                      </div>
                      <span className="text-warning font-mono font-bold text-[14px]">{fmt(liveGoldVal)}</span>
                    </div>
                  )}
                  {(parseFloat(silverGrams) || 0) > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded border border-white/10 bg-white/5 flex items-center justify-center text-sm">🥈</div>
                        <div>
                          <p className="text-foreground text-[12px] font-display font-bold">{silverGrams}g Silver</p>
                          <p className="text-[10px] font-mono text-muted opacity-50">@ ₹{new Intl.NumberFormat('en-IN').format(liveSilverRate)}/g</p>
                        </div>
                      </div>
                      <span className="text-muted font-mono font-bold text-[14px]">{fmt(liveSilverVal)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted text-[11px] font-mono mt-6 opacity-40 italic">
                  Enter holdings on the right to see live valuation.
                </p>
              )}
            </div>
          </div>

          {/* Committed Holdings (saved in DB) */}
          {portfolio && (portfolio.gold.grams > 0 || portfolio.silver.grams > 0) && (
            <div className="panel p-5 border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/[0.04]">
                <BarChart3 size={13} className="text-accent" />
                <span className="text-[9px] font-bold font-display uppercase tracking-[0.25em] text-accent">Committed Holdings</span>
              </div>
              <div className="flex flex-col gap-3">
                <HoldingRow icon="🥇" labelClass="text-warning" name="Gold"   grams={portfolio.gold.grams}   purity={portfolio.gold.purity}   rate={portfolio.gold.rate_per_gram}   value={portfolio.gold.value}   />
                <HoldingRow icon="🥈" labelClass="text-muted"   name="Silver" grams={portfolio.silver.grams}                                  rate={portfolio.silver.rate_per_gram} value={portfolio.silver.value} />
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Update Holdings Form ───────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
          <div className="panel p-7 bg-[#0B0C10] border border-white/[0.04]">
            <h2 className="text-[9px] font-bold font-display uppercase tracking-[0.25em] text-muted mb-7">Update Your Holdings</h2>

            <div className="space-y-5">

              {/* ── Gold Section ─────────────────────────────────────────────── */}
              <div className="p-5 rounded border border-warning/10 bg-warning/[0.02]">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-lg">🥇</span>
                  <div>
                    <h3 className="text-foreground font-display font-bold text-[12px] uppercase tracking-widest">Gold</h3>
                    <p className="text-[9px] text-muted font-display font-bold tracking-widest uppercase mt-0.5">
                      {PURITIES.find(p => p.value === goldPurity)?.badge} — {PURITIES.find(p => p.value === goldPurity)?.sub}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Weight */}
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-2">Weight (Grams)</label>
                    <div className="relative">
                      <input
                        type="number" min="0" step="0.1" placeholder="0.0"
                        value={goldGrams} onChange={e => setGoldGrams(e.target.value)}
                        className="obsidian-input text-xl font-mono font-bold pr-8 w-full"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-sm pointer-events-none">g</span>
                    </div>
                    {goldGrams && liveGoldRate > 0 && (
                      <p className="text-warning text-[11px] font-mono font-bold mt-2">≈ {fmt(liveGoldVal)}</p>
                    )}
                  </div>

                  {/* Purity dropdown */}
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-2">Purity</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowPurityDrop(d => !d)}
                        className="obsidian-input w-full flex justify-between items-center font-display font-bold text-[13px] uppercase tracking-widest"
                      >
                        <span>{goldPurity}</span>
                        <ChevronDown size={14} className={`text-muted transition-transform duration-200 flex-shrink-0 ${showPurityDrop ? 'rotate-180' : ''}`} />
                      </button>

                      {showPurityDrop && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 rounded border border-white/[0.08] bg-[#0D0E13] shadow-2xl overflow-hidden">
                          {PURITIES.map((p, i) => (
                            <button
                              key={p.value}
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); setGoldPurity(p.value); setShowPurityDrop(false) }}
                              className={`w-full text-left px-4 py-3.5 flex items-center justify-between transition-colors
                                ${i ? 'border-t border-white/[0.05]' : ''}
                                ${goldPurity === p.value ? 'bg-warning/8 text-warning' : 'hover:bg-white/5 text-foreground'}`}
                            >
                              <div>
                                <p className="font-display font-bold text-[12px] uppercase tracking-widest">{p.value}</p>
                                <p className="text-[9px] font-display font-bold tracking-[0.15em] uppercase mt-0.5 opacity-50">{p.badge}</p>
                              </div>
                              {goldPurity === p.value && (
                                <div className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      <p className="text-[10px] font-mono text-muted mt-2 opacity-50">
                        Live: ₹{new Intl.NumberFormat('en-IN').format(liveGoldRate)}/g
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Silver Section ───────────────────────────────────────────── */}
              <div className="p-5 rounded border border-white/[0.05] bg-white/[0.01]">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-lg">🥈</span>
                  <div>
                    <h3 className="text-foreground font-display font-bold text-[12px] uppercase tracking-widest">Silver</h3>
                    <p className="text-[9px] text-muted font-display font-bold tracking-widest uppercase mt-0.5">Spot Market Price</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-2">Weight (Grams)</label>
                  <div className="relative">
                    <input
                      type="number" min="0" step="1" placeholder="0"
                      value={silverGrams} onChange={e => setSilverGrams(e.target.value)}
                      className="obsidian-input text-xl font-mono font-bold pr-8 w-full"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-sm pointer-events-none">g</span>
                  </div>
                  {silverGrams && liveSilverRate > 0 && (
                    <p className="text-muted text-[11px] font-mono font-bold mt-2 opacity-70">
                      ≈ {fmt(liveSilverVal)} <span className="opacity-50">· Rate: ₹{new Intl.NumberFormat('en-IN').format(liveSilverRate)}/g</span>
                    </p>
                  )}
                </div>
              </div>

              {/* ── Save Button ───────────────────────────────────────────────── */}
              <button
                onClick={handleSave} disabled={saving}
                className="w-full py-4 rounded border border-warning/30 bg-warning/[0.06] hover:bg-warning/[0.12] text-warning text-[11px] font-display font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50"
              >
                {saving
                  ? <><span className="w-4 h-4 border-2 border-warning/30 border-t-warning rounded-full animate-spin" />Saving…</>
                  : <><Save size={14} />Save Holdings</>
                }
              </button>
            </div>
          </div>

          {/* Info footnote */}
          <div className="panel p-5 flex gap-4 border border-white/[0.03]">
            <div className="w-8 h-8 rounded border border-white/5 bg-[#0C0D10] flex flex-shrink-0 items-center justify-center text-muted">
              <Info size={13} />
            </div>
            <div>
              <p className="text-foreground font-display font-bold text-[12px] uppercase tracking-widest mb-1.5">How rates work</p>
              <p className="text-muted text-[11px] font-mono leading-relaxed opacity-70">
                Rates are fetched live from market APIs. Value shown is an estimate based on market price — actual buying/selling rates may vary by ±2–3% by jeweller.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
