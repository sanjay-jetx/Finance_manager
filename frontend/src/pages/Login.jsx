import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react'

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
      toast.success(`Welcome back, ${res.data.user_name}!`)
      navigate('/dashboard')
    } catch (err) {
      triggerShake(err.response?.data?.detail || 'Invalid email or password')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#080A0F] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">

      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.04) 0%, transparent 70%)' }} />

      {/* Heading */}
      <div className="w-full max-w-[480px] mb-8 animate-stagger-1">
        <h1 className="text-[36px] font-bold text-white tracking-tight mb-2">Sign in</h1>
        <p className="text-[#6B7280] text-[15px]">Welcome back — your money awaits</p>
      </div>

      {/* Card */}
      <div className={`w-full max-w-[480px] bg-[#0F1117] border border-white/[0.06] rounded-2xl p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)] animate-stagger-2 ${shake ? 'animate-shake' : ''}`}>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[0.18em] mb-2.5">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B5563] group-focus-within:text-orange-400 transition-colors">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`w-full bg-[#151820] border rounded-xl py-3.5 pl-11 pr-11 text-white text-[14px] focus:outline-none transition-all placeholder-[#3D4451] ${
                  emailOk === false
                    ? 'border-red-500/60 focus:border-red-500'
                    : emailOk === true
                    ? 'border-orange-500/40 focus:border-orange-400'
                    : 'border-white/[0.07] focus:border-orange-400/60'
                }`}
              />
              {emailOk !== null && (
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                  emailOk
                    ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]'
                    : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                }`} />
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[0.18em] mb-2.5">
              Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B5563] group-focus-within:text-orange-400 transition-colors">
                <Lock size={16} />
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#151820] border border-white/[0.07] rounded-xl py-3.5 pl-11 pr-12 text-white text-[14px] focus:outline-none focus:border-orange-400/60 transition-all placeholder-[#3D4451]"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#9CA3AF] transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => toast.error('Please contact support to reset your password.')}
              className="text-[12px] text-[#6B7280] hover:text-orange-400 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] rounded-xl font-bold text-[14px] tracking-widest uppercase flex items-center justify-center gap-3 transition-all disabled:opacity-60 group relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              boxShadow: '0 0 30px rgba(249,115,22,0.35), 0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="text-white relative z-10">Sign In</span>
                <ArrowRight size={16} className="text-white relative z-10" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[10px] font-bold text-[#4B5563] uppercase tracking-[0.2em]">Or continue with</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Google */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              setLoading(true)
              try {
                const res = await api.post('/auth/google', { token: credentialResponse.credential })
                login(res.data.access_token, { user_name: res.data.user_name }, res.data.expires_in)
                toast.success(`Welcome, ${res.data.user_name}!`)
                navigate('/dashboard')
              } catch (err) {
                triggerShake(err.response?.data?.detail || 'Google sign-in failed')
              } finally { setLoading(false) }
            }}
            onError={() => triggerShake('Google sign-in failed')}
            theme="filled_black"
            shape="rectangular"
            width="400"
            text="continue_with"
            size="large"
          />
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-[13px] text-[#4B5563] animate-stagger-3">
        New to FinTrack?{' '}
        <Link to="/signup" className="text-orange-400 font-semibold hover:text-orange-300 transition-colors">
          Create free account →
        </Link>
      </p>

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
