import { useEffect, useState, useCallback } from 'react'
import api from '../api/axios'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import { RefreshCw, Save, Gem, Coins, Info, ChevronDown, BarChart3, Layers } from 'lucide-react'

const LS_KEY = 'fintrack_metal_rates_cache'

const PURITIES = [
  { value: '24K', label: '24K', badge: 'INVESTMENT GRADE — 99.9%' },
  { value: '22K', label: '22K', badge: 'JEWELLERY GRADE — 91.7%' },
  { value: '18K', label: '18K', badge: 'ALLOY GRADE — 75.0%' },
]

function RateTile({ label, value, icon: Icon, active }) {
  return (
    <div className={`panel p-5 border transition-all ${active ? 'border-accent/40 bg-accent/[0.02]' : 'border-white/[0.04] hover:border-white/10'}`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={13} className={active ? 'text-accent' : 'text-muted'} />
        <span className="text-[9px] font-bold font-display uppercase tracking-[0.25em] text-muted">{label}</span>
      </div>
      <p className={`text-2xl font-mono font-bold tracking-tight ${active ? 'text-accent' : 'text-foreground'}`}>
        ₹{new Intl.NumberFormat('en-IN').format(value)}
      </p>
      <p className="text-[10px] font-display font-bold text-muted uppercase tracking-[0.15em] mt-1.5 opacity-40">per gram</p>
    </div>
  )
}

function HoldingRow({ icon, labelClass, name, grams, rate, value, purity }) {
  if (grams <= 0) return null
  return (
    <div className="grid grid-cols-12 items-center px-4 py-4 rounded border border-white/[0.03] bg-surface/20 hover:border-white/10 hover:bg-white/[0.015] transition-all gap-4">
      <div className="col-span-1 text-lg">{icon}</div>
      <div className="col-span-7">
        <p className="text-foreground font-display font-bold text-[13px] tracking-wide">{name}{purity ? ` — ${purity}` : ''}</p>
        <p className="text-muted text-[10px] font-mono mt-0.5 opacity-60">
          {grams}g × ₹{new Intl.NumberFormat('en-IN').format(rate)}/g
        </p>
      </div>
      <div className="col-span-4 text-right">
        <p className={`font-mono font-bold text-[15px] ${labelClass}`}>{fmt(value)}</p>
        <p className="text-[9px] font-display uppercase tracking-widest text-muted font-bold mt-1 opacity-50">{grams}g</p>
      </div>
    </div>
  )
}

export default function Metals() {
  const [portfolio, setPortfolio] = useState(null)
  const [rates, setRates]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showPurityDrop, setShowPurityDrop] = useState(false)

  const [goldGrams,   setGoldGrams]   = useState('')
  const [goldPurity,  setGoldPurity]  = useState('24K')
  const [silverGrams, setSilverGrams] = useState('')

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
      setGoldGrams(pRes.data.gold.grams > 0 ? String(pRes.data.gold.grams) : '')
      setSilverGrams(pRes.data.silver.grams > 0 ? String(pRes.data.silver.grams) : '')
      setGoldPurity(pRes.data.gold.purity || '24K')
      try { localStorage.setItem(LS_KEY, JSON.stringify({ ...rRes.data, ts: Date.now() })) } catch {}
    } catch (err) {
      try {
        const cached = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
        if (cached) { setRates(cached); toast('Showing cached rates (offline)', { icon: 'ℹ️' }) }
      } catch {}
      if (!silent) toast.error('Failed to load metal prices')
    } finally { setLoading(false); setRefreshing(false) }
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
      toast.success('Portfolio calibrated.')
      fetchAll(true)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Calibration Failed')
    } finally { setSaving(false) }
  }

  const liveGoldRate   = rates ? rates.gold[goldPurity] || rates.gold['24K'] : 0
  const liveSilverRate = rates?.silver || 0
  const liveGoldVal    = (parseFloat(goldGrams) || 0) * liveGoldRate
  const liveSilverVal  = (parseFloat(silverGrams) || 0) * liveSilverRate
  const liveTotalVal   = liveGoldVal + liveSilverVal

  const ratesAge = portfolio?.fetched_at ? Math.round((Date.now() - new Date(portfolio.fetched_at).getTime()) / 60000) : null

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-5">
      <div className="w-10 h-10 border-[3px] border-warning/20 border-t-warning rounded-full animate-spin" />
      <p className="text-muted text-[11px] font-display uppercase tracking-[0.3em] font-bold">Fetching live market rates...</p>
    </div>
  )

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 animate-stagger-1">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-widest uppercase text-foreground">Metal Portfolio</h1>
          <p className="obsidian-label mt-2">COMMODITY HOLDINGS TRACKER</p>
        </div>
        <button onClick={() => fetchAll(true)}
          className="panel px-4 py-3 bg-surface hover:bg-white/5 border border-white/[0.05] text-muted hover:text-white transition-colors flex items-center gap-3 font-display uppercase tracking-widest font-bold text-[10px]">
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Sync Rates
        </button>
      </div>

      {/* Live Rate Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <RateTile label="Gold 24K" value={rates?.gold?.['24K'] || 0} icon={Gem} active={goldPurity === '24K'} />
        <RateTile label="Gold 22K" value={rates?.gold?.['22K'] || 0} icon={Gem} active={goldPurity === '22K'} />
        <RateTile label="Gold 18K" value={rates?.gold?.['18K'] || 0} icon={Gem} active={goldPurity === '18K'} />
        <RateTile label="Silver" value={rates?.silver || 0} icon={Coins} />
      </div>

      {/* Rate freshness */}
      <div className="flex items-center gap-2.5 px-1">
        <div className={`w-1.5 h-1.5 rounded-full ${ratesAge !== null && ratesAge < 10 ? 'bg-accent animate-pulse' : 'bg-warning'}`} />
        <p className="text-muted text-[9px] font-display uppercase tracking-[0.25em] font-bold">
          {portfolio?.source || 'Live rates'} — {ratesAge !== null ? (ratesAge < 1 ? 'JUST UPDATED' : `${ratesAge}m AGO`) : 'UPDATING...'}
          {ratesAge !== null && ratesAge > 60 && <span className="text-warning ml-2">[CACHE]</span>}
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: Portfolio Value Summary */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Total Value Panel */}
          <div className="panel p-8 relative overflow-hidden border border-warning/10">
            <div className="absolute left-0 top-0 w-1 h-full bg-warning/60" />

            <div className="relative z-10">
              <div className="obsidian-label text-warning mb-4">Live Portfolio Value</div>
              <p className="text-5xl font-mono font-bold text-foreground tracking-tight leading-none mb-2">
                {fmt(liveTotalVal)}
              </p>
              <p className="text-muted text-[10px] font-display uppercase font-bold tracking-widest mt-3 opacity-50">Live market estimate</p>

              {liveTotalVal > 0 && (
                <div className="mt-8 pt-6 border-t border-white/[0.04] space-y-4">
                  {(parseFloat(goldGrams) || 0) > 0 && (
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded border border-warning/20 bg-warning/5 flex items-center justify-center text-sm">🥇</div>
                        <div>
                          <p className="text-foreground text-[12px] font-display font-bold">{goldGrams}g Gold — {goldPurity}</p>
                          <p className="text-[10px] font-mono text-muted opacity-50">@ ₹{new Intl.NumberFormat('en-IN').format(liveGoldRate)}/g</p>
                        </div>
                      </div>
                      <span className="text-warning font-mono font-bold text-[14px]">{fmt(liveGoldVal)}</span>
                    </div>
                  )}
                  {(parseFloat(silverGrams) || 0) > 0 && (
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded border border-white/10 bg-white/5 flex items-center justify-center text-sm">🥈</div>
                        <div>
                          <p className="text-foreground text-[12px] font-display font-bold">{silverGrams}g Silver</p>
                          <p className="text-[10px] font-mono text-muted opacity-50">@ ₹{liveSilverRate}/g</p>
                        </div>
                      </div>
                      <span className="text-muted font-mono font-bold text-[14px]">{fmt(liveSilverVal)}</span>
                    </div>
                  )}
                </div>
              )}

              {liveTotalVal === 0 && (
                <p className="text-muted text-[12px] font-mono mt-6 opacity-40 italic">Configure holdings to see live valuation.</p>
              )}
            </div>
          </div>

          {/* Saved Holdings (from DB) */}
          {portfolio && (portfolio.gold.grams > 0 || portfolio.silver.grams > 0) && (
            <div className="panel p-5">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/[0.04]">
                <BarChart3 size={13} className="text-accent" />
                <span className="obsidian-label text-accent">Committed Holdings</span>
              </div>
              <div className="flex flex-col gap-3">
                <HoldingRow icon="🥇" labelClass="text-warning" name="Gold" grams={portfolio.gold.grams} purity={portfolio.gold.purity} rate={portfolio.gold.rate_per_gram} value={portfolio.gold.value} />
                <HoldingRow icon="🥈" labelClass="text-muted" name="Silver" grams={portfolio.silver.grams} rate={portfolio.silver.rate_per_gram} value={portfolio.silver.value} />
              </div>
            </div>
          )}
        </div>

        {/* Right: Update Holdings Form */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          <div className="panel p-8 relative overflow-hidden bg-[#0B0C10]">
            <h2 className="obsidian-label text-muted mb-8">CALIBRATE HOLDINGS POSITION</h2>

            <div className="space-y-6">
              {/* ── Gold Section ── */}
              <div className="p-6 rounded border border-warning/10 bg-warning/[0.02] relative">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-xl">🥇</span>
                  <div>
                    <h3 className="text-foreground font-display font-bold text-[13px] uppercase tracking-widest">Gold Reserve</h3>
                    <p className="text-[9px] text-muted font-display font-bold tracking-widest uppercase mt-0.5">{PURITIES.find(p => p.value === goldPurity)?.badge}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Weight (Grams)</label>
                    <div className="relative group">
                      <input type="number" min="0" step="0.1" placeholder="0.0" value={goldGrams} onChange={e => setGoldGrams(e.target.value)}
                        className="obsidian-input text-xl font-bold pr-10" />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-sm">g</span>
                    </div>
                    {goldGrams && liveGoldRate > 0 && (
                      <p className="text-warning text-[11px] font-mono font-bold mt-2 ml-1">≈ {fmt(liveGoldVal)}</p>
                    )}
                  </div>

                  {/* Purity Dropdown */}
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Purity Grade</label>
                    <div className="relative">
                      <button type="button" onClick={() => setShowPurityDrop(d => !d)}
                        className="obsidian-input w-full text-left flex justify-between items-center font-display font-bold text-[13px] uppercase tracking-widest">
                        {goldPurity}
                        <ChevronDown size={15} className={`text-muted transition-transform duration-200 ${showPurityDrop ? 'rotate-180' : ''}`} />
                      </button>
                      {showPurityDrop && (
                        <div className="absolute z-50 left-0 right-0 mt-2 rounded border border-white/5 bg-[#0D0E12] shadow-2xl overflow-hidden">
                          {PURITIES.map((p, i) => (
                            <button key={p.value} type="button" onMouseDown={(e) => { e.preventDefault(); setGoldPurity(p.value); setShowPurityDrop(false) }}
                              className={`w-full text-left px-5 py-4 transition-colors flex items-center justify-between ${i ? 'border-t border-white/[0.04]' : ''} ${goldPurity === p.value ? 'bg-warning/5 text-warning' : 'hover:bg-white/5 text-foreground'}`}>
                              <div>
                                <p className="font-display font-bold text-[12px] uppercase tracking-widest">{p.value}</p>
                                <p className="text-[9px] font-display font-bold tracking-[0.15em] uppercase mt-0.5 opacity-50">{p.badge}</p>
                              </div>
                              {goldPurity === p.value && <div className="w-1.5 h-1.5 rounded-full bg-warning" />}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] font-mono text-muted mt-2.5 ml-1 opacity-50">
                        Live: ₹{new Intl.NumberFormat('en-IN').format(liveGoldRate)}/g
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Silver Section ── */}
              <div className="p-6 rounded border border-white/[0.04] bg-white/[0.01] relative">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-xl">🥈</span>
                  <div>
                    <h3 className="text-foreground font-display font-bold text-[13px] uppercase tracking-widest">Silver Reserve</h3>
                    <p className="text-[9px] text-muted font-display font-bold tracking-widest uppercase mt-0.5">SPOT MARKET PRICE</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-3 ml-1">Weight (Grams)</label>
                  <div className="relative group">
                    <input type="number" min="0" step="1" placeholder="0" value={silverGrams} onChange={e => setSilverGrams(e.target.value)}
                      className="obsidian-input text-xl font-bold pr-10" />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted font-display font-bold text-sm">g</span>
                  </div>
                  {silverGrams && liveSilverRate > 0 && (
                    <p className="text-muted text-[11px] font-mono font-bold mt-2 ml-1 opacity-70">
                      ≈ {fmt(liveSilverVal)} <span className="opacity-50">· Rate: ₹{liveSilverRate}/g</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <button onClick={handleSave} disabled={saving}
                className="w-full py-4 rounded border border-warning/40 text-[11px] font-display font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50"
                style={{ background: saving ? 'transparent' : 'rgba(245,158,11,0.08)', color: saving ? '#666' : '#f59e0b' }}>
                {saving
                  ? <><span className="w-4 h-4 border-2 border-warning/30 border-t-warning rounded-full animate-spin" />Calibrating...</>
                  : <><Save size={14} />Commit Holdings Position</>
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
              <p className="text-foreground font-display font-bold text-[12px] uppercase tracking-widest mb-1.5">Rate Methodology</p>
              <p className="text-muted text-[11px] font-mono leading-relaxed opacity-70">
                Rates are fetched from live market APIs. The valuation shown is an estimate — actual buying or selling rates may vary by ±2–3% depending on the jeweller or exchange.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
