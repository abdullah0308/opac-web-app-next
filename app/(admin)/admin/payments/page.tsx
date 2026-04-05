import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import type { BasePayload } from 'payload'
import PaymentsClient from './PaymentsClient'

export const metadata = { title: 'Payment Management — OPAC Admin' }

const MONTHLY_AMOUNT = 300
const MONTHLY_DESC = 'Monthly club fee'
// Generate from this month onwards (going back 12 months max)
const START_YEAR = 2026
const START_MONTH = 1 // January

async function syncMonthlyPayments(payload: BasePayload) {
  const today = new Date()

  // Build list of months from START to current
  const months: { year: number; month: number }[] = []
  const d = new Date(START_YEAR, START_MONTH - 1, 1)
  while (d <= today) {
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
    d.setMonth(d.getMonth() + 1)
  }

  // Get all archers
  const archersResult = await payload.find({
    collection: 'users',
    limit: 500,
    overrideAccess: true,
  })

  for (const archer of archersResult.docs) {
    for (const { year, month } of months) {
      const dueDateISO = `${year}-${String(month).padStart(2, '0')}-05T00:00:00.000Z`
      const dueDate = new Date(dueDateISO)
      const status = dueDate < today ? 'overdue' : 'due'

      // Check if already exists
      const existing = await payload.find({
        collection: 'payments',
        where: {
          and: [
            { archer: { equals: archer.id } },
            { dueDate: { equals: dueDateISO } },
            { description: { equals: MONTHLY_DESC } },
          ],
        },
        limit: 1,
        overrideAccess: true,
      })

      if (existing.docs.length === 0) {
        await payload.create({
          collection: 'payments',
          overrideAccess: true,
          data: {
            archer: Number(archer.id),
            amount: MONTHLY_AMOUNT,
            dueDate: dueDateISO,
            status,
            description: MONTHLY_DESC,
          },
        })
      }
    }
  }

  // Mark any due payments with a past dueDate as overdue
  const overdueCheck = await payload.find({
    collection: 'payments',
    where: {
      and: [
        { status: { equals: 'due' } },
        { dueDate: { less_than: today.toISOString() } },
      ],
    },
    limit: 500,
    overrideAccess: true,
  })
  for (const p of overdueCheck.docs) {
    await payload.update({
      collection: 'payments',
      id: p.id,
      overrideAccess: true,
      data: { status: 'overdue' },
    })
  }
}

export default async function AdminPaymentsPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })

  // Auto-sync monthly payments before displaying
  await syncMonthlyPayments(payload)

  const [paymentsResult, archersResult] = await Promise.all([
    payload.find({ collection: 'payments', sort: '-dueDate', limit: 200, depth: 1 }),
    payload.find({ collection: 'users', sort: 'name', limit: 200, overrideAccess: true }),
  ])

  type PaymentDoc = {
    id: string | number
    archer?: { id?: string | number; name?: string } | string | null
    description?: string
    amount?: number
    status?: string
    dueDate?: string
  }

  const payments = (paymentsResult.docs as unknown as PaymentDoc[]).map((p) => ({
    id: p.id,
    archerName:
      typeof p.archer === 'object' && p.archer !== null
        ? (p.archer as { name?: string }).name ?? 'Unknown'
        : 'Unknown',
    description: p.description,
    amount: p.amount ?? 0,
    status: p.status ?? 'due',
    dueDate: p.dueDate,
  }))

  const archers = archersResult.docs.map((u) => ({
    id: u.id,
    name: (u as unknown as { name?: string }).name,
    archerId: (u as unknown as { archerId?: string }).archerId,
  }))

  const overdueTotal = payments.filter((p) => p.status === 'overdue').reduce((s, p) => s + p.amount, 0)
  const paidTotal = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)

  return (
    <div className="p-6 flex flex-col gap-5">
      <PaymentsClient
        archers={archers}
        payments={payments}
        overdueTotal={overdueTotal}
        paidTotal={paidTotal}
      />
    </div>
  )
}
