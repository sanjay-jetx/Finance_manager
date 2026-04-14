import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'
import { TrendingUp, Eye, EyeOff, ArrowRight, CheckCircle2, XCircle, Sparkles } from 'lucide-react'

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
  { label: 'Too short', bar: '#ef4444', text: '#f87171' },
  { label: 'Weak',      bar: '#f97316', text: '#fb923c' },
  { label: 'Fair',      bar: '#eab308', text: '#fbbf24' },
  { label: 'Good',      bar: '#22c55e', text: '#4ade80' },
  { label: 'Strong',    bar: '#10b981', text: '#34d399' },
]

function Req({ met, text }) {
  return (
    <span style={{
      display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
      color: met ? '#34d399' : 'rgba(100,116,139,0.5)',
      transition: 'color 0.3s',
    }}>
      {met
        ? <CheckCircle2 size={11} color="#34d399" />
        : <XCircle      size={11} color="rgba(100,116,139,0.4)" />}
      {text}
    </span>
  )
}

/* ─── Feature check list for left panel ─────────────────────────────── */
const FEATURES = [
  { text: 'Cash & UPI wallet management',   color: '#10b981' },
  { text: 'Smart budget alerts & goals',     color: '#06b6d4' },
  { text: 'Lending & receivables tracker',   color: '#8b5cf6' },
  { text: 'Beautiful charts & analytics',    color: '#f59e0b' },
  { text: 'Real-time performance insights',  color: '#ec4899' },
]

export default function Signup() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]     = useState({ name: '', email: '', password: '' })
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [activeField, setActiveField] = useState(null)
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
    if (emailOk === false) { triggerShake('Enter a valid email address'); return }
    if (strength < 2) { triggerShake('Password is too weak — add uppercase & numbers'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/signup', form)
      login(res.data.access_token, { user_name: res.data.user_name }, res.data.expires_in)
      toast.success(`Welcome to FinTrack, ${res.data.user_name}! 🎉`)
      navigate('/dashboard')
    } catch (err) {
      triggerShake(err.response?.data?.detail || 'Signup failed. Please try again.')
    } finally { setLoading(false) }
  }

  /* shared input style */
  const inputStyle = (field) => ({
    width: '100%', boxSizing: 'border-box',
    background: activeField === field ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.03)',
    border: `1.5px solid ${
      activeField === field ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.07)'
    }`,
    borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 500, outline: 'none',
    boxShadow: activeField === field ? '0 0 0 3px rgba(16,185,129,0.08)' : 'none',
    transition: 'all 0.2s ease',
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#050508', overflow: 'hidden' }}>

      {/* ══ LEFT PANEL ══════════════════════════════════════════════════════ */}
      <div style={{ flex: '0 0 44%', position: 'relative', overflow: 'hidden', display: 'none' }}
           className="lg:flex flex-col justify-between p-14">

        {/* Aurora — emerald / teal / cyan */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `
              radial-gradient(ellipse at 20% 20%, rgba(16,185,129,0.28) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 80%, rgba(6,182,212,0.22) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 60%, rgba(139,92,246,0.10) 0%, transparent 60%)
            `,
            animation: 'auroraShift 10s ease-in-out infinite alternate',
          }} />
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.025,
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }} />
        </div>

        {/* Logo */}
        <div className="relative z-10" style={{ animation: 'riseIn 0.6s ease-out 0.1s both', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(16,185,129,0.4)',
          }}>
            <TrendingUp size={18} color="#fff" />
          </div>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 20, letterSpacing: '-0.5px' }}>FinTrack</span>
        </div>

        {/* Hero content */}
        <div className="relative z-10">
          <div style={{ animation: 'riseIn 0.7s ease-out 0.2s both', marginBottom: 36 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 999, padding: '5px 14px',
            }}>
              <Sparkles size={12} color="#10b981" />
              <span style={{ color: '#10b981', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '3px' }}>
                Free Forever
              </span>
            </div>
            <h2 style={{
              fontSize: 46, fontWeight: 900, color: '#fff', lineHeight: 1.08,
              letterSpacing: '-0.04em', marginBottom: 16,
            }}>
              Start Building<br />
              <span style={{
                background: 'linear-gradient(135deg, #10b981, #06b6d4, #8b5cf6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Real Wealth
              </span>
            </h2>
            <p style={{ color: 'rgba(148,163,184,0.75)', fontSize: 16, fontWeight: 500, lineHeight: 1.6, maxWidth: 360 }}>
              Join thousands of smart spenders who track every rupee, smash every goal, and grow every month.
            </p>
          </div>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'riseIn 0.7s ease-out 0.35s both' }}>
            {FEATURES.map(({ text, color }, i) => (
              <div key={text} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                animation: `riseIn 0.5s ease-out ${0.3 + i * 0.1}s both`,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: color + '18', border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle2 size={14} color={color} />
                </div>
                <span style={{ color: 'rgba(203,213,225,0.85)', fontSize: 14, fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10" style={{ animation: 'riseIn 0.6s ease-out 0.6s both' }}>
          <p style={{ fontSize: 9, fontWeight: 800, color: 'rgba(100,116,139,0.5)', textTransform: 'uppercase', letterSpacing: '3px' }}>
            © 2025 FinTrack — Your Trusted Financial Partner
          </p>
        </div>
      </div>

      {/* ══ RIGHT PANEL ═════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', position: 'relative' }}>

        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 60% 50%, rgba(16,185,129,0.05) 0%, transparent 65%)',
        }} />

        <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

          {/* Mobile logo */}
          <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 28, animation: 'riseIn 0.5s ease-out 0.1s both' }}>
            <div style={{
              display: 'inline-flex', width: 52, height: 52, borderRadius: 16,
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(16,185,129,0.4)', marginBottom: 10,
            }}>
              <TrendingUp size={24} color="#fff" />
            </div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 22 }}>FinTrack</div>
          </div>

          {/* Header */}
          <div style={{ marginBottom: 24, animation: 'riseIn 0.6s ease-out 0.15s both' }}>
            <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 5 }}>
              Create your account
            </h1>
            <p style={{ color: 'rgba(100,116,139,0.9)', fontSize: 15, fontWeight: 500 }}>
              Free forever — no credit card needed
            </p>
          </div>

          {/* Card */}
          <div style={{
            borderRadius: 28, padding: '26px 28px', position: 'relative',
            background: 'linear-gradient(160deg, rgba(17,24,39,0.95), rgba(5,5,8,0.97))',
            backdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 40px 80px -20px rgba(0,0,0,0.7)',
            animation: `riseIn 0.6s ease-out 0.2s both${shake ? ', shake 0.4s ease-in-out' : ''}`,
          }}>
            {/* Top gradient border */}
            <div style={{
              position: 'absolute', top: 0, left: 28, right: 28, height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), rgba(6,182,212,0.4), transparent)',
            }} />

            <form onSubmit={handleSubmit}>

              {/* Name */}
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'rgba(100,116,139,0.8)', textTransform: 'uppercase', letterSpacing: '2.5px', marginBottom: 7 }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="signup-name" type="text" required placeholder="John Doe"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    onFocus={() => setActiveField('name')}
                    onBlur={()  => setActiveField(null)}
                    style={{ ...inputStyle('name'), padding: '12px 16px 12px 44px' }}
                  />
                  {/* Person icon */}
                  <div style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: activeField === 'name' ? '#10b981' : 'rgba(100,116,139,0.5)', transition: 'color 0.2s' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'rgba(100,116,139,0.8)', textTransform: 'uppercase', letterSpacing: '2.5px', marginBottom: 7 }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="signup-email" type="email" required placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setActiveField('email')}
                    onBlur={()  => setActiveField(null)}
                    style={{
                      ...inputStyle('email'),
                      padding: '12px 36px 12px 44px',
                      borderColor: emailOk === false ? 'rgba(239,68,68,0.5)'
                                 : emailOk === true  ? 'rgba(16,185,129,0.5)'
                                 : activeField === 'email' ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.07)',
                    }}
                  />
                  <div style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: activeField === 'email' ? '#10b981' : 'rgba(100,116,139,0.5)', fontSize: 15, fontWeight: 700, transition: 'color 0.2s' }}>@</div>
                  {emailOk !== null && (
                    <div style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', width: 7, height: 7, borderRadius: '50%', background: emailOk ? '#10b981' : '#ef4444' }} />
                  )}
                </div>
                {emailOk === false && form.email.length > 5 && (
                  <p style={{ color: '#f87171', fontSize: 11, fontWeight: 600, marginTop: 5, marginLeft: 2 }}>
                    Please enter a valid email address
                  </p>
                )}
              </div>

              {/* Password */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'rgba(100,116,139,0.8)', textTransform: 'uppercase', letterSpacing: '2.5px', marginBottom: 7 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="signup-password"
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    onFocus={() => setActiveField('pass')}
                    onBlur={()  => setActiveField(null)}
                    style={{ ...inputStyle('pass'), padding: '12px 46px 12px 44px' }}
                  />
                  <div style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: activeField === 'pass' ? '#10b981' : 'rgba(100,116,139,0.5)', transition: 'color 0.2s' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(100,116,139,0.6)', display: 'flex', alignItems: 'center', padding: 3,
                  }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Strength bar */}
                {form.password && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                      {[0,1,2,3].map(i => (
                        <div key={i} style={{
                          height: 3, flex: 1, borderRadius: 999,
                          background: i <= strength && sc ? sc.bar : 'rgba(255,255,255,0.06)',
                          transition: 'background 0.3s ease',
                        }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Req met={form.password.length >= 8}    text="8+ chars" />
                        <Req met={/[A-Z]/.test(form.password)}  text="Uppercase" />
                        <Req met={/[0-9]/.test(form.password)}  text="Number" />
                        <Req met={/[^A-Za-z0-9]/.test(form.password)} text="Symbol" />
                      </div>
                      {sc && <span style={{ fontSize: 10, fontWeight: 800, color: sc.text, textTransform: 'uppercase', letterSpacing: '2px' }}>{sc.label}</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* CTA — Emerald */}
              <button
                id="signup-submit"
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  borderRadius: 16, padding: '15px 24px',
                  background: loading ? 'rgba(16,185,129,0.4)'
                    : 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  color: '#000', fontWeight: 900, fontSize: 14,
                  textTransform: 'uppercase', letterSpacing: '2px',
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(16,185,129,0.3)',
                  transition: 'all 0.3s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  marginBottom: 18,
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(16,185,129,0.4)' }}}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 8px 24px rgba(16,185,129,0.3)' }}
              >
                {loading ? (
                  <><span style={{ width: 16, height: 16, border: '2.5px solid rgba(0,0,0,0.25)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Creating Account...</>
                ) : (
                  <><span>Create Free Account</span><ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 16px' }}>
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
                    toast.success(`Welcome to FinTrack, ${res.data.user_name}! 🎉`)
                    navigate('/dashboard')
                  } catch (err) {
                    triggerShake(err.response?.data?.detail || 'Google signup failed')
                  } finally { setLoading(false) }
                }}
                onError={() => triggerShake('Google Signup Failed')}
                theme="filled_black"
                shape="pill"
                useOneTap
                auto_select
              />
            </div>
          </div>

          {/* Login link */}
          <p style={{ textAlign: 'center', color: 'rgba(100,116,139,0.8)', fontSize: 14, fontWeight: 500, marginTop: 20, animation: 'riseIn 0.6s ease-out 0.5s both' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#10b981', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Sign in <ArrowRight size={13} />
            </Link>
          </p>

          {/* TOS */}
          <p style={{ textAlign: 'center', color: 'rgba(100,116,139,0.4)', fontSize: 11, fontWeight: 500, marginTop: 10, animation: 'riseIn 0.6s ease-out 0.55s both' }}>
            By signing up you agree to our{' '}
            <span style={{ color: 'rgba(100,116,139,0.7)', cursor: 'pointer' }}>Terms</span> &{' '}
            <span style={{ color: 'rgba(100,116,139,0.7)', cursor: 'pointer' }}>Privacy Policy</span>
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
        @keyframes auroraShift {
          from { transform: scale(1) rotate(0deg); }
          to   { transform: scale(1.08) rotate(3deg); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        #signup-name::placeholder,
        #signup-email::placeholder,
        #signup-password::placeholder { color: rgba(100,116,139,0.35); }
      `}</style>
    </div>
  )
}
