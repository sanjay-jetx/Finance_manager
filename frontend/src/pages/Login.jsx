import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GoogleLogin } from '@react-oauth/google'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { TrendingUp, Eye, EyeOff, LogIn } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      login(res.data.access_token, { user_name: res.data.user_name }, res.data.expires_in)
      toast.success(`Welcome back, ${res.data.user_name}! 👋`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post('/auth/google', {
        token: credentialResponse.credential,
      })
      login(res.data.access_token, { user_name: res.data.user_name }, res.data.expires_in)
      toast.success(`Welcome! 👋`)
      navigate('/dashboard')
    } catch (err) {
      toast.error('Google Sign-In failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full
                        bg-primary-600/20 blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full
                        bg-violet-600/20 blur-3xl animate-pulse-slow" style={{animationDelay:'1.5s'}} />
      </div>

      <div className="w-full max-w-[440px] animate-fade-in">
        
        {/* Branding Area */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] bg-gradient-to-tr from-primary-600 to-indigo-600 shadow-2xl shadow-primary-500/40 mb-8 transform hover:scale-110 transition-transform duration-500">
             <TrendingUp size={48} className="text-white" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-3">FinTrack</h1>
          <p className="text-slate-400 font-medium text-lg">Your future, perfectly managed.</p>
        </div>

        {/* Login Card */}
        <div className="card shadow-black/80">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="label">Access ID (Email)</label>
              <input id="login-email" type="email" className="input" placeholder="name@example.com" required
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="relative">
              <label className="label">Security Key (Password)</label>
              <input id="login-password" type={showPass ? 'text' : 'password'} className="input" placeholder="••••••••" required
                value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-6 top-[54px] text-slate-500 hover:text-primary-400 transition-colors">
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button id="login-submit" type="submit" className="btn-primary w-full group overflow-hidden relative" disabled={loading}>
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <LogIn size={20} />}
                  Authorize Access
                </span>
            </button>

            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <span className="relative z-10 bg-[#121421]/0 px-4 text-[10px] font-black text-slate-600 uppercase tracking-[3px]">Secure Gate</span>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google Sign-In failed')}
                theme="filled_black"
                shape="pill"
                size="large"
                width="100%"
              />
            </div>

            <p className="text-center text-sm text-slate-500 font-medium">
              New to the platform?{' '}
              <Link to="/register" className="text-primary-400 font-bold hover:text-primary-300 transition-colors">Apply for Account</Link>
            </p>
          </form>
        </div>
        
        {/* Footer info */}
        <p className="mt-12 text-center text-[10px] font-bold text-slate-600 uppercase tracking-[4px]">
          End-to-End Encrypted Financial Infrastructure
        </p>
      </div>
    </div>
  )
}
