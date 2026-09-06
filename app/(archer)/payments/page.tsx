import { getViewContext } from '@/lib/viewer'
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
  const ctx = await getViewContext()
  if (!ctx) redirect('/login')
  const userId = ctx.subjectId

  // A guardian handles this archer's fees — keep the money off their screen.
  if (!ctx.canSeeFinancials) {
    return (
      <>
        <ScreenHeader title="Payments" />
        <div className="p-5 stagger">
          <div className="glass-card rounded-[18px] p-8 text-center">
            <div className="w-14 h-14 rounded-full glass-well mx-auto flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4" y="10" width="16" height="10" rx="2.5" stroke="#5C5C58" strokeWidth="1.6" />
                <path d="M8 10V7.5a4 4 0 1 1 8 0V10" stroke="#5C5C58" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <p className="font-display text-[19px] text-opac-ink mb-2">A parent looks after your fees</p>
            <p className="font-body text-[14px] text-opac-ink-60 leading-relaxed max-w-[260px] mx-auto">
              Club payments for your membership are handled by your parent or guardian, so
              there is nothing for you to do here. Just turn up and shoot.
            </p>
          </div>
        </div>
      </>
    )
  }

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

      <div className="p-5 flex flex-col gap-4 stagger">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-[16px] p-4">
            <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.07em] mb-1">Outstanding</p>
            <p className="font-mono text-[24px] font-semibold text-opac-error">
              {overdueTotal > 0 ? `Rs ${overdueTotal.toLocaleString()}` : '—'}
            </p>
          </div>
          <div className="glass-card rounded-[16px] p-4">
            <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.07em] mb-1">Paid (total)</p>
            <p className="font-mono text-[24px] font-semibold text-opac-success">Rs {paidTotal.toLocaleString()}</p>
          </div>
        </div>

        {/* Payments list */}
        {payments.length === 0 ? (
          <div className="glass-card rounded-[16px] p-8 text-center">
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
                <div key={payment.id} className="glass-card rounded-[14px] px-4 py-3.5 flex items-center gap-3">
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
