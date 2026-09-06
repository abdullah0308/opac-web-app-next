import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getCurrentUserId, getUserRoles } from '@/lib/auth'

/**
 * POST /api/upload/image
 * multipart/form-data: file, folder
 *
 * Admin-only general image upload — clan crests today, anything else later.
 * Returns the blob URL; the caller decides which record to attach it to.
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const roles = await getUserRoles()
    if (!roles.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string | null) ?? 'uploads'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 5 MB' }, { status: 400 })
    }

    const safeFolder = folder.replace(/[^a-z0-9-]/gi, '') || 'uploads'
    const ext = file.name.split('.').pop() ?? 'png'
    const blob = await put(
      `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`,
      file,
      { access: 'public', contentType: file.type },
    )

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error('[upload image]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
