import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect, notFound } from 'next/navigation'
import { ScreenHeader } from '@/components/ui/opac'
import ForumReplyClient from './ForumReplyClient'

export default async function ForumPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })

  let post
  try {
    post = await payload.findByID({ collection: 'forum-posts', id, depth: 2 })
  } catch {
    notFound()
  }

  type AuthorObj = { id?: string | number; name?: string }
  type Comment = { id?: string; author?: AuthorObj | string | null; body?: string; createdAt?: string }

  const authorName = typeof post.author === 'object' && post.author !== null
    ? (post.author as AuthorObj).name ?? 'Member'
    : 'Member'
  const initials = authorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const dateStr = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''
  const comments = (post.comments ?? []) as Comment[]

  return (
    <>
      <ScreenHeader title="Post" showBack backHref="/forum" />

      <div className="p-5 flex flex-col gap-4">
        {/* Post */}
        <div className="bg-white rounded-[16px] p-4 border border-opac-border">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-full bg-opac-green-light flex items-center justify-center flex-shrink-0">
              <span className="font-display text-[12px] text-opac-green">{initials}</span>
            </div>
            <div>
              <p className="font-body text-[13px] font-semibold text-opac-ink">{authorName}</p>
              <p className="font-body text-[11px] text-opac-ink-30">{dateStr}</p>
            </div>
          </div>
          {post.title && (
            <p className="font-display text-[18px] text-opac-ink mb-2">{post.title as string}</p>
          )}
          <p className="font-body text-[14px] text-opac-ink-60 leading-relaxed">{post.body as string}</p>
        </div>

        {/* Comments */}
        {comments.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.08em]">
              {comments.length} {comments.length === 1 ? 'Reply' : 'Replies'}
            </p>
            {comments.map((c, i) => {
              const cAuthorName = typeof c.author === 'object' && c.author !== null
                ? (c.author as AuthorObj).name ?? 'Member'
                : 'Member'
              const cInitials = cAuthorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
              const cDate = c.createdAt
                ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                : ''
              const isMe = typeof c.author === 'object' && c.author !== null
                ? String((c.author as AuthorObj).id) === String(userId)
                : false
              return (
                <div key={c.id ?? i} className="bg-white rounded-[14px] p-3.5 border border-opac-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-opac-green' : 'bg-opac-green-light'}`}>
                      <span className={`font-display text-[10px] ${isMe ? 'text-white' : 'text-opac-green'}`}>{cInitials}</span>
                    </div>
                    <p className="font-body text-[13px] font-semibold text-opac-ink flex-1">{cAuthorName}</p>
                    <span className="font-body text-[11px] text-opac-ink-30">{cDate}</span>
                  </div>
                  <p className="font-body text-[14px] text-opac-ink-60 leading-snug">{c.body}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Reply box */}
        <div>
          <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.08em] mb-3">Add a reply</p>
          <ForumReplyClient postId={String(post.id)} />
        </div>
      </div>
    </>
  )
}
