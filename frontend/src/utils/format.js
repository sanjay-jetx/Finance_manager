/**
 * Shared INR currency formatter — import this instead of copy-pasting in every page.
 * Usage: import { fmt } from '../utils/format'
 */
export function fmt(n, decimals = 0) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals,
  }).format(n || 0)
}
