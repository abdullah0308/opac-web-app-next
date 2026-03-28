import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { ScreenHeader } from '@/components/ui/opac'

export const metadata = { title: 'Leaderboard — OPAC' }

export default async function LeaderboardPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })
  const user = await payload.findByID({ collection: 'users', id: userId }).catch(() => null)
  if (!user) redirect('/login')

  // Get all archers with their scores
  const archersResult = await payload.find({
    collection: 'users',
    where: {
      and: [
        { active: { equals: true } },
        { roles: { contains: 'archer' } },
      ],
    },
    limit: 50,
  })

  // Aggregate scores per archer (top score this season)
  const scoresResult = await payload.find({
    collection: 'scores',
    sort: '-points',
    limit: 200,
  })

  type ScoreDoc = { archer: string | { id: string | number } | null; points?: number }
  const scoresByArcher = new Map<string, number>()
  for (const score of scoresResult.docs as unknown as ScoreDoc[]) {
    const archerId = typeof score.archer === 'object' && score.archer !== null
      ? String((score.archer as { id: string | number }).id)
      : String(score.archer)
    if (!scoresByArcher.has(archerId)) {
      scoresByArcher.set(archerId, score.points ?? 0)
    }
  }

  type ArcherDoc = { id: string | number; name?: string; bowType?: string; gender?: string }
  const ranked = (archersResult.docs as unknown as ArcherDoc[])
    .map((a) => ({ ...a, bestScore: scoresByArcher.get(String(a.id)) ?? 0 }))
    .sort((a, b) => b.bestScore - a.bestScore)

  const currentUserId = String(user.id)

  return (
    <>
      <ScreenHeader title="Leaderboard" />

      <div className="p-5 flex flex-col gap-4">
        {/* Filter tabs — static display */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['All', 'Recurve', 'Compound', 'Male', 'Female'].map((tab, i) => (
            <div key={tab}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full border text-[13px] font-body font-semibold ${
                i === 0
                  ? 'bg-opac-green text-white border-opac-green'
                  : 'bg-white text-opac-ink-60 border-opac-border'
              }`}>
              {tab}
            </div>
          ))}
        </div>

        {/* Podium (top 3) */}
        {ranked.length >= 3 && (
          <div className="bg-white rounded-[20px] p-4 border border-opac-border">
            <div className="flex items-end justify-center gap-3 pt-2 pb-3">
              {/* 2nd */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-11 h-11 rounded-full bg-opac-surface flex items-center justify-center">
                  <span className="font-display text-[13px] text-opac-ink-60">
                    {String(ranked[1].name ?? '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="w-14 h-14 bg-[#E8E8E4] rounded-t-[8px] flex items-end justify-center pb-1">
                  <span className="font-mono text-[10px] font-semibold text-opac-ink-60">2nd</span>
                </div>
              </div>
              {/* 1st */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[20px]">🥇</span>
                <div className="w-13 h-13 rounded-full bg-opac-green-light flex items-center justify-center w-12 h-12">
                  <span className="font-display text-[14px] text-opac-green">
                    {String(ranked[0].name ?? '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="w-14 h-20 bg-opac-green rounded-t-[8px] flex items-end justify-center pb-1">
                  <span className="font-mono text-[10px] font-semibold text-white">1st</span>
                </div>
              </div>
              {/* 3rd */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-11 h-11 rounded-full bg-opac-surface flex items-center justify-center">
                  <span className="font-display text-[13px] text-opac-ink-60">
                    {String(ranked[2].name ?? '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="w-14 h-10 bg-[#D4A01740] rounded-t-[8px] flex items-end justify-center pb-1">
                  <span className="font-mono text-[10px] font-semibold text-opac-gold">3rd</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full ranked list */}
        <div className="flex flex-col gap-2">
          {ranked.map((archer, i) => {
            const isMe = String(archer.id) === currentUserId
            const initials = String(archer.name ?? '')
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()

            return (
              <div key={String(archer.id)}
                className={`flex items-center gap-3 rounded-[14px] px-4 py-3 border ${
                  isMe ? 'bg-opac-green-light border-opac-green' : 'bg-white border-opac-border'
                }`}>
                <span className={`font-mono text-[15px] font-semibold w-6 text-center ${
                  i === 0 ? 'text-opac-gold' : isMe ? 'text-opac-green' : 'text-opac-ink-30'
                }`}>
                  {i + 1}
                </span>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isMe ? 'bg-opac-green' : 'bg-opac-green-light'
                }`}>
                  <span className={`font-display text-[12px] ${isMe ? 'text-white' : 'text-opac-green'}`}>{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-body text-[14px] font-semibold ${isMe ? 'text-opac-green' : 'text-opac-ink'}`}>
                    {archer.name ?? 'Archer'} {isMe && '(You)'}
                  </p>
                  <p className="font-body text-[12px] text-opac-ink-60 capitalize">
                    {archer.bowType ?? ''} {archer.gender ? `· ${archer.gender}` : ''}
                  </p>
                </div>
                <span className={`font-mono text-[16px] font-semibold ${isMe ? 'text-opac-green' : 'text-opac-ink'}`}>
                  {archer.bestScore > 0 ? archer.bestScore : '—'}
                </span>
              </div>
            )
          })}
        </div>

        {ranked.length === 0 && (
          <div className="bg-white rounded-[16px] p-8 border border-opac-border text-center">
            <p className="font-body text-[15px] text-opac-ink-60">No scores recorded yet.</p>
          </div>
        )}
      </div>
    </>
  )
}
