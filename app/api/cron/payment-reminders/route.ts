import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET /api/cron/payment-reminders
 * Intended to be called by a Vercel Cron job daily.
 * Finds all overdue payments and logs them (email/push notification placeholder).
 *
 * Secured with CRON_SECRET header.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })

    const overdueResult = await payload.find({
      collection: 'payments',
      where: {
        and: [
          { status: { equals: 'due' } },
          { dueDate: { less_than: new Date().toISOString() } },
        ],
      },
      limit: 500,
    })

    const updated: (string | number)[] = []

    for (const payment of overdueResult.docs) {
      // Mark as overdue
      await payload.update({
        collection: 'payments',
        id: payment.id,
        data: { status: 'overdue' },
      })
      updated.push(payment.id)

      // TODO: send email/push notification to archer
      const archerName = typeof payment.archer === 'object' && payment.archer !== null
        ? (payment.archer as { name?: string }).name
        : null
      console.log(`[payment-reminders] Marked overdue: ${payment.id} for ${archerName ?? 'unknown'}`)
    }

    return NextResponse.json({
      processed: updated.length,
      ids: updated,
    })
  } catch (err) {
    console.error('[cron payment-reminders]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
