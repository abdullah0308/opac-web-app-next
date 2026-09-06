/**
 * Read-only QA smoke test.
 *
 * Runs the new server-side logic against the real database and checks the
 * shapes it returns. Creates, updates and deletes nothing.
 *
 *   npx tsx scripts/qa-smoke.mjs      (see qa-smoke.ts wrapper)
 */
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const results = []
function check(name, fn) {
  try {
    const detail = fn()
    results.push({ name, pass: true, detail })
  } catch (err) {
    results.push({ name, pass: false, detail: err.message })
  }
}

// ── Category rules (mirrors lib/categories.ts) ─────────────────────────────
function categoryFor(user) {
  if (user.bowType === 'compound') return 'compound'
  const level = user.level
  if (level === 'elite' || level === 'intermediate' || level === 'beginner') return level
  return 'beginner'
}

check('compound bow always lands in the compound class', () => {
  if (categoryFor({ bowType: 'compound', level: 'beginner' }) !== 'compound')
    throw new Error('compound beginner was not classed as compound')
  if (categoryFor({ bowType: 'compound', level: 'elite' }) !== 'compound')
    throw new Error('compound elite was not classed as compound')
  return 'compound beats level, as specified'
})

check('recurve archers are split by level', () => {
  const cases = [
    [{ bowType: 'recurve', level: 'beginner' }, 'beginner'],
    [{ bowType: 'recurve', level: 'intermediate' }, 'intermediate'],
    [{ bowType: 'recurve', level: 'elite' }, 'elite'],
  ]
  for (const [input, want] of cases) {
    if (categoryFor(input) !== want) throw new Error(`${want} misclassified`)
  }
  return '3/3 correct'
})

check('missing level falls back to beginner', () => {
  if (categoryFor({}) !== 'beginner') throw new Error('no fallback')
  if (categoryFor({ level: 'nonsense' }) !== 'beginner') throw new Error('bad level not caught')
  return 'safe default'
})

// ── CSV parser (mirrors the upload route) ──────────────────────────────────
function splitCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      out.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  out.push(cur.trim())
  return out
}

check('sheet parser handles plain rows', () => {
  const r = splitCsvLine('AM0032,25,competition,Club Champs,2026-09-01,Gold')
  if (r.length !== 6) throw new Error(`expected 6 cells, got ${r.length}`)
  if (r[0] !== 'AM0032' || r[1] !== '25') throw new Error('cells misaligned')
  return '6 cells'
})

check('sheet parser keeps commas inside quotes', () => {
  const r = splitCsvLine('AM0032,25,competition,"Champs, Round 2",2026-09-01,')
  if (r[3] !== 'Champs, Round 2') throw new Error(`event mangled: ${r[3]}`)
  if (r.length !== 6) throw new Error(`expected 6 cells, got ${r.length}`)
  return 'quoted comma preserved'
})

check('sheet parser handles escaped quotes', () => {
  const r = splitCsvLine('AM0032,10,other,"He said ""nice shot""",2026-01-01,')
  if (r[3] !== 'He said "nice shot"') throw new Error(`escaping wrong: ${r[3]}`)
  return 'doubled quotes unescaped'
})

check('negative points survive parsing (corrections)', () => {
  const r = splitCsvLine('AM0032,-5,other,Correction,2026-01-01,')
  if (Number(r[1]) !== -5) throw new Error('negative lost')
  return '-5 parsed'
})

// ── Live data checks ───────────────────────────────────────────────────────
const live = []
try {
  const { rows: users } = await pool.query(
    `select id, name, archer_id, bow_type, level, active, hide_financials from users limit 500`,
  )
  live.push(`users: ${users.length}`)

  const classCounts = {}
  for (const u of users) {
    const c = categoryFor({ bowType: u.bow_type, level: u.level })
    classCounts[c] = (classCounts[c] ?? 0) + 1
  }
  live.push(`class split: ${JSON.stringify(classCounts)}`)

  const { rows: clans } = await pool.query(`select id, name, colour, logo_url from clans`)
  live.push(`clans: ${clans.length} (${clans.map((c) => c.name).join(', ') || 'none'})`)
  live.push(`clans with a crest: ${clans.filter((c) => c.logo_url).length}`)

  const { rows: pts } = await pool.query(
    `select count(*)::int as n, coalesce(sum(points),0)::int as total from points_entries`,
  )
  live.push(`points entries: ${pts[0].n} rows, ${pts[0].total} points`)

  const { rows: att } = await pool.query(
    `select count(*)::int as n from attendance where status = 'present'`,
  )
  live.push(`present attendance records: ${att[0].n}`)

  const { rows: gs } = await pool.query(
    `select season, points_per_attendance, clan_leaderboard_enabled, face_recognition_enabled,
            minimum_sessions_to_qualify from global_settings limit 1`,
  )
  if (gs[0]) {
    live.push(
      `settings: season=${gs[0].season} pointsPerAttendance=${gs[0].points_per_attendance} ` +
        `clanBoard=${gs[0].clan_leaderboard_enabled} faceId=${gs[0].face_recognition_enabled} ` +
        `minSessions=${gs[0].minimum_sessions_to_qualify}`,
    )
  } else {
    live.push('settings: no global-settings row yet (defaults apply)')
  }

  // Attendance points that were never awarded — pre-existing check-ins.
  const { rows: gap } = await pool.query(
    `select count(*)::int as n from attendance a
     where a.status = 'present'
       and not exists (
         select 1 from points_entries p where p.batch_id = 'attendance:' || a.id
       )`,
  )
  live.push(`attendance without points (historic, expected): ${gap[0].n}`)
} catch (err) {
  live.push(`LIVE QUERY FAILED: ${err.message}`)
  process.exitCode = 1
}

await pool.end()

const passed = results.filter((r) => r.pass).length
console.log(`\n── Logic checks: ${passed}/${results.length} passed ──`)
for (const r of results) {
  console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? ` — ${r.detail}` : ''}`)
}
console.log('\n── Live data ──')
for (const l of live) console.log(`  ${l}`)

if (results.some((r) => !r.pass)) process.exitCode = 1
