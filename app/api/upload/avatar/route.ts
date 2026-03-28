import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId } from '@/lib/auth'

/**
 * POST /api/upload/avatar
 * Accepts multipart/form-data with a field named "file".
 * Uploads to Vercel Blob and updates the user's avatarUrl in Payload.
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Limit to 5 MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 5 MB' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const filename = `avatars/${userId}-${Date.now()}.${ext}`

    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    })

    // Update Payload user record
    const payload = await getPayload({ config })
    const user = await payload.findByID({ collection: 'users', id: userId }).catch(() => null)
    if (user) {
      await payload.update({
        collection: 'users',
        id: user.id,
        data: { avatarUrl: blob.url },
      })
    }

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error('[upload avatar]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
