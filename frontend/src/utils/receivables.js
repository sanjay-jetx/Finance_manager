/**
 * Calendar-date helpers for receivable due dates.
 * Uses the calendar date from the ISO string prefix (YYYY-MM-DD) when present so
 * comparisons ignore time-of-day and match the date returned by the API (UTC midnight).
 * "Today" uses the user's local calendar (start of day is implicit in date-only parts).
 */

export function dateOnlyFromRecord(isoString) {
  if (!isoString) return null
  const s = String(isoString)
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return { y: +m[1], m: +m[2], d: +m[3] }
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }
}

export function todayDateOnly() {
  const n = new Date()
  n.setHours(0, 0, 0, 0)
  return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() }
}

export function compareDateOnly(a, b) {
  if (!a || !b) return 0
  return (a.y * 10000 + a.m * 100 + a.d) - (b.y * 10000 + b.m * 100 + b.d)
}

export function calendarDaysFromTodayToDue(dueDateOnly) {
  const today = todayDateOnly()
  const t0 = new Date(today.y, today.m - 1, today.d)
  const t1 = new Date(dueDateOnly.y, dueDateOnly.m - 1, dueDateOnly.d)
  return Math.round((t1 - t0) / 86400000)
}

export function isReceivableOverdue(record) {
  if (!record?.return_date || record.status === 'returned') return false
  const due = dateOnlyFromRecord(record.return_date)
  const today = todayDateOnly()
  if (!due) return false
  return compareDateOnly(due, today) < 0
}

export function isReceivableDueSoon(record) {
  if (!record?.return_date || record.status === 'returned') return false
  const due = dateOnlyFromRecord(record.return_date)
  const today = todayDateOnly()
  if (!due) return false
  if (compareDateOnly(due, today) < 0) return false
  const days = calendarDaysFromTodayToDue(due)
  return days >= 0 && days <= 3
}
