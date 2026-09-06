import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendEmail, overdueReminderEmail } from '@/lib/email'

/**
 * GET /api/cron/payment-reminders
 * Runs daily from a Vercel Cron job.
 *
 * Two jobs: move due fees past their date to overdue, then email one summary
 * per archer covering everything they owe. Where an archer has guardians, the
 * guardians get the email instead — for juniors it is the parent who pays.
 *
 * Secured with CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // A missing secret must fail closed: this job sends real email to real
  // members, so it is never open just because nobody configured it.
  if (!cronSecret) {
    console.error('[cron payment-reminders] CRON_SECRET is not set — refusing to run')
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured on this deployment.' },
      { status: 503 },
    )
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const now = new Date().toISOString()

    // ── 1. Flip due → overdue ────────────────────────────────────────────
    const newlyOverdue = await payload.find({
      collection: 'payments',
      where: {
        and: [{ status: { equals: 'due' } }, { dueDate: { less_than: now } }],
      },
      limit: 500,
    })

    const flipped: (string | number)[] = []
    for (const p of newlyOverdue.docs) {
      await payload.update({
        collection: 'payments',
        id: p.id,
        overrideAccess: true,
        data: { status: 'overdue' },
      })
      flipped.push(p.id)
    }

    // ── 2. Everything currently overdue, grouped per archer ──────────────
    const allOverdue = await payload.find({
      collection: 'payments',
      where: { status: { equals: 'overdue' } },
      limit: 1000,
      depth: 1,
    })

    type Item = { description: string; amount: number; dueDate: string }
    const perArcher = new Map<string, { name: string; items: Item[]; total: number }>()

    for (const p of allOverdue.docs as unknown as {
      archer?: { id?: string | number; name?: string } | string
      description?: string
      amount?: number
      dueDate?: string
    }[]) {
      const archerObj =
        p.archer && typeof p.archer === 'object'
          ? (p.archer as { id?: string | number; name?: string })
          : null
      const archerId = archerObj?.id ? String(archerObj.id) : String(p.archer ?? '')
      if (!archerId) continue

      const bucket =
        perArcher.get(archerId) ??
        { name: archerObj?.name ?? 'Archer', items: [] as Item[], total: 0 }
      bucket.items.push({
        description: p.description ?? 'Club fee',
        amount: p.amount ?? 0,
        dueDate: p.dueDate ?? now,
      })
      bucket.total += p.amount ?? 0
      perArcher.set(archerId, bucket)
    }

    // ── 3. Email the archer, or their guardians where there are any ──────
    let emailsSent = 0
    let emailsSkipped = 0
    const failures: string[] = []

    for (const [archerId, bucket] of perArcher) {
      const archer = (await payload
        .findByID({ collection: 'users', id: archerId, depth: 1 })
        .catch(() => null)) as {
        email?: string
        name?: string
        guardians?: unknown[]
      } | null
      if (!archer) continue

      // Guardians first: a junior's fees are their parent's business.
      const guardianIds = (archer.guardians ?? [])
        .map((g) =>
          g && typeof g === 'object' ? String((g as { id?: string | number }).id) : String(g),
        )
        .filter(Boolean)

      const recipients: { email: string; name: string; isGuardian: boolean }[] = []

      for (const gid of guardianIds) {
        const g = (await payload
          .findByID({ collection: 'users', id: gid, depth: 0 })
          .catch(() => null)) as { email?: string; name?: string } | null
        if (g?.email) {
          recipients.push({
            email: g.email,
            name: g.name ?? 'there',
            isGuardian: true,
          })
        }
      }

      if (recipients.length === 0 && archer.email) {
        recipients.push({
          email: archer.email,
          name: archer.name ?? 'there',
          isGuardian: false,
        })
      }

      for (const r of recipients) {
        const { subject, html, text } = overdueReminderEmail({
          recipientName: r.name,
          archerName: bucket.name,
          isGuardian: r.isGuardian,
          items: bucket.items,
          total: bucket.total,
        })
        const result = await sendEmail({ to: r.email, subject, html, text })
        if (result.sent) emailsSent++
        else if (result.skipped) emailsSkipped++
        else failures.push(`${r.email}: ${result.error ?? 'unknown'}`)
      }
    }

    return NextResponse.json({
      markedOverdue: flipped.length,
      archersWithOverdue: perArcher.size,
      emailsSent,
      emailsSkipped,
      failures,
    })
  } catch (err) {
    console.error('[cron payment-reminders]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
