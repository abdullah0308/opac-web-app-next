import Link from 'next/link'
import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { ScreenHeader } from '@/components/ui/opac'

export const metadata = { title: 'Archers — OPAC Coach' }

export default async function ArcherListPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })

  const archersResult = await payload.find({
    collection: 'users',
    where: {
      and: [
        { roles: { contains: 'archer' } },
        { active: { equals: true } },
      ],
    },
    sort: 'name',
    limit: 100,
  })
  type ArcherDoc = { id: string | number; name?: string; bowType?: string; gender?: string }
  const archers = archersResult.docs as unknown as ArcherDoc[]

  // Get best score per archer
  const scoresResult = await payload.find({
    collection: 'scores',
    sort: '-points',
    limit: 500,
  })

  type ScoreDoc = { archer: string | { id: string | number } | null; points?: number }
  const bestByArcher = new Map<string, number>()
  for (const s of scoresResult.docs as unknown as ScoreDoc[]) {
    const id = typeof s.archer === 'object' && s.archer !== null
      ? String((s.archer as { id: string | number }).id)
      : String(s.archer)
    if (!bestByArcher.has(id)) bestByArcher.set(id, s.points ?? 0)
  }

  return (
    <>
      <ScreenHeader title="Archers" subtitle={`${archers.length} active`} />

      <div className="p-5 flex flex-col gap-3">
        {archers.length === 0 ? (
          <div className="bg-white rounded-[16px] p-8 border border-opac-border text-center">
            <p className="font-body text-[15px] text-opac-ink-60">No active archers found.</p>
          </div>
        ) : (
          archers.map((archer) => {
            const name = archer.name ?? 'Archer'
            const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
            const best = bestByArcher.get(String(archer.id)) ?? 0

            return (
              <Link key={String(archer.id)} href={`/coach/archers/${archer.id}`}
                className="bg-white rounded-[14px] px-4 py-3.5 border border-opac-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-opac-green-light flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-[13px] text-opac-green">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[14px] font-semibold text-opac-ink">{name}</p>
                  <p className="font-body text-[12px] text-opac-ink-60 capitalize">
                    {archer.bowType ?? 'recurve'} · {archer.gender ?? ''}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {best > 0 && (
                    <span className="font-mono text-[15px] font-semibold text-opac-green">{best}</span>
                  )}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 12L10 8L6 4" stroke="#ADADAA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </>
  )
}
