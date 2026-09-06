import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { ModerateClient } from './ModerateClient'

export const metadata = { title: 'Forum Moderation — OPAC Admin' }

export default async function AdminForumPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })
  const postsResult = await payload.find({
    collection: 'forum-posts',
    sort: '-createdAt',
    limit: 50,
  })
  const posts = postsResult.docs

  return (
    <div className="p-6 flex flex-col gap-5 stagger">
      <div>
        <h1 className="font-display text-[24px] text-opac-ink">Forum Moderation</h1>
        <p className="font-body text-[13px] text-opac-ink-60">{posts.length} posts</p>
      </div>

      {posts.length === 0 ? (
        <div className="glass-card rounded-[16px] p-8 text-center">
          <p className="font-body text-[15px] text-opac-ink-60">No forum posts yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post: {
            id: string | number
            title?: string
            body?: string
            author?: { name?: string } | string | null
            createdAt?: string
            comments?: unknown[]
            likes?: unknown[]
            pinned?: boolean
            locked?: boolean
          }) => {
            const authorName =
              typeof post.author === 'object' && post.author !== null
                ? (post.author as { name?: string }).name ?? 'Member'
                : 'Member'
            const dateStr = post.createdAt
              ? new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : ''
            const commentCount = Array.isArray(post.comments) ? post.comments.length : 0

            return (
              <div key={post.id} className="glass-card rounded-[14px] p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    {post.title && (
                      <p className="font-display text-[16px] text-opac-ink mb-1 flex items-center gap-2 flex-wrap">
                        {post.title}
                        {post.pinned && (
                          <span className="font-body text-[10px] font-bold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-[5px] bg-[rgba(212,160,23,0.18)] text-[#8A6508]">
                            Pinned
                          </span>
                        )}
                        {post.locked && (
                          <span className="font-body text-[10px] font-bold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-[5px] bg-[rgba(220,38,38,0.14)] text-opac-error">
                            Locked
                          </span>
                        )}
                      </p>
                    )}
                    {post.body && (
                      <p className="font-body text-[13px] text-opac-ink-60 line-clamp-2">{post.body as string}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-opac-border">
                  <span className="font-body text-[12px] text-opac-ink-60">
                    {authorName} · {dateStr}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-body text-[12px] text-opac-ink-60">{commentCount} comments</span>
                    <ModerateClient
                      postId={String(post.id)}
                      pinned={Boolean(post.pinned)}
                      locked={Boolean(post.locked)}
                      title={post.title ?? 'this post'}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
