import { useState } from 'react'
import { useStocks } from '../hooks/useStocks'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, TrendingDown, RefreshCw, BarChart2, Globe } from 'lucide-react'

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0B0C10] border border-white/5 rounded-sm p-4 shadow-2xl">
      <p className="text-muted text-[10px] uppercase font-bold tracking-[0.2em] font-display mb-1.5">{label}</p>
      <p className="text-foreground font-mono font-bold text-xl">{payload[0].value.toLocaleString()}</p>
    </div>
  )
}

function StockCard({ title, data, selected, onClick, icon: Icon }) {
  if (!data) return null
  
  const isUp = data.change >= 0
  const TrendIcon = isUp ? TrendingUp : TrendingDown
  const trendColor = isUp ? 'text-accent' : 'text-danger'
  
  return (
    <div 
      onClick={onClick}
      className={`panel p-6 pb-5 cursor-pointer transition-all duration-300 relative border ${
        selected ? 'border-accent/40 bg-accent/[0.02] shadow-[0_0_30px_rgba(0,255,163,0.05)]' : 'border-white/[0.05] hover:border-white/20'
      }`}
    >
      <div className="flex justify-between items-start mb-6 border-b border-white/[0.05] pb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded border border-white/5 bg-[#0C0D10] flex items-center justify-center">
            <Icon size={16} className={selected ? 'text-accent' : 'text-muted'} />
          </div>
          <div>
            <h3 className="font-display tracking-widest uppercase font-bold text-sm text-foreground">{title}</h3>
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mt-0.5">{data.symbol}</p>
          </div>
        </div>
      </div>
      
      <div>
        <p className={`text-4xl font-mono font-bold tracking-tight mb-2 ${selected ? 'text-foreground' : 'text-foreground'}`}>
          {data.currency === 'INR' ? '₹' : (data.currency === 'USD' ? '$' : '')}{data.current_price.toLocaleString()}
        </p>
        <div className="flex items-center gap-2 mt-4 text-[11px] uppercase font-bold tracking-widest font-display">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded bg-[#0C0D10] border border-white/5 ${trendColor}`}>
            <TrendIcon size={12} />
            {isUp ? '+' : ''}{data.change.toLocaleString()} ({data.change_percent.toLocaleString()}%)
          </div>
          <span className="text-muted/50 border-l border-white/10 pl-2">Session Delta</span>
        </div>
      </div>
    </div>
  )
}

export default function Stocks() {
  const [range, setRange] = useState('1m')
  const { data, loading, refreshing, error, refresh } = useStocks(range)
  const [activeTab, setActiveTab] = useState('nifty')
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-[3px] border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }
  
  if (error || (!data?.nifty && !data?.nasdaq)) {
    return (
      <div className="panel p-16 flex flex-col items-center justify-center text-center border-dashed mt-10">
        <div className="w-12 h-12 rounded border border-white/5 bg-[#0C0D10] flex items-center justify-center mb-6 text-muted">
          <BarChart2 size={20} />
        </div>
        <p className="text-foreground font-display font-bold text-xl uppercase tracking-widest mb-3">Market Telemetry Offline</p>
        <p className="text-muted text-[13px] font-mono max-w-sm mb-6">{error || "Failed to establish index node connection. Verify API endpoints."}</p>
        <button onClick={refresh} className="panel px-4 py-3 bg-surface hover:bg-white/5 border border-white/[0.05] text-muted hover:text-white transition-colors flex items-center gap-3 font-display uppercase tracking-widest font-bold text-[10px]">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Attempt Reconnect
        </button>
      </div>
    )
  }

  const activeData = activeTab === 'nifty' ? data.nifty : data.nasdaq
  const isUp = activeData?.change >= 0
  const strokeColor = isUp ? '#00FFA3' : '#FF3366'
  const gradientId = `colorStock${activeTab}`

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 animate-stagger-1">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-display font-bold tracking-widest uppercase text-foreground">Global Markets</h1>
           <p className="obsidian-label mt-2">INDEX PERFORMANCE TELEMETRY</p>
        </div>
        <button onClick={refresh} className="panel px-4 py-3 bg-surface hover:bg-white/5 border border-white/[0.05] text-muted hover:text-white transition-colors flex items-center gap-3 font-display uppercase tracking-widest font-bold text-[10px]">
           <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh Feed
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <StockCard 
          title="Nifty 50 Index" 
          data={data.nifty} 
          selected={activeTab === 'nifty'} 
          onClick={() => setActiveTab('nifty')}
          icon={BarChart2}
        />
        <StockCard 
          title="NASDAQ Composite" 
          data={data.nasdaq} 
          selected={activeTab === 'nasdaq'} 
          onClick={() => setActiveTab('nasdaq')}
          icon={Globe}
        />
      </div>

      {/* Chart */}
      {activeData && activeData.history && activeData.history.length > 0 && (
        <div className={`panel animate-stagger-2 transition-opacity duration-300 ${refreshing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between mb-2">
            <div>
              <h3 className="obsidian-label text-foreground mb-4">{activeTab === 'nifty' ? 'NIFTY 50' : 'NASDAQ'} HISTORICAL TRAJECTORY</h3>
              <div className="flex flex-wrap items-center gap-2 p-1 bg-[#101115] border border-white/5 rounded w-fit">
                {[ {id:'1d', label:'1D'}, {id:'1w', label:'1W'}, {id:'1m', label:'1M'}, {id:'1y', label:'1Y'}, {id:'max', label:'MAX'} ].map(r => (
                  <button 
                    key={r.id} 
                    onClick={() => setRange(r.id)}
                    className={`px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] font-display uppercase transition-all rounded outline-none ${range === r.id ? 'bg-[#1A1C21] text-accent border border-white/5' : 'text-muted border border-transparent hover:text-white'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 md:text-right mt-6 md:mt-0">
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-display text-muted">Observation Window</span>
               <span className="text-[12px] font-mono font-bold text-foreground opacity-80 border-b border-white/10 pb-1">
                 {activeData.history[0].date} <span className="text-muted px-1">—</span> {activeData.history[activeData.history.length-1].date}
               </span>
            </div>
          </div>
          
          <div className="h-[400px] w-full px-4 pb-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeData.history} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} 
                  tickLine={false} 
                  tick={{ fill:'rgba(255,255,255,0.4)', fontSize:11, fontFamily:'monospace' }} 
                  dy={10}
                  minTickGap={40}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill:'rgba(255,255,255,0.3)', fontSize:11, fontFamily:'monospace' }}
                  dx={-10}
                  orientation="right"
                />
                <Tooltip content={<ChartTip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '2 2' }} />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke={strokeColor} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill={`url(#${gradientId})`} 
                  activeDot={{ r: 5, strokeWidth: 0, fill: strokeColor }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
