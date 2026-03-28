/**
 * Axios instance for all API calls.
 *
 * Key features:
 * - withCredentials: true  → sends the HTTP-only refresh token cookie automatically
 * - Request interceptor   → attaches the JWT access token from localStorage
 * - Response interceptor  → on 401, silently attempts one token refresh before
 *                           retrying the original request; only redirects to /login
 *                           if refresh also fails (i.e. refresh token is expired/revoked)
 */

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,   // ← sends the HTTP-only refresh_token cookie on every request
})

// ── Request: attach access token ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: handle 401 with silent refresh ───────────────────────────────
let isRefreshing = false
let pendingQueue = []   // requests waiting while a refresh is in-flight

function processQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  pendingQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    // Only attempt refresh on 401 and only once per request
    if (err.response?.status === 401 && !original._retried) {
      // Skip refresh loop for auth endpoints themselves
      if (original.url?.startsWith('/auth/')) {
        return Promise.reject(err)
      }

      if (isRefreshing) {
        // Another refresh is in-flight — queue this request
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        })
      }

      original._retried = true
      isRefreshing = true

      try {
        // Call /auth/refresh — the HTTP-only cookie is sent automatically
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const newToken = data.access_token
        localStorage.setItem('token', newToken)

        // Update the failed request's auth header and retry it
        original.headers.Authorization = `Bearer ${newToken}`
        processQueue(null, newToken)
        return api(original)
      } catch (refreshError) {
        // Refresh token itself is expired or revoked — force logout
        processQueue(refreshError, null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

export default api
