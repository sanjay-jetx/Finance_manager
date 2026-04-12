import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'
import { TrendingUp, Eye, EyeOff, ArrowRight, Wallet, BarChart3, Shield, Zap } from 'lucide-react'

/* ─── Floating Stat Pill ─────────────────────────────────────────────────── */
function StatPill({ icon: Icon, label, value, color, style }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10"
         style={{
           background: 'rgba(255,255,255,0.04)',
           backdropFilter: 'blur(20px)',
           boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
           ...style,
         }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
           style={{ background: color + '22', border: `1px solid ${color}33` }}>
        <Icon size={14} style={{ color }} />
      </div>
      <div>
        <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: '9px', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '2px' }}>{label}</p>
        <p style={{ color: '#fff', fontWeight: 900, fontSize: '13px', lineHeight: 1.2 }}>{value}</p>
      </div>
    </div>
  )
}

/* ─── Animated Orb ───────────────────────────────────────────────────────── */
function GlowOrb() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Outer ring */}
      <div className="absolute rounded-full border border-white/5"
           style={{ width: 380, height: 380, animation: 'orbPulse 4s ease-in-out infinite' }} />
      <div className="absolute rounded-full border border-white/[0.03]"
           style={{ width: 480, height: 480, animation: 'orbPulse 4s ease-in-out infinite 1s' }} />
      {/* Core orb */}
      <div className="absolute rounded-full"
           style={{
             width: 260, height: 260,
             background: `radial-gradient(circle at 35% 35%,
               rgba(236,72,153,0.35) 0%,
               rgba(139,92,246,0.4) 40%,
               rgba(6,182,212,0.3) 70%,
               transparent 100%)`,
             filter: 'blur(30px)',
             animation: 'orbSpin 12s linear infinite',
           }} />
      {/* Inner bright spot */}
      <div className="absolute rounded-full"
           style={{
             width: 80, height: 80,
             background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
             filter: 'blur(8px)',
           }} />
      {/* TrendingUp icon */}
      <div className="relative z-10 w-16 h-16 rounded-[22px] flex items-center justify-center"
           style={{
             background: 'rgba(255,255,255,0.07)',
             border: '1px solid rgba(255,255,255,0.12)',
             backdropFilter: 'blur(20px)',
             boxShadow: '0 0 40px rgba(139,92,246,0.3)',
           }}>
        <TrendingUp size={28} className="text-white" />
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
  const [activeField, setActiveField] = useState(null)
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
      toast.success(`Welcome back, ${res.data.user_name}! 👋`)
      navigate('/dashboard')
    } catch (err) {
      triggerShake(err.response?.data?.detail || 'Incorrect email or password')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#050508', overflow: 'hidden' }}>

      {/* ══ LEFT PANEL ══════════════════════════════════════════════════════ */}
      <div style={{
        display: 'none',
        flex: '0 0 52%',
        position: 'relative',
        overflow: 'hidden',
      }} className="lg:flex flex-col justify-between p-14">

        {/* Aurora background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `
              radial-gradient(ellipse at 15% 25%, rgba(139,92,246,0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 85% 75%, rgba(236,72,153,0.25) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.12) 0%, transparent 65%)
            `,
            animation: 'auroraShift 10s ease-in-out infinite alternate',
          }} />
          {/* Grid */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.025,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }} />
          {/* Scanlines */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.015,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)',
          }} />
        </div>

        {/* Logo */}
        <div className="relative z-10" style={{ animation: 'riseIn 0.6s ease-out 0.1s both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(139,92,246,0.4)',
            }}>
              <TrendingUp size={18} color="#fff" />
            </div>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 20, letterSpacing: '-0.5px' }}>FinTrack</span>
          </div>
        </div>

        {/* Center: Orb + text */}
        <div className="relative z-10" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

          {/* Orb area */}
          <div style={{ position: 'relative', height: 320, marginBottom: 40 }}>
            <GlowOrb />
            {/* Floating pills around orb */}
            <div style={{ position: 'absolute', top: 20, left: 0, animation: 'float 3s ease-in-out infinite' }}>
              <StatPill icon={Wallet} label="Total Balance" value="₹1,24,500" color="#10b981" />
            </div>
            <div style={{ position: 'absolute', bottom: 30, right: 0, animation: 'float 3s ease-in-out infinite 1.2s' }}>
              <StatPill icon={BarChart3} label="Savings Rate" value="+18.4%" color="#f59e0b" />
            </div>
            <div style={{ position: 'absolute', top: '55%', right: -10, animation: 'float 3s ease-in-out infinite 0.6s' }}>
              <StatPill icon={Zap} label="This Month" value="On Track ✓" color="#8b5cf6" />
            </div>
          </div>

          {/* Hero text */}
          <div style={{ animation: 'riseIn 0.7s ease-out 0.3s both' }}>
            <h2 style={{
              fontSize: 46, fontWeight: 900, color: '#fff', lineHeight: 1.08,
              letterSpacing: '-0.04em', marginBottom: 16,
            }}>
              Wealth Begins<br />
              <span style={{
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #06b6d4)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                With Clarity
              </span>
            </h2>
            <p style={{ color: 'rgba(148,163,184,0.8)', fontSize: 16, fontWeight: 500, lineHeight: 1.6, maxWidth: 380 }}>
              Every rupee tracked. Every goal met. Your complete financial command center.
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10" style={{ animation: 'riseIn 0.6s ease-out 0.5s both' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['End-to-End Encrypted', 'MongoDB Cloud', 'JWT Secured'].map(b => (
              <span key={b} style={{
                fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px',
                color: 'rgba(100,116,139,0.8)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 999, padding: '4px 10px',
              }}>
                <Shield size={8} style={{ display: 'inline', marginRight: 4 }} />{b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ══ RIGHT PANEL ═════════════════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
      }}>

        {/* Subtle right glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 60% 50%, rgba(139,92,246,0.06) 0%, transparent 65%)',
        }} />

        <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

          {/* Mobile logo */}
          <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 32, animation: 'riseIn 0.5s ease-out 0.1s both' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              justifyContent: 'center', width: 52, height: 52, borderRadius: 16,
              background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              boxShadow: '0 0 24px rgba(139,92,246,0.4)', marginBottom: 12,
            }}>
              <TrendingUp size={24} color="#fff" />
            </div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 24, letterSpacing: '-0.5px' }}>FinTrack</div>
          </div>

          {/* Header */}
          <div style={{ marginBottom: 28, animation: 'riseIn 0.6s ease-out 0.15s both' }}>
            <h1 style={{ color: '#fff', fontSize: 30, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>
              Sign in
            </h1>
            <p style={{ color: 'rgba(100,116,139,1)', fontSize: 15, fontWeight: 500 }}>
              Welcome back — your money awaits
            </p>
          </div>

          {/* Form card */}
          <div
            style={{
              borderRadius: 28,
              padding: 30,
              position: 'relative',
              background: 'linear-gradient(160deg, rgba(17,24,39,0.95), rgba(5,5,8,0.97))',
              backdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 40px 80px -20px rgba(0,0,0,0.7)',
              animation: `riseIn 0.6s ease-out 0.2s both${shake ? ', shake 0.4s ease-in-out' : ''}`,
            }}
          >
            {/* Gradient border top accent */}
            <div style={{
              position: 'absolute', top: 0, left: 30, right: 30, height: 1, borderRadius: 999,
              background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(236,72,153,0.4), transparent)',
            }} />

            <form onSubmit={handleSubmit}>

              {/* Email */}
              <div style={{ marginBottom: 18 }}>
                <label style={{
                  display: 'block', fontSize: 10, fontWeight: 800,
                  color: 'rgba(100,116,139,0.9)', textTransform: 'uppercase',
                  letterSpacing: '2.5px', marginBottom: 8,
                }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setActiveField('email')}
                    onBlur={()  => setActiveField(null)}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: activeField === 'email' ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${
                        emailOk === false ? 'rgba(239,68,68,0.5)'
                        : emailOk === true ? 'rgba(16,185,129,0.5)'
                        : activeField === 'email' ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.07)'
                      }`,
                      borderRadius: 14, padding: '13px 16px 13px 46px',
                      color: '#fff', fontSize: 15, fontWeight: 500,
                      outline: 'none',
                      boxShadow: activeField === 'email' ? '0 0 0 3px rgba(139,92,246,0.1)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />
                  {/* @ icon */}
                  <div style={{
                    position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)',
                    color: activeField === 'email' ? '#8b5cf6' : 'rgba(100,116,139,0.6)',
                    fontSize: 16, fontWeight: 700, transition: 'color 0.2s',
                  }}>@</div>
                  {/* Valid dot */}
                  {emailOk !== null && (
                    <div style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      width: 7, height: 7, borderRadius: '50%',
                      background: emailOk ? '#10b981' : '#ef4444',
                    }} />
                  )}
                </div>
                {emailOk === false && email.length > 5 && (
                  <p style={{ color: '#f87171', fontSize: 11, fontWeight: 600, marginTop: 6, marginLeft: 2 }}>
                    Please enter a valid email address
                  </p>
                )}
              </div>

              {/* Password */}
              <div style={{ marginBottom: 12 }}>
                <label style={{
                  display: 'block', fontSize: 10, fontWeight: 800,
                  color: 'rgba(100,116,139,0.9)', textTransform: 'uppercase',
                  letterSpacing: '2.5px', marginBottom: 8,
                }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setActiveField('pass')}
                    onBlur={()  => setActiveField(null)}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: activeField === 'pass' ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${activeField === 'pass' ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 14, padding: '13px 48px 13px 46px',
                      color: '#fff', fontSize: 15, fontWeight: 500,
                      outline: 'none',
                      boxShadow: activeField === 'pass' ? '0 0 0 3px rgba(139,92,246,0.1)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />
                  {/* Lock icon */}
                  <div style={{
                    position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                    color: activeField === 'pass' ? '#8b5cf6' : 'rgba(100,116,139,0.6)',
                    transition: 'color 0.2s',
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  {/* Eye toggle */}
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(100,116,139,0.7)', padding: 4,
                    display: 'flex', alignItems: 'center',
                  }}>
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Forgot */}
              <div style={{ textAlign: 'right', marginBottom: 22 }}>
                <button type="button" style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(100,116,139,0.7)', fontSize: 12, fontWeight: 600,
                  padding: 0, transition: 'color 0.2s',
                }}
                onClick={() => toast('Forgot password feature coming soon!')}
                onMouseEnter={e => e.target.style.color = '#8b5cf6'}
                onMouseLeave={e => e.target.style.color = 'rgba(100,116,139,0.7)'}
                >
                  Forgot password?
                </button>
              </div>

              {/* CTA Button — Amber Gold */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  borderRadius: 16, padding: '15px 24px',
                  background: loading ? 'rgba(245,158,11,0.5)'
                    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #f59e0b 100%)',
                  backgroundSize: '200% 100%',
                  color: '#000', fontWeight: 900, fontSize: 14,
                  textTransform: 'uppercase', letterSpacing: '2px',
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(245,158,11,0.35)',
                  transition: 'all 0.3s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  marginBottom: 20,
                }}
                onMouseEnter={e => { if (!loading) { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 12px 32px rgba(245,158,11,0.45)' }}}
                onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = loading ? 'none' : '0 8px 24px rgba(245,158,11,0.35)' }}
              >
                {loading ? (
                  <><span style={{
                    width: 16, height: 16, border: '2.5px solid rgba(0,0,0,0.3)',
                    borderTopColor: '#000', borderRadius: '50%',
                    display: 'inline-block', animation: 'spin 0.7s linear infinite',
                  }} /> Signing in...</>
                ) : (
                  <><span>Sign In</span><ArrowRight size={16} /></>
                )}
              </button>

            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0 16px' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <span style={{ margin: '0 12px', fontSize: 10, color: 'rgba(100,116,139,0.8)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Or continue with</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  setLoading(true)
                  try {
                    const res = await api.post('/auth/google', { token: credentialResponse.credential })
                    login(res.data.access_token, { user_name: res.data.user_name }, res.data.expires_in)
                    toast.success(`Welcome back, ${res.data.user_name}! 👋`)
                    navigate('/dashboard')
                  } catch (err) {
                    triggerShake(err.response?.data?.detail || 'Google login failed')
                  } finally { setLoading(false) }
                }}
                onError={() => triggerShake('Google Login Failed')}
                theme="filled_black"
                shape="pill"
              />
            </div>
          </div>

          {/* Signup link */}
          <p style={{
            textAlign: 'center', color: 'rgba(100,116,139,0.8)', fontSize: 14,
            fontWeight: 500, marginTop: 22, animation: 'riseIn 0.6s ease-out 0.5s both',
          }}>
            New to FinTrack?{' '}
            <Link to="/signup" style={{
              color: '#8b5cf6', fontWeight: 800, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              Create free account <ArrowRight size={13} />
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%,100%{ transform: translateX(0); }
          20%    { transform: translateX(-10px); }
          40%    { transform: translateX(10px); }
          60%    { transform: translateX(-6px); }
          80%    { transform: translateX(6px); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-10px); }
        }
        @keyframes orbPulse {
          0%,100% { opacity: 0.4; transform: scale(1); }
          50%     { opacity: 0.8; transform: scale(1.03); }
        }
        @keyframes orbSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes auroraShift {
          from { transform: scale(1) rotate(0deg); }
          to   { transform: scale(1.1) rotate(3deg); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        #login-email::placeholder,
        #login-password::placeholder { color: rgba(100,116,139,0.4); }
        #login-submit:disabled { opacity: 0.6; }
      `}</style>
    </div>
  )
}
