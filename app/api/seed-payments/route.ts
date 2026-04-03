import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET /api/seed-payments
 * Seeds realistic payment records for all seeded archers.
 * Idempotent — skips archers who already have payment records.
 */

const PAYMENT_DATA: Array<{ archerId: string; payments: Array<{ desc: string; amount: number; status: 'paid' | 'due' | 'overdue'; dueOffset: number; paidOffset?: number }> }> = [
  {
    archerId: 'AM0032',
    payments: [
      { desc: 'Annual Membership 2026', amount: 2500, status: 'paid', dueOffset: -90, paidOffset: -88 },
      { desc: 'Range Fee — Q1 2026',    amount: 600,  status: 'paid', dueOffset: -60, paidOffset: -55 },
      { desc: 'Range Fee — Q2 2026',    amount: 600,  status: 'due',  dueOffset: 30 },
    ],
  },
  {
    archerId: 'FL0018',
    payments: [
      { desc: 'Annual Membership 2026', amount: 2500, status: 'paid', dueOffset: -90, paidOffset: -85 },
      { desc: 'Range Fee — Q1 2026',    amount: 600,  status: 'overdue', dueOffset: -30 },
      { desc: 'Range Fee — Q2 2026',    amount: 600,  status: 'due',     dueOffset: 30 },
    ],
  },
  {
    archerId: 'RM0001',
    payments: [
      { desc: 'Annual Membership 2026', amount: 2500, status: 'overdue', dueOffset: -60 },
      { desc: 'Range Fee — Q1 2026',    amount: 600,  status: 'overdue', dueOffset: -30 },
    ],
  },
  {
    archerId: 'ST0042',
    payments: [
      { desc: 'Annual Membership 2026', amount: 2500, status: 'paid', dueOffset: -90, paidOffset: -80 },
      { desc: 'Range Fee — Q1 2026',    amount: 600,  status: 'paid', dueOffset: -60, paidOffset: -58 },
      { desc: 'Equipment Hire',         amount: 200,  status: 'due',  dueOffset: 14 },
    ],
  },
  {
    archerId: 'KP0015',
    payments: [
      { desc: 'Annual Membership 2026', amount: 2500, status: 'paid', dueOffset: -90, paidOffset: -87 },
      { desc: 'Range Fee — Q1 2026',    amount: 600,  status: 'paid', dueOffset: -60, paidOffset: -59 },
      { desc: 'Range Fee — Q2 2026',    amount: 600,  status: 'due',  dueOffset: 30 },
    ],
  },
  {
    archerId: 'NB0007',
    payments: [
      { desc: 'Annual Membership 2026', amount: 2500, status: 'paid', dueOffset: -90, paidOffset: -82 },
      { desc: 'Range Fee — Q1 2026',    amount: 600,  status: 'overdue', dueOffset: -15 },
    ],
  },
  {
    archerId: 'MC0023',
    payments: [
      { desc: 'Annual Membership 2026', amount: 2500, status: 'paid', dueOffset: -90, paidOffset: -88 },
      { desc: 'Range Fee — Q1 2026',    amount: 600,  status: 'paid', dueOffset: -60, paidOffset: -55 },
      { desc: 'Competition Entry — Apr', amount: 350, status: 'due',  dueOffset: 7 },
    ],
  },
  {
    archerId: 'JD0055',
    payments: [
      { desc: 'Annual Membership 2026', amount: 2500, status: 'paid', dueOffset: -90, paidOffset: -89 },
      { desc: 'Range Fee — Q1 2026',    amount: 600,  status: 'paid', dueOffset: -60, paidOffset: -60 },
      { desc: 'Range Fee — Q2 2026',    amount: 600,  status: 'paid', dueOffset: 30,  paidOffset: -1 },
      { desc: 'Competition Entry — Apr', amount: 350, status: 'due',  dueOffset: 14 },
    ],
  },
]

function daysFromNow(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString()
}

export async function GET() {
  try {
    const payload = await getPayload({ config })
    let created = 0

    for (const { archerId: aid, payments } of PAYMENT_DATA) {
      const r = await payload.find({ collection: 'users', where: { archerId: { equals: aid } }, limit: 1 })
      if (!r.docs[0]) continue
      const userId = r.docs[0].id

      // Skip if already has payment records
      const existing = await payload.find({ collection: 'payments', where: { archer: { equals: userId } }, limit: 1 })
      if (existing.docs.length > 0) continue

      for (const p of payments) {
        await payload.create({
          collection: 'payments',
          data: {
            archer: userId as string,
            description: p.desc,
            amount: p.amount,
            status: p.status,
            dueDate: daysFromNow(p.dueOffset),
            paidDate: p.paidOffset !== undefined ? daysFromNow(p.paidOffset) : undefined,
          },
        })
        created++
      }
    }

    return NextResponse.json({ success: true, created })
  } catch (err) {
    console.error('[seed-payments]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
