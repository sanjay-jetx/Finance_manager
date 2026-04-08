/**
 * useDashboard
 * Encapsulates all dashboard data-fetching, stale-while-revalidate caching,
 * loading state, and manual refresh. Dashboard.jsx only handles rendering.
 */
import { useState, useCallback, useEffect } from 'react'
import api from '../api/axios'
import { getCached, setCached, invalidateCache } from '../api/cache'

export function useDashboard() {
  const [data, setData]           = useState(() => getCached('dashboard'))
  const [loading, setLoading]     = useState(!getCached('dashboard'))
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]         = useState(null)

  const fetch = useCallback(async (silent = false) => {
    // silent = true → don't show skeleton, just spin the refresh icon
    if (!silent && !getCached('dashboard')) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)
    try {
      const res = await api.get('/dashboard')
      setCached('dashboard', res.data)
      setData(res.data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial load on mount
  useEffect(() => { fetch() }, [fetch])

  const refresh = useCallback(() => {
    invalidateCache('dashboard')
    fetch(true)
  }, [fetch])

  return { data, loading, refreshing, error, refresh, refetch: fetch }
}
