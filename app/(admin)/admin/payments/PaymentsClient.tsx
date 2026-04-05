'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Archer = { id: string | number; name?: string; archerId?: string }
type Payment = {
  id: string | number
  archerName: string
  description?: string
  amount: number
  status: string
  dueDate?: string
}

const STATUS_CYCLE: Record<string, string> = {
  due: 'paid',
  overdue: 'paid',
  paid: 'due',
}

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  paid:    { label: 'Paid',    bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]' },
  overdue: { label: 'Overdue', bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]' },
  due:     { label: 'Due',     bg: 'bg-opac-gold-light', text: 'text-opac-gold' },
}

export default function PaymentsClient({
  archers,
  payments: initialPayments,
  overdueTotal: initOverdue,
  paidTotal: initPaid,
}: {
  archers: Archer[]
  payments: Payment[]
  overdueTotal: number
  paidTotal: number
}) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [archerId, setArcherId] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [statusLoading, setStatusLoading] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archerId, description, amount: Number(amount), dueDate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Failed to create payment')
      setShowModal(false)
      setArcherId('')
      setDescription('')
      setAmount('')
      setDueDate('')
      router.refresh()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setCreating(false)
    }
  }

  async function toggleStatus(paymentId: string | number, currentStatus: string) {
    const newStatus = STATUS_CYCLE[currentStatus] ?? 'due'
    setStatusLoading(String(paymentId))
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: String(paymentId), status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data?.error ?? 'Failed to update status')
      } else {
        router.refresh()
      }
    } finally {
      setStatusLoading(null)
    }
  }

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[24px] text-opac-ink">Payments</h1>
          <p className="font-body text-[13px] text-opac-ink-60">{initialPayments.length} records</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="h-9 px-4 rounded-[10px] bg-opac-green text-white font-body text-[13px] font-semibold"
        >
          + Add
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-[16px] p-4 border border-opac-border">
          <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.07em] mb-1">Overdue</p>
          <p className="font-mono text-[22px] font-semibold text-opac-error">
            {initOverdue > 0 ? `Rs ${initOverdue.toLocaleString()}` : '—'}
          </p>
        </div>
        <div className="bg-white rounded-[16px] p-4 border border-opac-border">
          <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.07em] mb-1">Collected</p>
          <p className="font-mono text-[22px] font-semibold text-opac-success">Rs {initPaid.toLocaleString()}</p>
        </div>
      </div>

      {/* Payments list */}
      <div className="flex flex-col gap-2">
        {initialPayments.length === 0 && (
          <div className="bg-white rounded-[16px] p-8 border border-opac-border text-center">
            <p className="font-body text-[15px] text-opac-ink-60">No payments yet.</p>
          </div>
        )}
        {initialPayments.map((payment) => {
          const status = payment.status ?? 'due'
          const cfg = STATUS_CFG[status] ?? STATUS_CFG.due
          const dateStr = payment.dueDate
            ? new Date(payment.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—'
          const isLoading = statusLoading === String(payment.id)

          return (
            <div key={String(payment.id)} className="bg-white rounded-[14px] px-4 py-3.5 border border-opac-border flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-body text-[14px] font-semibold text-opac-ink">{payment.archerName}</p>
                <p className="font-body text-[12px] text-opac-ink-60">{payment.description ?? 'Club fee'} · Due {dateStr}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="font-mono text-[15px] font-semibold text-opac-ink">
                  Rs {(payment.amount ?? 0).toLocaleString()}
                </span>
                <button
                  onClick={() => toggleStatus(payment.id, status)}
                  disabled={isLoading}
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text} disabled:opacity-50 active:scale-95 transition-transform`}
                >
                  {isLoading ? '…' : cfg.label}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div
            className="bg-white rounded-t-[24px] w-full max-w-md p-6 pb-8 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[20px] text-opac-ink">Add Payment</h2>
              <button onClick={() => setShowModal(false)} className="text-opac-ink-30 text-[22px] leading-none">×</button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-[12px] font-semibold text-opac-ink-60 uppercase tracking-[0.07em]">Archer</label>
                <select
                  value={archerId}
                  onChange={(e) => setArcherId(e.target.value)}
                  required
                  className="w-full rounded-[12px] border border-opac-border bg-white px-3.5 py-3 font-body text-[14px] text-opac-ink focus:outline-none focus:border-opac-green"
                >
                  <option value="">Select archer…</option>
                  {archers.map((a) => (
                    <option key={String(a.id)} value={String(a.id)}>
                      {a.archerId ? `${a.archerId} — ` : ''}{a.name ?? 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-body text-[12px] font-semibold text-opac-ink-60 uppercase tracking-[0.07em]">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Club fee"
                  className="w-full rounded-[12px] border border-opac-border bg-white px-3.5 py-3 font-body text-[14px] text-opac-ink focus:outline-none focus:border-opac-green"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-[12px] font-semibold text-opac-ink-60 uppercase tracking-[0.07em]">Amount (Rs)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="500"
                    min={0}
                    required
                    className="w-full rounded-[12px] border border-opac-border bg-white px-3.5 py-3 font-body text-[14px] text-opac-ink focus:outline-none focus:border-opac-green"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-[12px] font-semibold text-opac-ink-60 uppercase tracking-[0.07em]">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full rounded-[12px] border border-opac-border bg-white px-3.5 py-3 font-body text-[14px] text-opac-ink focus:outline-none focus:border-opac-green"
                  />
                </div>
              </div>

              {createError && <p className="font-body text-[13px] text-opac-error">{createError}</p>}

              <button
                type="submit"
                disabled={creating}
                className="h-11 rounded-[12px] bg-opac-green text-white font-body text-[14px] font-semibold disabled:opacity-50 mt-1"
              >
                {creating ? 'Saving…' : 'Add Payment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
