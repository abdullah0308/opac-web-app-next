import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { archerId, description, amount, dueDate } = await req.json()
    if (!archerId || !amount || !dueDate) {
      return NextResponse.json({ error: 'archerId, amount, and dueDate are required' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    await payload.create({
      collection: 'payments',
      overrideAccess: true,
      data: {
        archer: Number(archerId),
        description: description?.trim() || 'Club fee',
        amount: Number(amount),
        dueDate,
        status: 'due',
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/payments POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { paymentId, status } = await req.json()
    if (!paymentId || !status) {
      return NextResponse.json({ error: 'paymentId and status are required' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const updateData: Record<string, unknown> = { status }
    if (status === 'paid') {
      updateData.paidDate = new Date().toISOString()
      updateData.markedPaidBy = Number(userId)
    }

    await payload.update({
      collection: 'payments',
      id: paymentId,
      overrideAccess: true,
      data: updateData,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/payments PATCH]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
