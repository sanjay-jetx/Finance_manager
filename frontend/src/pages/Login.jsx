import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff, Layers, Lock, Mail, ArrowRight, Shield, Zap, Terminal } from 'lucide-react'

/* ─── Floating Terminal Stat Pill ────────────────────────────────────────── */
function StatPill({ icon: Icon, label, value, delayIdx = 1 }) {
  return (
    <div className={`p-4 bg-surface/80 border border-white/5 rounded backdrop-blur-xl animate-stagger-${delayIdx} flex items-center gap-4`}>
      <div className="w-10 h-10 rounded border border-accent/20 bg-accent/5 flex items-center justify-center flex-shrink-0 text-accent">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-1">{label}</p>
        <p className="text-[14px] font-mono font-bold tracking-tight text-white">{value}</p>
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function Login() {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [emailOk, setEmailOk]   = useState(null)
  const [shake, setShake]       = useState(false)

  useEffect(() => {
    if (!email) return setEmailOk(null)
    setEmailOk(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  }, [email])

  const triggerShake = (msg) => {
    setShake(true); setTimeout(() => setShake(false), 500); toast.error(msg)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (emailOk === false) { triggerShake('Enter a valid email address'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      login(res.data.access_token, { user_name: res.data.user_name }, res.data.expires_in)
      toast.success(`System Access Granted. Welcome, ${res.data.user_name}.`)
      navigate('/dashboard')
    } catch (err) {
      triggerShake(err.response?.data?.detail || 'Authentication failed: Invalid credentials')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden font-sans relative">
      
      {/* Background terminal grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
           style={{
             backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
             backgroundSize: '32px 32px'
           }} />

      {/* ══ LEFT PANEL (Brand & Value) ══════════════════════════════════════ */}
      <div className="hidden lg:flex flex-col justify-between p-14 w-[55%] relative border-r border-white/5 z-10 bg-[#0B0C10]">
        
        {/* Glow behind text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 animate-stagger-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded border border-accent/30 bg-accent/5 flex items-center justify-center shadow-[0_0_30px_rgba(0,255,163,0.15)] text-accent">
              <Layers size={22} />
            </div>
            <div className="flex flex-col">
               <span className="text-white font-display font-bold text-2xl tracking-tight leading-none">FinTrack</span>
               <span className="text-accent text-[10px] font-bold tracking-[0.4em] mt-2 uppercase">Terminal Ops</span>
            </div>
          </div>
        </div>

        {/* Center Text & Stats */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-xl">
          <div className="animate-stagger-2 mb-12">
            <h2 className="text-[48px] lg:text-[64px] font-bold text-white leading-[1.05] tracking-tight font-display mb-6">
              Financial Control<br />
              <span className="text-accent">Protocol Active.</span>
            </h2>
            <p className="text-muted text-[15px] leading-relaxed max-w-md font-mono">
              High-density ledger tracking. End-to-end encrypted storage. Total command over personal capital flow.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatPill icon={Zap} label="System Latency" value="< 15ms" delayIdx={3} />
            <StatPill icon={Terminal} label="Ledger Engine" value="Optimized" delayIdx={4} />
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 animate-stagger-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/5 bg-surface text-[10px] font-bold tracking-widest text-muted uppercase font-display">
              <Shield size={12} className="text-accent" /> 256-bit AES
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/5 bg-surface text-[10px] font-bold tracking-widest text-muted uppercase font-display">
              Cluster Secure
            </div>
          </div>
        </div>
      </div>

      {/* ══ RIGHT PANEL (Auth Form) ═════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-[440px]">
          
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10 animate-stagger-1">
            <div className="w-14 h-14 mx-auto rounded border border-accent/20 bg-accent/5 flex items-center justify-center shadow-[0_0_30px_rgba(0,255,163,0.15)] text-accent mb-4">
              <Layers size={24} />
            </div>
            <div className="text-white font-display font-bold text-2xl tracking-tight">FinTrack</div>
            <div className="text-accent text-[9px] font-bold tracking-[0.3em] mt-1.5 uppercase">Terminal</div>
          </div>

          {/* Form Header */}
          <div className="mb-8 animate-stagger-1">
            <h1 className="text-3xl font-display font-bold text-white tracking-tight mb-2">Initialize Session</h1>
            <p className="text-muted text-[13px] font-mono">Enter operational credentials to proceed.</p>
          </div>

          {/* Form container */}
          <div className={`panel p-8 sm:p-10 border border-white/[0.04] rounded outline outline-1 outline-white/[0.02] shadow-2xl bg-[#0B0C10] animate-stagger-2 ${shake ? 'animate-shake' : ''}`}>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-2 ml-1">Operator Email</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="operator@fintrack.local"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={`w-full bg-[#121318] border rounded py-4 pl-12 pr-12 text-white font-mono text-[14px] focus:outline-none focus:border-accent transition-all shadow-inner ${
                      emailOk === false ? 'border-danger' : emailOk === true ? 'border-accent/50' : 'border-white/5'
                    }`}
                  />
                  {emailOk !== null && (
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${emailOk ? 'bg-accent shadow-[0_0_8px_rgba(0,255,163,0.8)]' : 'bg-danger shadow-[0_0_8px_rgba(255,51,102,0.8)]'}`} />
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-2 ml-1">Access Key</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-[#121318] border border-white/5 rounded py-4 pl-12 pr-12 text-white font-mono text-[14px] focus:outline-none focus:border-accent transition-all shadow-inner"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Forgot */}
              <div className="flex justify-end pt-1">
                <button type="button" onClick={() => toast.error('Key recovery protocol disabled.')} className="text-[11px] font-display font-bold text-muted hover:text-accent transition-colors">
                  Lost Key?
                </button>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="btn-primary w-full h-[52px] mt-2 flex items-center justify-center gap-3 disabled:opacity-70 group bg-surface text-foreground border border-white/5 shadow-none hover:bg-white/5">
                {loading ? (
                  <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="font-display font-bold uppercase tracking-[0.15em] text-[12px] group-hover:text-accent transition-colors">Authenticate</span>
                    <ArrowRight size={14} className="text-muted group-hover:text-accent transition-colors" />
                  </>
                )}
              </button>

            </form>

            {/* Google Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] font-display">External Auth Protocol</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* Google Sign In */}
            <div className="flex justify-center flex-col gap-4">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  setLoading(true)
                  try {
                    const res = await api.post('/auth/google', { token: credentialResponse.credential })
                    login(res.data.access_token, { user_name: res.data.user_name }, res.data.expires_in)
                    toast.success(`System Access Granted. Welcome, ${res.data.user_name}.`)
                    navigate('/dashboard')
                  } catch (err) {
                    triggerShake(err.response?.data?.detail || 'External Auth Failed')
                  } finally { setLoading(false) }
                }}
                onError={() => triggerShake('External Auth Terminated')}
                theme="filled_black"
                shape="rectangular"
                width="100%"
                text="continue_with"
                size="large"
              />
            </div>
          </div>

          <p className="text-center mt-8 text-[12px] text-muted font-display animate-stagger-3">
            Unregistered operator?{' '}
            <Link to="/signup" className="text-accent font-bold hover:underline underline-offset-4 tracking-wide">
              Request Access
            </Link>
          </p>

        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{ transform: translateX(0); }
          20%    { transform: translateX(-8px); }
          40%    { transform: translateX(8px); }
          60%    { transform: translateX(-4px); }
          80%    { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  )
}
