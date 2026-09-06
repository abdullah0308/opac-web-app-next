/**
 * Outbound email.
 *
 * Talks to Resend over plain HTTP so there is no SDK to install or keep in
 * step. With no RESEND_API_KEY configured it logs what it would have sent and
 * reports success, which keeps local runs and previews quiet without
 * pretending mail went out — the return value says which happened.
 *
 * Env: RESEND_API_KEY, EMAIL_FROM (e.g. "OPAC <noreply@opac.mu>"),
 *      NEXT_PUBLIC_APP_URL
 */

export interface SendResult {
  sent: boolean
  skipped?: 'no-api-key' | 'no-recipient'
  id?: string
  error?: string
}

const BRAND_GREEN = '#2E7D4F'
const INK = '#1A1A18'

export function renderEmail(opts: {
  heading: string
  intro: string
  rows?: { label: string; value: string }[]
  ctaLabel?: string
  ctaHref?: string
  outro?: string
}): string {
  const rows = (opts.rows ?? [])
    .map(
      (r) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #E6E2D8;color:#5C5C58;font-size:14px;">${escapeHtml(r.label)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #E6E2D8;color:${INK};font-size:14px;font-weight:600;text-align:right;">${escapeHtml(r.value)}</td>
        </tr>`,
    )
    .join('')

  const cta =
    opts.ctaLabel && opts.ctaHref
      ? `<tr><td style="padding-top:26px;">
           <a href="${opts.ctaHref}" style="display:inline-block;background:${BRAND_GREEN};color:#ffffff;text-decoration:none;padding:13px 26px;border-radius:12px;font-size:15px;font-weight:600;">${escapeHtml(opts.ctaLabel)}</a>
         </td></tr>`
      : ''

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#F4F1EA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EA;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:18px;border:1px solid #E6E2D8;overflow:hidden;">
        <tr><td style="background:${BRAND_GREEN};padding:20px 28px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.02em;">OPAC</span>
          <span style="color:rgba(255,255,255,0.7);font-size:13px;margin-left:8px;">Oasis Pailles Archery Club</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:21px;line-height:1.3;color:${INK};">${escapeHtml(opts.heading)}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#3E4436;">${escapeHtml(opts.intro)}</p>
          ${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">${rows}</table>` : ''}
          <table role="presentation" cellpadding="0" cellspacing="0">${cta}</table>
          ${opts.outro ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#7A8070;">${escapeHtml(opts.outro)}</p>` : ''}
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#8A9080;">Oasis Pailles Archery Club, Mauritius</p>
    </td></tr>
  </table>
</body></html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<SendResult> {
  if (!opts.to) return { sent: false, skipped: 'no-recipient' }

  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? 'OPAC <onboarding@resend.dev>'

  if (!key) {
    console.info(
      `[email:skipped] no RESEND_API_KEY — would send "${opts.subject}" to ${opts.to}`,
    )
    return { sent: false, skipped: 'no-api-key' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.text ? { text: opts.text } : {}),
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[email:failed]', res.status, body)
      return { sent: false, error: `${res.status} ${body.slice(0, 200)}` }
    }

    const data = (await res.json()) as { id?: string }
    return { sent: true, id: data.id }
  } catch (err) {
    console.error('[email:error]', err)
    return { sent: false, error: String(err) }
  }
}

/** The overdue-fee reminder, addressed to the archer or their guardian. */
export function overdueReminderEmail(opts: {
  recipientName: string
  archerName: string
  isGuardian: boolean
  items: { description: string; amount: number; dueDate: string }[]
  total: number
}): { subject: string; html: string; text: string } {
  const who = opts.isGuardian ? opts.archerName : 'your'
  const subject = opts.isGuardian
    ? `${opts.archerName}'s club fees are overdue`
    : 'Your OPAC club fees are overdue'

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://opac.app'

  const html = renderEmail({
    heading: `Rs ${opts.total.toLocaleString()} outstanding`,
    intro: opts.isGuardian
      ? `Hi ${opts.recipientName}, ${opts.archerName} has club fees that have passed their due date. Details below.`
      : `Hi ${opts.recipientName}, the fees below have passed their due date.`,
    rows: opts.items.map((i) => ({
      label: `${i.description} — due ${new Date(i.dueDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`,
      value: `Rs ${i.amount.toLocaleString()}`,
    })),
    ctaLabel: 'View in the app',
    ctaHref: `${appUrl}/payments`,
    outro:
      'Already paid? Let a committee member know and we will clear it. Reply to this email if anything looks wrong.',
  })

  const text = [
    `Rs ${opts.total.toLocaleString()} outstanding`,
    '',
    opts.isGuardian
      ? `${opts.archerName} has club fees past their due date:`
      : `The following ${who} fees have passed their due date:`,
    ...opts.items.map(
      (i) => `- ${i.description}: Rs ${i.amount.toLocaleString()} (due ${new Date(i.dueDate).toLocaleDateString('en-GB')})`,
    ),
    '',
    `View in the app: ${appUrl}/payments`,
  ].join('\n')

  return { subject, html, text }
}
