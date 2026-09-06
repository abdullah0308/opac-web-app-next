/**
 * Read-only schema check.
 *
 * Confirms every table and column this release added actually exists in the
 * database before the app is deployed against it. Touches nothing.
 *
 *   node --env-file=.env.local scripts/verify-schema.mjs
 */
import { Pool } from 'pg'

const EXPECT_TABLES = ['points_entries', 'users', 'clans', 'scores']

const EXPECT_COLUMNS = [
  ['users', 'hide_financials'],
  ['clans', 'logo_url'],
  ['clans', 'motto'],
  ['scores', 'verified_by_id'],
  ['scores', 'verified_at'],
  ['scores', 'coach_feedback'],
  ['points_entries', 'source'],
  ['points_entries', 'points'],
  ['points_entries', 'season'],
  ['points_entries', 'batch_id'],
  ['points_entries', 'event_name'],
]

// hasMany relationships become their own join tables in Payload/Postgres.
const EXPECT_ANY_TABLE = [
  ['users guardians join', ['users_rels']],
  ['scores sharedWith join', ['scores_rels']],
]

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const fail = []
const ok = []

try {
  const { rows: tables } = await pool.query(
    `select table_name from information_schema.tables where table_schema = 'public'`,
  )
  const tableSet = new Set(tables.map((r) => r.table_name))

  for (const t of EXPECT_TABLES) {
    if (tableSet.has(t)) ok.push(`table ${t}`)
    else fail.push(`MISSING TABLE: ${t}`)
  }

  for (const [label, candidates] of EXPECT_ANY_TABLE) {
    if (candidates.some((c) => tableSet.has(c))) ok.push(label)
    else fail.push(`MISSING: ${label} (looked for ${candidates.join(', ')})`)
  }

  const { rows: cols } = await pool.query(
    `select table_name, column_name from information_schema.columns where table_schema = 'public'`,
  )
  const colSet = new Set(cols.map((r) => `${r.table_name}.${r.column_name}`))

  for (const [t, c] of EXPECT_COLUMNS) {
    if (colSet.has(`${t}.${c}`)) ok.push(`column ${t}.${c}`)
    else fail.push(`MISSING COLUMN: ${t}.${c}`)
  }

  // Global settings live in their own table in Payload/Postgres.
  const globalsTable = [...tableSet].find((t) => t.includes('global_settings'))
  if (globalsTable) {
    ok.push(`table ${globalsTable}`)
    for (const c of ['points_per_attendance', 'clan_leaderboard_enabled']) {
      if (colSet.has(`${globalsTable}.${c}`)) ok.push(`column ${globalsTable}.${c}`)
      else fail.push(`MISSING COLUMN: ${globalsTable}.${c}`)
    }
  } else {
    fail.push('MISSING TABLE: global_settings')
  }

  console.log(`\n✓ ${ok.length} checks passed`)
  ok.forEach((o) => console.log(`   ok  ${o}`))
  if (fail.length) {
    console.log(`\n✗ ${fail.length} problems`)
    fail.forEach((f) => console.log(`   !!  ${f}`))
    process.exitCode = 1
  } else {
    console.log('\nSchema is ready for this release.')
  }
} catch (err) {
  console.error('Schema check failed to run:', err.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
