/**
 * useTransactions
 * Encapsulates paginated transaction fetching, filtering, search debounce,
 * categories loading, and stale-while-revalidate caching.
 * Extracted from Transactions.jsx.
 */
import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { getCached, setCached, invalidateCache } from '../api/cache'
import toast from 'react-hot-toast'

const PAGE_LIMIT = 50

export function useTransactions() {
  const [txns, setTxns]             = useState(() => getCached('transactions') || [])
  const [categories, setCategories] = useState(() => getCached('categories') || [])
  const [loading, setLoading]       = useState(!getCached('transactions'))
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore]       = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  // ── Filters ─────────────────────────────────────────────────────────────
  const [filterWallet,   setFilterWallet]   = useState('')
  const [filterType,     setFilterType]     = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [searchQuery,    setSearchQuery]    = useState('')

  // ── Helpers ──────────────────────────────────────────────────────────────
  const isFiltered = !!(filterWallet || filterType || filterCategory || searchQuery.length > 2)

  // ── Fetch (supports page param for load-more) ────────────────────────────
  const fetchTxns = useCallback(async (opts = {}) => {
    const { page = 1, silent = false } = opts
    const hasCache = getCached('transactions')

    if (page === 1) {
      if (!silent && (!hasCache || isFiltered)) setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = { page, limit: PAGE_LIMIT }
      if (filterWallet)         params.wallet   = filterWallet
      if (filterType)           params.type     = filterType
      if (filterCategory)       params.category = filterCategory
      if (searchQuery.length > 2) params.search = searchQuery

      const res     = await api.get('/transactions', { params })
      const fetched = res.data.transactions

      setHasMore(res.data.has_more ?? false)
      setTotalCount(res.data.total_count ?? fetched.length)
      setCurrentPage(page)

      if (page === 1) {
        const unfiltered = !filterWallet && !filterType && !filterCategory && searchQuery.length <= 2
        if (unfiltered) setCached('transactions', fetched)
        setTxns(fetched)
      } else {
        setTxns(prev => [...prev, ...fetched])
      }
    } catch {
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filterWallet, filterType, filterCategory, searchQuery, isFiltered])

  // ── Fetch categories ─────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories')
      setCached('categories', res.data.categories)
      setCategories(res.data.categories)
    } catch { /* non-critical */ }
  }, [])

  // ── Mount: load categories once ──────────────────────────────────────────
  useEffect(() => { fetchCategories() }, [fetchCategories])

  // ── Debounced re-fetch on filter change ───────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => fetchTxns({ page: 1 }), 300)
    return () => clearTimeout(timer)
  }, [filterWallet, filterType, filterCategory, searchQuery])

  // ── Load more (next page, appends) ───────────────────────────────────────
  const loadMore = useCallback(() => {
    fetchTxns({ page: currentPage + 1 })
  }, [fetchTxns, currentPage])

  // ── Force full refresh after mutations ────────────────────────────────────
  const refresh = useCallback(() => {
    invalidateCache('transactions')
    fetchTxns({ page: 1, silent: false })
  }, [fetchTxns])

  return {
    txns,
    categories,
    loading,
    loadingMore,
    hasMore,
    totalCount,
    currentPage,
    // filters
    filterWallet,   setFilterWallet,
    filterType,     setFilterType,
    filterCategory, setFilterCategory,
    searchQuery,    setSearchQuery,
    // actions
    loadMore,
    refresh,
  }
}
