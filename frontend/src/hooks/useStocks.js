import { useState, useCallback, useEffect } from 'react'
import api from '../api/axios'
import { getCached, setCached, invalidateCache } from '../api/cache'
import toast from 'react-hot-toast'

export function useStocks(range = '1m') {
  const cacheKey = `stocks_${range}`
  const [data, setData] = useState(() => getCached(cacheKey) || null)
  const [loading, setLoading] = useState(!getCached(cacheKey))
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  // Optimistic cache swap on range change
  useEffect(() => {
    const cached = getCached(cacheKey)
    if (cached) {
      setData(cached)
      setLoading(false)
    }
  }, [cacheKey])

  const fetchStocks = useCallback(async (silent = false) => {
    const cached = getCached(cacheKey)
    
    if (!silent && !cached) {
      // Don't set full loading if we already have some data (stale data)
      // This prevents the whole page from unmounting.
      setRefreshing(true)
    } else {
      setRefreshing(true)
    }
    setError(null)

    try {
      const res = await api.get(`/stocks/market-indices?range=${range}`)
      setCached(cacheKey, res.data)
      setData(res.data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load stock indices')
      if (!silent) toast.error('Failed to load stock data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [range, cacheKey])

  useEffect(() => {
    fetchStocks()
  }, [fetchStocks])

  const refresh = useCallback(() => {
    invalidateCache(cacheKey)
    fetchStocks(true)
  }, [fetchStocks, cacheKey])

  return {
    data,
    loading: loading && !data, // Only truly "loading" if we have absolutely no data
    refreshing,
    error,
    refresh,
    fetchStocks
  }
}
