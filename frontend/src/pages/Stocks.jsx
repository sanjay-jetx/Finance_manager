import { useState } from 'react'
import { useStocks } from '../hooks/useStocks'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, TrendingDown, RefreshCw, BarChart2, Globe } from 'lucide-react'
import { fmt } from '../utils/format'

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-soft-drop">
      <p className="text-muted text-xs font-semibold mb-1 uppercase tracking-widest">{label}</p>
      <p className="text-foreground font-display font-bold text-lg">{payload[0].value.toLocaleString()}</p>
    </div>
  )
}

function StockCard({ title, data, selected, onClick, icon: Icon, currencySync }) {
  if (!data) return null
  
  const isUp = data.change >= 0
  const TrendIcon = isUp ? TrendingUp : TrendingDown
  const trendColor = isUp ? 'text-success' : 'text-danger'
  const trendBg = isUp ? 'bg-success/10' : 'bg-danger/10'
  
  return (
    <div 
      onClick={onClick}
      className={`panel p-6 cursor-pointer transition-all duration-300 relative overflow-hidden group ${
        selected ? 'border-accent shadow-[0_0_30px_rgba(99,102,241,0.15)] ring-1 ring-accent/50' : 'hover:border-white/20'
      }`}
    >
      {selected && <div className="absolute top-0 left-0 w-1 h-full bg-accent" />}
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'bg-accent/20 text-accent shadow-glow-accent' : 'bg-white/10 border border-white/10 text-muted'}`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-foreground">{title}</h3>
            <p className="text-xs font-semibold text-muted uppercase tracking-widest">{data.symbol}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-3xl font-display font-bold text-foreground">
          {data.currency === 'INR' ? '₹' : (data.currency === 'USD' ? '$' : '')}{data.current_price.toLocaleString()}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${trendBg} ${trendColor}`}>
            <TrendIcon size={14} />
            {isUp ? '+' : ''}{data.change.toLocaleString()} ({data.change_percent.toLocaleString()}%)
          </div>
          <span className="text-xs font-medium text-muted">Today</span>
        </div>
      </div>
    </div>
  )
}

export default function Stocks() {
  const [range, setRange] = useState('1m')
  const { data, loading, refreshing, error, refresh } = useStocks(range)
  const [activeTab, setActiveTab] = useState('nifty') // 'nifty' or 'nasdaq'
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-[3px] border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }
  
  if (error || (!data?.nifty && !data?.nasdaq)) {
    return (
      <div className="panel p-12 flex flex-col items-center justify-center text-center border-dashed mt-10">
        <div className="w-14 h-14 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center mb-5 text-danger">
          <BarChart2 size={24} />
        </div>
        <p className="text-foreground font-display font-bold text-lg mb-1.5">Market Data Unavailable</p>
        <p className="text-muted text-sm mb-6 max-w-sm">{error || "Failed to fetch stock index data. Please try again later."}</p>
        <button onClick={refresh} className="btn-primary">
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Try Again
        </button>
      </div>
    )
  }

  const activeData = activeTab === 'nifty' ? data.nifty : data.nasdaq
  const isUp = activeData?.change >= 0
  const strokeColor = isUp ? '#10b981' : '#ef4444' // success or danger
  const gradientId = `colorStock${activeTab}`

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 animate-stagger-1">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Markets</h1>
           <p className="text-muted mt-1 font-medium">Global stock indices performance</p>
        </div>
        <button onClick={refresh} className="p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-muted hover:text-white transition-all shadow-sm">
           <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <StockCard 
          title="Nifty 50" 
          data={data.nifty} 
          selected={activeTab === 'nifty'} 
          onClick={() => setActiveTab('nifty')}
          icon={BarChart2}
        />
        <StockCard 
          title="NASDAQ" 
          data={data.nasdaq} 
          selected={activeTab === 'nasdaq'} 
          onClick={() => setActiveTab('nasdaq')}
          icon={Globe}
        />
      </div>

      {/* Chart */}
      {activeData && activeData.history && activeData.history.length > 0 && (
        <div className={`panel p-6 lg:p-8 animate-stagger-2 transition-opacity duration-300 ${refreshing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-display font-bold text-foreground mb-3">{activeTab === 'nifty' ? 'Nifty 50' : 'NASDAQ'} Trend</h3>
              <div className="flex flex-wrap items-center gap-2">
                {[ {id:'1d', label:'1D'}, {id:'1w', label:'1W'}, {id:'1m', label:'1M'}, {id:'1y', label:'1Y'}, {id:'max', label:'MAX'} ].map(r => (
                  <button 
                    key={r.id} 
                    onClick={() => setRange(r.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${range === r.id ? 'bg-accent text-white shadow-md' : 'bg-white/5 text-muted hover:bg-white/10 hover:text-foreground'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-end flex-col gap-1 text-right">
              <span className="text-xs font-bold uppercase tracking-widest text-muted">Range</span>
              <span className="text-sm font-semibold text-foreground">
                {activeData.history[0].date} — {activeData.history[activeData.history.length-1].date}
              </span>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeData.history} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill:'#a1a1aa', fontSize:12, fontWeight:500 }} 
                  dy={10}
                  minTickGap={30}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill:'#a1a1aa', fontSize:12, fontWeight:500 }}
                  dx={-10}
                  orientation="right"
                />
                <Tooltip content={<ChartTip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke={strokeColor} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill={`url(#${gradientId})`} 
                  activeDot={{ r: 6, strokeWidth: 0, fill: strokeColor }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
