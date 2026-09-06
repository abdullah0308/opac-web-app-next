import { redirect } from 'next/navigation'
import { getViewContext } from '@/lib/viewer'
import { getLeaderboard, categoryFor } from '@/lib/leaderboard'
import { ScreenHeader } from '@/components/ui/opac'
import LeaderboardClient from './LeaderboardClient'

export const metadata = { title: 'Leaderboard — OPAC' }

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const ctx = await getViewContext()
  if (!ctx) redirect('/login')

  const [board, params] = await Promise.all([getLeaderboard(), searchParams])

  return (
    <>
      <ScreenHeader title="Leaderboard" subtitle={`Season ${board.season}`} />
      <div className="p-5">
        <LeaderboardClient
          byCategory={board.byCategory}
          clans={board.clans}
          clanEnabled={board.clanEnabled}
          season={board.season}
          minimumSessions={board.minimumSessions}
          meId={ctx.subjectId}
          myCategory={categoryFor(ctx.subject)}
          initialTab={params.tab}
        />
      </div>
    </>
  )
}
