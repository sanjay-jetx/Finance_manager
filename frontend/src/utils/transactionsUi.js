/**
 * Maps stored transaction rows to UI "type" for labels, colors, and filters.
 * Receivable repayments are type=income plus a category (legacy or new).
 */

const RECEIVABLE_RETURN_CATEGORIES = new Set([
  'Lending Recovery',
  'Receivable returned',
])

/** Legacy / stored category string → user-facing subtitle (no "Debt" / "Lending" in UI). */
const CATEGORY_DISPLAY = {
  Lending: 'You lent',
  'You lent (receivable)': 'You lent',
  'Lending Recovery': 'Receivable received',
  'Receivable returned': 'Receivable received',
}

export function displayCategoryForUi(category) {
  if (category == null || category === '' || category === 'Income' || category === 'Expense') return null
  return CATEGORY_DISPLAY[category] ?? category
}

export function transactionUiType(txn) {
  if (!txn) return 'expense'
  if (txn.type === 'income' && txn.category && RECEIVABLE_RETURN_CATEGORIES.has(txn.category)) {
    return 'receivable_return'
  }
  return txn.type
}

export function isCreditUiType(uiType) {
  return uiType === 'income' || uiType === 'receivable_return'
}
