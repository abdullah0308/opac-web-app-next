import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { ScreenHeader } from '@/components/ui/opac'

export const metadata = { title: 'Payments — OPAC' }

const statusConfig = {
  paid:    { label: 'Paid',    bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]' },
  overdue: { label: 'Overdue', bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]' },
  due:     { label: 'Due',     bg: 'bg-opac-gold-light', text: 'text-opac-gold' },
}

export default async function PaymentsPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })
  const user = await payload.findByID({ collection: 'users', id: userId }).catch(() => null)
  if (!user) redirect('/login')

  const paymentsResult = await payload.find({
    collection: 'payments',
    where: { archer: { equals: user.id } },
    sort: '-dueDate',
    limit: 50,
  })
  type PaymentDoc = { id: string | number; description?: string; amount?: number; status?: string; dueDate?: string; paidDate?: string }
  const payments = paymentsResult.docs as unknown as PaymentDoc[]

  const overdueTotal = payments
    .filter((p) => p.status === 'overdue')
    .reduce((s, p) => s + (p.amount ?? 0), 0)
  const paidTotal = payments
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + (p.amount ?? 0), 0)



  return (
    <>
      <ScreenHeader title="Payments" />

      <div className="p-5 flex flex-col gap-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-[16px] p-4 border border-opac-border">
            <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.07em] mb-1">Outstanding</p>
            <p className="font-mono text-[24px] font-semibold text-opac-error">
              {overdueTotal > 0 ? `Rs ${overdueTotal.toLocaleString()}` : '—'}
            </p>
          </div>
          <div className="bg-white rounded-[16px] p-4 border border-opac-border">
            <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.07em] mb-1">Paid (total)</p>
            <p className="font-mono text-[24px] font-semibold text-opac-success">Rs {paidTotal.toLocaleString()}</p>
          </div>
        </div>

        {/* Payments list */}
        {payments.length === 0 ? (
          <div className="bg-white rounded-[16px] p-8 border border-opac-border text-center">
            <p className="font-body text-[15px] text-opac-ink-60">No payment records found.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {payments.map((payment) => {
              const status = (payment.status ?? 'due') as keyof typeof statusConfig
              const cfg = statusConfig[status] ?? statusConfig.due
              const dateStr = payment.dueDate
                ? new Date(payment.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—'

              return (
                <div key={payment.id} className="bg-white rounded-[14px] px-4 py-3.5 border border-opac-border flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[14px] font-semibold text-opac-ink">
                      {payment.description ?? 'Club fee'}
                    </p>
                    <p className="font-body text-[12px] text-opac-ink-60">Due {dateStr}</p>
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
        )}
      </div>
    </>
  )
}
