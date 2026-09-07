/**
 * Relationship ids arrive from the browser as JSON strings, but Payload
 * validates them against the database's own id type. On Postgres that is an
 * integer, so "15" is rejected where 15 is accepted — and the error it throws
 * only says "the following fields are invalid", which is easy to misread as a
 * permissions problem.
 *
 * Coerce a numeric-looking id to a number and leave anything else alone, so
 * the same code works on Postgres and on the SQLite/Mongo string-id setups.
 */
export function relId(value: unknown): string | number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'object') {
    const inner = (value as { id?: unknown }).id
    return inner === undefined ? null : relId(inner)
  }
  const s = String(value).trim()
  if (!s) return null
  return /^\d+$/.test(s) ? Number(s) : s
}

/** Same coercion for a list of relationship ids. */
export function relIds(value: unknown): (string | number)[] {
  if (!Array.isArray(value)) return []
  return value
    .map(relId)
    .filter((v): v is string | number => v !== null)
}
