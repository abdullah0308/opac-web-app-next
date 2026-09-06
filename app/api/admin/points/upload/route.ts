import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId, getUserRoles } from '@/lib/auth'

/**
 * POST /api/admin/points/upload
 *
 * Takes a results sheet as CSV text and turns each row into a points entry.
 *
 *   archerId,points,source,event,date,note
 *   AM0032,25,competition,Club Championship,2026-09-01,Gold medal
 *
 * Only `archerId` and `points` are required. Every row is validated before
 * anything is written, so a sheet either lands whole or not at all — and the
 * whole upload shares a batch id so it can be undone in one click.
 */

const SOURCES = ['attendance', 'pointing-day', 'dueling', 'competition', 'other']
const SOURCE_ALIASES: Record<string, string> = {
  'pointing day': 'pointing-day',
  pointingday: 'pointing-day',
  points_day: 'pointing-day',
  duel: 'dueling',
  duels: 'dueling',
  comp: 'competition',
  tournament: 'competition',
  attend: 'attendance',
}

interface RowError {
  line: number
  reason: string
}

/** Minimal CSV split that tolerates quoted fields containing commas. */
function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur.trim())
  return out
}

function normaliseSource(raw: string | undefined): string | null {
  if (!raw) return 'competition'
  const key = raw.toLowerCase().trim()
  if (SOURCES.includes(key)) return key
  if (SOURCE_ALIASES[key]) return SOURCE_ALIASES[key]
  return null
}

export async function POST(req: NextRequest) {
  const adminId = await getCurrentUserId()
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = await getUserRoles()
  if (!roles.includes('admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { csv, eventName, defaultSource, defaultDate, dryRun } = (await req.json()) as {
      csv?: string
      eventName?: string
      defaultSource?: string
      defaultDate?: string
      dryRun?: boolean
    }

    if (!csv || !csv.trim()) {
      return NextResponse.json({ error: 'The sheet is empty.' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const settings = (await payload
      .findGlobal({ slug: 'global-settings' })
      .catch(() => null)) as { season?: string } | null
    const season = settings?.season ?? String(new Date().getFullYear())

    // Index every archer by club ID and by email so a sheet can use either.
    const archersRes = await payload.find({
      collection: 'users',
      where: { active: { equals: true } },
      limit: 1000,
      depth: 0,
    })
    const byCode = new Map<string, { id: string; name: string }>()
    for (const u of archersRes.docs as unknown as {
      id: string | number
      archerId?: string
      email?: string
      name?: string
    }[]) {
      const entry = { id: String(u.id), name: u.name ?? 'Archer' }
      if (u.archerId) byCode.set(u.archerId.toUpperCase().trim(), entry)
      if (u.email) byCode.set(u.email.toLowerCase().trim(), entry)
    }

    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)

    // Drop a header row if the first cell is obviously a label.
    const firstCell = splitCsvLine(lines[0])[0]?.toLowerCase() ?? ''
    if (['archerid', 'archer', 'id', 'member', 'code', 'email'].includes(firstCell)) {
      lines.shift()
    }

    if (lines.length === 0) {
      return NextResponse.json(
        { error: 'The sheet has a header but no rows.' },
        { status: 400 },
      )
    }

    const errors: RowError[] = []
    const parsed: {
      archer: string
      archerName: string
      points: number
      source: string
      eventName: string | null
      date: string
      note: string | null
    }[] = []

    lines.forEach((line, i) => {
      const lineNo = i + 1
      const cells = splitCsvLine(line)
      const code = (cells[0] ?? '').trim()
      if (!code) {
        errors.push({ line: lineNo, reason: 'No archer ID' })
        return
      }

      const archer =
        byCode.get(code.toUpperCase()) ?? byCode.get(code.toLowerCase())
      if (!archer) {
        errors.push({ line: lineNo, reason: `No active member matches "${code}"` })
        return
      }

      const points = Number(cells[1])
      if (!Number.isFinite(points)) {
        errors.push({ line: lineNo, reason: `"${cells[1] ?? ''}" is not a number` })
        return
      }

      const source = normaliseSource(cells[2] || defaultSource)
      if (!source) {
        errors.push({
          line: lineNo,
          reason: `Unknown category "${cells[2]}" — use pointing-day, dueling, competition or other`,
        })
        return
      }

      const rawDate = cells[4] || defaultDate
      const date = rawDate ? new Date(rawDate) : new Date()
      if (Number.isNaN(date.getTime())) {
        errors.push({ line: lineNo, reason: `"${rawDate}" is not a date` })
        return
      }

      parsed.push({
        archer: archer.id,
        archerName: archer.name,
        points,
        source,
        eventName: cells[3] || eventName || null,
        date: date.toISOString(),
        note: cells[5] || null,
      })
    })

    // All-or-nothing: never half-import a results sheet.
    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: `${errors.length} row${errors.length === 1 ? '' : 's'} could not be read. Nothing was imported.`,
          errors: errors.slice(0, 25),
          parsedCount: parsed.length,
        },
        { status: 422 },
      )
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        rows: parsed.map((p) => ({
          name: p.archerName,
          points: p.points,
          source: p.source,
        })),
        total: parsed.reduce((s, p) => s + p.points, 0),
      })
    }

    const batchId = `sheet:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`

    for (const row of parsed) {
      await payload.create({
        collection: 'points-entries',
        overrideAccess: true,
        data: {
          archer: row.archer,
          source: row.source as 'competition',
          points: row.points,
          eventName: row.eventName,
          date: row.date,
          season,
          note: row.note,
          awardedBy: adminId,
          batchId,
        },
      })
    }

    return NextResponse.json({
      success: true,
      imported: parsed.length,
      batchId,
      total: parsed.reduce((s, p) => s + p.points, 0),
    })
  } catch (err) {
    console.error('[admin/points/upload]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
