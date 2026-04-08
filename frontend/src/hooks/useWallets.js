/**
 * useWallets
 * Encapsulates wallet-balance fetching, per-wallet transaction listing,
 * and categories — extracted from Wallets.jsx.
 */
import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { getCached, setCached } from '../api/cache'
import toast from 'react-hot-toast'

export function useWallets() {
  const [balances, setBalances]     = useState(
    () => getCached('wallets') || { cash_balance: 0, upi_balance: 0, total_balance: 0 }
  )
  const [loading, setLoading]       = useState(!getCached('wallets'))
  const [recentTxns, setRecentTxns] = useState([])
  const [loadingTxns, setLoadingTxns] = useState(true)
  const [categories, setCategories] = useState(() => getCached('categories') || [])
  const [activeWallet, setActiveWallet] = useState('all')

  // ── Fetch balances ──────────────────────────────────────────────────────
  const fetchBalances = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/balances')
      setCached('wallets', res.data)
      setBalances(res.data)
    } catch {
      toast.error('Failed to load balances')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Fetch categories (for expense form) ────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories')
      setCached('categories', res.data.categories)
      setCategories(res.data.categories)
    } catch { /* non-critical */ }
  }, [])

  // ── Fetch recent transactions for active wallet ─────────────────────────
  const fetchRecentTxns = useCallback(async (wallet = 'all') => {
    setLoadingTxns(true)
    try {
      const params = wallet !== 'all' ? { wallet, limit: 10 } : { limit: 10 }
      const res = await api.get('/transactions', { params })
      setRecentTxns(res.data.transactions)
    } catch {
      toast.error('Failed to load recent transactions')
    } finally {
      setLoadingTxns(false)
    }
  }, [])

  // ── Initial loads ───────────────────────────────────────────────────────
  useEffect(() => {
    fetchBalances()
    fetchCategories()
  }, [fetchBalances, fetchCategories])

  // Re-fetch transactions whenever the active wallet tab changes
  useEffect(() => {
    fetchRecentTxns(activeWallet)
  }, [activeWallet, fetchRecentTxns])

  // ── Public refresh (called after mutations) ─────────────────────────────
  const refresh = useCallback(() => {
    fetchBalances()
    fetchRecentTxns(activeWallet)
  }, [fetchBalances, fetchRecentTxns, activeWallet])

  return {
    balances,
    loading,
    recentTxns,
    loadingTxns,
    categories,
    activeWallet,
    setActiveWallet,
    refresh,
    fetchBalances,
  }
}
