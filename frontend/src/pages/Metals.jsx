import { useEffect, useState, useCallback } from 'react'
import api from '../api/axios'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import { RefreshCw, Save, Gem, Coins, Info, ChevronDown, Sparkles, BarChart3 } from 'lucide-react'

const LS_KEY = 'fintrack_metal_rates_cache'

const PURITIES = [
  { value: '24K', label: '24K — 99.9% Pure', badge: 'Investment Grade' },
  { value: '22K', label: '22K — 91.7% (Jewellery)', badge: 'Most Common' },
  { value: '18K', label: '18K — 75.0% (Mixed)', badge: 'Alloy' },
]

function RateBadge({ label, value, colorClass, borderClass, bgClass, icon: Icon }) {
  return (
    <div className={`flex flex-col gap-2 p-4 rounded-2xl border ${bgClass} ${borderClass}`}>
      <div className="flex items-center gap-1.5">
        <Icon size={14} className={colorClass} />
        <span className={`text-[10px] uppercase font-bold tracking-widest ${colorClass} opacity-80`}>{label}</span>
      </div>
      <div>
        <span className={`text-xl font-display font-bold ${colorClass}`}>₹{new Intl.NumberFormat('en-IN').format(value)}</span>
        <span className="text-[10px] font-bold text-muted ml-1">/g</span>
      </div>
    </div>
  )
}

function HoldingRow({ icon, labelClass, name, grams, rate, value, purity }) {
  if (grams <= 0) return null
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0 last:pb-0">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 text-xl shadow-inner border border-white/5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-semibold text-sm">{name}{purity ? ` (${purity})` : ''}</p>
        <p className="text-muted text-[11px] font-medium mt-0.5">
          {grams}g × ₹{new Intl.NumberFormat('en-IN').format(rate)}/g
        </p>
      </div>
      <div className="text-right">
        <p className={`font-display font-bold text-lg ${labelClass}`}>{fmt(value)}</p>
        <p className="text-muted text-[10px] uppercase tracking-widest font-bold mt-0.5">{grams}g held</p>
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
      toast.success('Holdings saved!')
      fetchAll(true)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save')
    } finally { setSaving(false) }
  }

  const liveGoldRate  = rates ? rates.gold[goldPurity]  || rates.gold['24K'] : 0
  const liveSilverRate = rates?.silver || 0
  const liveGoldVal   = (parseFloat(goldGrams) || 0) * liveGoldRate
  const liveSilverVal = (parseFloat(silverGrams) || 0) * liveSilverRate
  const liveTotalVal  = liveGoldVal + liveSilverVal

  const ratesAge = portfolio?.fetched_at ? Math.round((Date.now() - new Date(portfolio.fetched_at).getTime()) / 60000) : null

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-[3px] border-warning/20 border-t-warning rounded-full animate-spin" />
      <p className="text-muted font-medium text-sm">Fetching live market rates...</p>
    </div>
  )

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 animate-stagger-1">

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Metal Portfolio</h1>
          <p className="text-muted mt-1 font-medium">Track Gold & Silver using live market rates.</p>
        </div>
        <button onClick={() => fetchAll(true)}
          className="panel px-4 py-2.5 bg-surface hover:bg-white/5 border border-border text-muted hover:text-foreground transition-colors flex items-center gap-2 font-semibold text-sm">
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Refresh Rates</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <RateBadge label="Gold 24K" value={rates?.gold?.['24K'] || 0} colorClass="text-warning" bgClass="bg-warning/10" borderClass="border-warning/20" icon={Gem} />
        <RateBadge label="Gold 22K" value={rates?.gold?.['22K'] || 0} colorClass="text-yellow-400" bgClass="bg-yellow-400/10" borderClass="border-yellow-400/20" icon={Gem} />
        <RateBadge label="Gold 18K" value={rates?.gold?.['18K'] || 0} colorClass="text-amber-500" bgClass="bg-amber-500/10" borderClass="border-amber-500/20" icon={Gem} />
        <RateBadge label="Silver"   value={rates?.silver || 0}        colorClass="text-slate-300" bgClass="bg-slate-300/10" borderClass="border-slate-300/20" icon={Coins} />
      </div>

      <div className="flex items-center gap-2 px-1">
        <Info size={14} className="text-muted" />
        <p className="text-muted text-[11px] font-bold uppercase tracking-widest">
          {portfolio?.source || 'Live rates'} • {ratesAge !== null ? (ratesAge < 1 ? 'Just updated' : `${ratesAge}m ago`) : ''} {ratesAge !== null && ratesAge > 60 && <span className="text-warning ml-1"> (Cached)</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <div className="panel p-8 flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
            <div className="absolute top-[-50%] right-[-10%] w-[80%] h-[150%] bg-warning/10 blur-[80px] pointer-events-none group-hover:bg-warning/20 transition-all duration-700" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-warning to-orange-400" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-warning" />
                <span className="text-[10px] font-bold text-warning uppercase tracking-widest">Total Value</span>
              </div>
              <p className="text-5xl font-display font-bold text-foreground tracking-tight">{fmt(liveTotalVal)}</p>
              <p className="text-muted text-xs font-semibold mt-2 uppercase tracking-widest">Live Portfolio Estimate</p>
            </div>

            <div className="space-y-4 mt-8 relative z-10 pt-6 border-t border-white/5">
              {(parseFloat(goldGrams) || 0) > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🥇</span>
                    <span className="text-foreground text-sm font-semibold">{goldGrams}g Gold ({goldPurity})</span>
                  </div>
                  <span className="text-warning font-bold">{fmt(liveGoldVal)}</span>
                </div>
              )}
              {(parseFloat(silverGrams) || 0) > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🥈</span>
                    <span className="text-foreground text-sm font-semibold">{silverGrams}g Silver</span>
                  </div>
                  <span className="text-slate-300 font-bold">{fmt(liveSilverVal)}</span>
                </div>
              )}
              {liveTotalVal === 0 && (
                <p className="text-muted text-sm font-semibold text-center italic">No holdings entered</p>
              )}
            </div>
          </div>

          {/* Actual DB holdings breakdown if existing */}
          {portfolio && (portfolio.gold.grams > 0 || portfolio.silver.grams > 0) && (
            <div className="panel p-6 mt-6">
              <h3 className="text-foreground font-display font-bold text-lg mb-5 flex items-center gap-2"><BarChart3 size={18} className="text-accent" /> Saved Holdings</h3>
              <HoldingRow icon="🥇" labelClass="text-warning" name="Gold" grams={portfolio.gold.grams} purity={portfolio.gold.purity} rate={portfolio.gold.rate_per_gram} value={portfolio.gold.value} />
              <HoldingRow icon="🥈" labelClass="text-slate-300" name="Silver" grams={portfolio.silver.grams} rate={portfolio.silver.rate_per_gram} value={portfolio.silver.value} />
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <div className="panel p-8 relative overflow-hidden">
            <h2 className="text-foreground font-display font-bold text-xl mb-6">Update Your Holdings</h2>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-warning/20 bg-warning/5 relative">
                <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] bg-warning/10 pointer-events-none" />
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <span className="text-2xl drop-shadow-md">🥇</span>
                  <h3 className="text-foreground font-display font-bold text-lg">Gold</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Weight (grams)</label>
                    <div className="relative group">
                      <input type="number" min="0" step="0.1" placeholder="0.0" value={goldGrams} onChange={e => setGoldGrams(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-[16px] py-3.5 px-4 text-white font-display text-lg font-bold focus:outline-none focus:border-warning focus:bg-warning/5 transition-all shadow-inner" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-bold text-sm">g</span>
                    </div>
                    {goldGrams && liveGoldRate > 0 && <p className="text-warning text-xs font-bold mt-2 ml-1">≈ {fmt(liveGoldVal)}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Purity</label>
                    <div className="relative">
                      <button type="button" onClick={() => setShowPurityDrop(d => !d)}
                        className="w-full bg-black/50 border border-white/10 rounded-[16px] py-4 px-4 text-white font-bold text-sm focus:outline-none focus:border-warning transition-all shadow-inner flex justify-between items-center">
                        {goldPurity}
                        <ChevronDown size={16} className={`text-muted transition-transform ${showPurityDrop ? 'rotate-180' : ''}`} />
                      </button>
                      {showPurityDrop && (
                        <div className="absolute z-20 left-0 right-0 mt-2 rounded-[16px] border border-white/10 bg-surface shadow-soft-drop overflow-hidden">
                          {PURITIES.map((p, i) => (
                            <button key={p.value} type="button" onClick={() => { setGoldPurity(p.value); setShowPurityDrop(false) }}
                              className={`w-full text-left px-5 py-3.5 transition-colors ${i ? 'border-t border-white/5' : ''} ${goldPurity === p.value ? 'bg-warning/10 border-l-2 border-l-warning' : 'hover:bg-white/5 border-l-2 border-l-transparent'}`}>
                              <p className={`font-bold text-sm ${goldPurity === p.value ? 'text-warning' : 'text-foreground'}`}>{p.value}</p>
                              <p className="text-muted text-[10px] uppercase font-bold tracking-widest mt-1">{p.badge}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-muted text-[11px] font-bold uppercase tracking-widest mt-2 ml-1">Rate: ₹{new Intl.NumberFormat('en-IN').format(liveGoldRate)}/g</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-slate-300/20 bg-slate-300/5 relative">
                 <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] bg-slate-300/10 pointer-events-none" />
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <span className="text-2xl drop-shadow-md">🥈</span>
                  <h3 className="text-foreground font-display font-bold text-lg">Silver</h3>
                </div>

                <div className="relative z-10">
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2 ml-1">Weight (grams)</label>
                  <div className="relative group">
                    <input type="number" min="0" step="1" placeholder="0" value={silverGrams} onChange={e => setSilverGrams(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-[16px] py-3.5 px-4 text-white font-display text-lg font-bold focus:outline-none focus:border-slate-300 focus:bg-slate-300/5 transition-all shadow-inner" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-bold text-sm">g</span>
                  </div>
                  {silverGrams && liveSilverRate > 0 && <p className="text-slate-300 text-xs font-bold mt-2 ml-1">≈ {fmt(liveSilverVal)} <span className="text-muted font-medium ml-1">· Rate: ₹{liveSilverRate}/g</span></p>}
                </div>
              </div>

              <button onClick={handleSave} disabled={saving}
                className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-black"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }}>
                {saving ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><Save size={18} /> Save Holdings</>}
              </button>
            </div>
          </div>
          
          <div className="panel p-5 mt-6 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex flex-shrink-0 items-center justify-center"><Info size={16} className="text-accent"/></div>
            <div>
              <p className="text-foreground font-bold text-sm mb-1">How rates work</p>
              <p className="text-muted text-xs font-medium leading-relaxed">
                Rates are fetched live from market APIs. Value shown is an estimate based on market price — actual buying/selling rates may vary by ±2-3% by jeweller.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
