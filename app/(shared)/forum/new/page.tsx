import { Suspense } from 'react'
import { getCurrentUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ForumNewPostClient from './ForumNewPostClient'

export const metadata = { title: 'New Post — OPAC' }

export default async function ForumNewPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  return (
    <Suspense>
      <ForumNewPostClient authorId={userId} />
    </Suspense>
  )
}
