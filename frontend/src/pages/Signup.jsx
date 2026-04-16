import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff, Layers, Lock, Mail, ArrowRight, Shield, Terminal, CheckSquare, XSquare, User } from 'lucide-react'

/* ─── Password strength ──────────────────────────────────────────────── */
function getStrength(p) {
  let s = 0
  if (p.length >= 8)          s++
  if (/[A-Z]/.test(p))        s++
  if (/[0-9]/.test(p))        s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return s
}
const STRENGTH = [
  { label: 'Unacceptable', bar: 'bg-danger', text: 'text-danger' },
  { label: 'Weak', bar: 'bg-[#fb923c]', text: 'text-[#fb923c]' },
  { label: 'Fair', bar: 'bg-[#fbbf24]', text: 'text-[#fbbf24]' },
  { label: 'Good', bar: 'bg-[#a3e635]', text: 'text-[#a3e635]' },
  { label: 'Secure', bar: 'bg-accent', text: 'text-accent' },
]

function Req({ met, text }) {
  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-bold tracking-wider font-display uppercase ${met ? 'text-accent' : 'text-muted/50'} transition-colors`}>
      {met ? <CheckSquare size={12} className="text-accent" /> : <XSquare size={12} className="text-muted/40" />}
      {text}
    </span>
  )
}

/* ─── Feature check list for left panel ─────────────────────────────── */
const FEATURES = [
  'Cash & UPI Distributed Ledger',
  'Real-Time Capital Flow Analysis',
  'Encrypted Receivable Tracking',
  'Automated Budget Ops',
  'Zero-Latency Synchronization',
]

export default function Signup() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]     = useState({ name: '', email: '', password: '' })
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [emailOk, setEmailOk]   = useState(null)
  const [shake, setShake]       = useState(false)

  const strength = form.password ? getStrength(form.password) : -1
  const sc = strength >= 0 ? STRENGTH[strength] : null

  useEffect(() => {
    if (!form.email) return setEmailOk(null)
    setEmailOk(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
  }, [form.email])

  const triggerShake = (msg) => {
    setShake(true); setTimeout(() => setShake(false), 500); toast.error(msg)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (emailOk === false) { triggerShake('Invalid email sequence'); return }
    if (strength < 2) { triggerShake('Security clearance denied: Password too weak'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/signup', form)
      login(res.data.access_token, { user_name: res.data.user_name }, res.data.expires_in)
      toast.success(`System Access Granted. Welcome, ${res.data.user_name}.`)
      navigate('/dashboard')
    } catch (err) {
      triggerShake(err.response?.data?.detail || 'Registration sequence failed')
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

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-xl">
          <div className="animate-stagger-2 mb-10">
            <div className="inline-flex items-center gap-2 mb-6 border border-accent/20 bg-accent/[0.03] px-4 py-2 rounded">
              <Terminal size={14} className="text-accent" />
              <span className="text-accent text-[10px] font-bold uppercase tracking-[0.3em] font-display">Open Access</span>
            </div>
            <h2 className="text-[48px] lg:text-[60px] font-bold text-white leading-[1.05] tracking-tight font-display mb-6">
              Establish<br />
              <span className="text-accent">New Identity.</span>
            </h2>
            <p className="text-muted text-[15px] leading-relaxed max-w-sm font-mono">
              Join operational network. Track every transaction, trace every flow, and command your net worth securely.
            </p>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-4 animate-stagger-3">
            {FEATURES.map((text, i) => (
              <div key={text} className="flex items-center gap-4" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                <div className="w-8 h-8 rounded border border-accent/20 bg-accent/5 flex items-center justify-center flex-shrink-0">
                  <CheckSquare size={14} className="text-accent" />
                </div>
                <span className="text-muted font-display font-bold text-[11px] uppercase tracking-widest">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 animate-stagger-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/5 bg-surface text-[10px] font-bold tracking-widest text-muted uppercase font-display">
              <Shield size={12} className="text-accent" /> Enterprise Grade
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

          {/* Header */}
          <div className="mb-8 animate-stagger-1">
            <h1 className="text-3xl font-display font-bold text-white tracking-tight mb-2">Register Operator</h1>
            <p className="text-muted text-[13px] font-mono">Fill operational credentials.</p>
          </div>

          {/* Card */}
          <div className={`panel p-8 sm:p-10 border border-white/[0.04] rounded outline outline-1 outline-white/[0.02] shadow-2xl bg-[#0B0C10] animate-stagger-2 ${shake ? 'animate-shake' : ''}`}>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-2 ml-1">Operator Alias</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-[#121318] border border-white/5 rounded py-4 pl-12 pr-4 text-white font-mono text-[14px] focus:outline-none focus:border-accent transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-2 ml-1">Secure Contact</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="operator@fintrack.local"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
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
                <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] font-display mb-2 ml-1">Master Key</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-[#121318] border border-white/5 rounded py-4 pl-12 pr-12 text-white font-mono text-[14px] focus:outline-none focus:border-accent transition-all shadow-inner"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Strength bar */}
                {form.password && (
                  <div className="mt-4 p-4 bg-[#121318] border border-white/5 rounded">
                    <div className="flex gap-1 mb-3">
                      {[0,1,2,3].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength && sc ? sc.bar : 'bg-white/5'}`} />
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex gap-4 flex-wrap">
                        <Req met={form.password.length >= 8}    text="8+ chars" />
                        <Req met={/[A-Z]/.test(form.password)}  text="Upper" />
                        <Req met={/[0-9]/.test(form.password)}  text="Number" />
                        <Req met={/[^A-Za-z0-9]/.test(form.password)} text="Symbol" />
                      </div>
                      {sc && <span className={`text-[9px] font-bold font-display uppercase tracking-widest ${sc.text}`}>{sc.label}</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-[52px] mt-2 flex items-center justify-center gap-3 disabled:opacity-70 group bg-surface text-foreground border border-white/5 shadow-none hover:bg-white/5"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="font-display font-bold uppercase tracking-[0.15em] text-[12px] group-hover:text-accent transition-colors">Initialize</span>
                    <ArrowRight size={14} className="text-muted group-hover:text-accent transition-colors" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] font-display">External Creation Protocol</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* Google */}
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

          {/* Login link */}
          <p className="text-center mt-8 text-[12px] text-muted font-display animate-stagger-3">
            Already verified?{' '}
            <Link to="/login" className="text-accent font-bold hover:underline underline-offset-4 tracking-wide flex inline-flex items-center justify-center gap-1.5 ml-1">
              Authenticate <ArrowRight size={12} />
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
