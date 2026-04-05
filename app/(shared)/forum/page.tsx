import Link from 'next/link'
import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { ScreenHeader } from '@/components/ui/opac'

export const metadata = { title: 'Forum — OPAC' }

export default async function ForumPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })
  const user = await payload.findByID({ collection: 'users', id: userId }).catch(() => null)
  if (!user) redirect('/login')

  const postsResult = await payload.find({
    collection: 'forum-posts',
    sort: '-createdAt',
    limit: 30,
  })
  type ForumPost = { id: string | number; title?: string; body?: string; author?: { id?: string | number; name?: string } | string | null; createdAt?: string; comments?: unknown[]; likes?: unknown[] }
  const posts = postsResult.docs as unknown as ForumPost[]

  return (
    <>
      <ScreenHeader
        title="Forum"
        right={
          <Link href="/forum/new"
            className="h-9 px-4 rounded-[10px] bg-opac-green text-white font-body text-[13px] font-semibold flex items-center">
            + Post
          </Link>
        }
      />

      <div className="p-5 flex flex-col gap-3">
        {posts.length === 0 ? (
          <div className="bg-white rounded-[16px] p-8 border border-opac-border text-center">
            <p className="font-body text-[15px] text-opac-ink-60">No posts yet. Be the first to post!</p>
          </div>
        ) : (
          posts.map((post) => {
            const authorName =
              typeof post.author === 'object' && post.author !== null
                ? (post.author as { name?: string }).name ?? 'Member'
                : 'Member'
            const initials = authorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
            const timeStr = post.createdAt
              ? new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
              : ''
            const commentCount = Array.isArray(post.comments) ? post.comments.length : 0
            const likeCount = Array.isArray(post.likes) ? post.likes.length : 0
            const isAuthor = typeof post.author === 'object' && post.author !== null
              ? String((post.author as { id?: string | number }).id) === String(user.id)
              : false

            return (
              <Link key={post.id} href={`/forum/${post.id}`} className="bg-white rounded-[16px] p-4 border border-opac-border block">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isAuthor ? 'bg-opac-green' : 'bg-opac-green-light'
                  }`}>
                    <span className={`font-display text-[12px] ${isAuthor ? 'text-white' : 'text-opac-green'}`}>{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[13px] font-semibold text-opac-ink">{authorName}</p>
                    <p className="font-body text-[11px] text-opac-ink-30">{timeStr}</p>
                  </div>
                </div>
                {post.title && (
                  <p className="font-display text-[16px] text-opac-ink mb-1.5">{post.title}</p>
                )}
                {post.body && (
                  <p className="font-body text-[14px] text-opac-ink-60 line-clamp-3">{post.body as string}</p>
                )}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-opac-border">
                  <span className="font-body text-[13px] text-opac-ink-60 flex items-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 2H14C14.6 2 15 2.4 15 3V10C15 10.6 14.6 11 14 11H5L1 15V3C1 2.4 1.4 2 2 2Z" stroke="#ADADAA" strokeWidth="1.3" strokeLinejoin="round"/>
                    </svg>
                    {commentCount}
                  </span>
                  <span className="font-body text-[13px] text-opac-ink-60 flex items-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2C4.7 2 2 4.7 2 8C2 9.4 2.5 10.6 3.3 11.6L2 14L4.4 12.7C5.4 13.5 6.6 14 8 14C11.3 14 14 11.3 14 8C14 4.7 11.3 2 8 2Z" stroke="#ADADAA" strokeWidth="1.3"/>
                    </svg>
                    {likeCount}
                  </span>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </>
  )
}
