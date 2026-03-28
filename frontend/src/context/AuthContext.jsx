import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const AuthContext = createContext(null)

// Decode JWT payload without a library
function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

// Returns token if valid and not expired, null otherwise
function getValidToken() {
  const t = localStorage.getItem('token')
  if (!t) return null
  const payload = decodeToken(t)
  if (!payload) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return null
  }
  // Expired
  if (payload.exp && Date.now() / 1000 >= payload.exp) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return null
  }
  return t
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [token, setToken] = useState(getValidToken)
  const refreshTimerRef = useRef(null)

  // ── Refresh access token via HTTP-only cookie ──────────────────────────
  const refreshAccessToken = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',   // Send the HTTP-only refresh cookie
      })
      if (!res.ok) {
        // Refresh failed — force logout
        setToken(null)
        setUser(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        return null
      }
      const data = await res.json()
      localStorage.setItem('token', data.access_token)
      setToken(data.access_token)
      // Schedule next refresh
      scheduleRefresh(data.expires_in)
      return data.access_token
    } catch {
      return null
    }
  }, [])

  // ── Schedule proactive refresh 30s before expiry ───────────────────────
  const scheduleRefresh = useCallback((expiresInSeconds) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    const delay = Math.max((expiresInSeconds - 30) * 1000, 0)
    refreshTimerRef.current = setTimeout(() => {
      refreshAccessToken()
    }, delay)
  }, [refreshAccessToken])

  // On mount: schedule refresh based on stored token's remaining lifetime
  useEffect(() => {
    if (!token) return
    const payload = decodeToken(token)
    if (!payload?.exp) return
    const remainingSeconds = payload.exp - Date.now() / 1000
    if (remainingSeconds > 0) {
      scheduleRefresh(remainingSeconds)
    } else {
      // Already expired — try to refresh immediately
      refreshAccessToken()
    }
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, []) // run once on mount

  // ── Login: store access token, schedule refresh ────────────────────────
  const login = (accessToken, userData, expiresIn) => {
    localStorage.setItem('token', accessToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(accessToken)
    setUser(userData)
    if (expiresIn) scheduleRefresh(expiresIn)
  }

  // ── Logout: clear everything + call server to clear cookie ────────────
  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',    // Send cookie so server can blacklist it
      })
    } catch {
      // Best-effort — still clear client state
    }
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshAccessToken, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
