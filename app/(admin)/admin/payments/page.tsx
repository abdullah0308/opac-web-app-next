import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Payment Management — OPAC Admin' }

type PaymentDoc = {
  id: string | number
  archer?: { name?: string } | string | null
  description?: string
  amount?: number
  status?: string
  dueDate?: string
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  paid:    { label: 'Paid',    bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]' },
  overdue: { label: 'Overdue', bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]' },
  due:     { label: 'Due',     bg: 'bg-opac-gold-light', text: 'text-opac-gold' },
}

export default async function AdminPaymentsPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })
  const paymentsResult = await payload.find({
    collection: 'payments',
    sort: '-dueDate',
    limit: 100,
  })
  const payments = paymentsResult.docs as unknown as PaymentDoc[]

  const overdueTotal = payments
    .filter((p) => p.status === 'overdue')
    .reduce((s, p) => s + (p.amount ?? 0), 0)
  const paidTotal = payments
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + (p.amount ?? 0), 0)

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[24px] text-opac-ink">Payments</h1>
        <p className="font-body text-[13px] text-opac-ink-60">{payments.length} records</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-[16px] p-4 border border-opac-border">
          <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.07em] mb-1">Overdue</p>
          <p className="font-mono text-[22px] font-semibold text-opac-error">
            {overdueTotal > 0 ? `Rs ${overdueTotal.toLocaleString()}` : '—'}
          </p>
        </div>
        <div className="bg-white rounded-[16px] p-4 border border-opac-border">
          <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.07em] mb-1">Collected</p>
          <p className="font-mono text-[22px] font-semibold text-opac-success">Rs {paidTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* Payments list */}
      <div className="flex flex-col gap-2">
        {payments.map((payment) => {
          const archerName =
            typeof payment.archer === 'object' && payment.archer !== null
              ? (payment.archer as { name?: string }).name ?? 'Unknown'
              : 'Unknown'
          const status = payment.status ?? 'due'
          const cfg = statusConfig[status] ?? statusConfig.due
          const dateStr = payment.dueDate
            ? new Date(payment.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—'

          return (
            <div key={String(payment.id)} className="bg-white rounded-[14px] px-4 py-3.5 border border-opac-border flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-body text-[14px] font-semibold text-opac-ink">{archerName}</p>
                <p className="font-body text-[12px] text-opac-ink-60">{payment.description ?? 'Club fee'} · Due {dateStr}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="font-mono text-[15px] font-semibold text-opac-ink">
                  Rs {(payment.amount ?? 0).toLocaleString()}
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
