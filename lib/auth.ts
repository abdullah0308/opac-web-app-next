import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Decodes the Payload JWT stored in the `payload-token` cookie.
 * Returns the Payload user ID, or null if missing/invalid.
 */
function decodePayloadToken(token: string): string | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const json = Buffer.from(parts[1], 'base64url').toString('utf8')
    const { id } = JSON.parse(json) as { id?: string }
    return id ? String(id) : null
  } catch {
    return null
  }
}

/** Returns the current user's Payload document ID from their JWT cookie. */
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value
  if (!token) return null
  return decodePayloadToken(token)
}

/** Returns the current user's roles array. Falls back to ['archer']. */
export async function getUserRoles(): Promise<string[]> {
  const userId = await getCurrentUserId()
  if (!userId) return []
  try {
    const payload = await getPayload({ config })
    const user = await payload.findByID({ collection: 'users', id: userId })
    const roles = (user as { roles?: string[] })?.roles
    return Array.isArray(roles) && roles.length > 0 ? roles : ['archer']
  } catch {
    return ['archer']
  }
}

/**
 * Redirects to /login if not authenticated,
 * or to /dashboard if the user lacks the required role.
 */
export async function requireRole(role: string): Promise<void> {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')
  const roles = await getUserRoles()
  if (!roles.includes(role)) redirect('/dashboard')
}

export async function isAdmin(): Promise<boolean> {
  return (await getUserRoles()).includes('admin')
}

export async function isCoach(): Promise<boolean> {
  return (await getUserRoles()).includes('coach')
}

/**
 * Returns the Payload user document for the current user, or null.
 */
export async function getCurrentPayloadUser(): Promise<Record<string, unknown> | null> {
  const userId = await getCurrentUserId()
  if (!userId) return null
  try {
    const payload = await getPayload({ config })
    return await payload.findByID({ collection: 'users', id: userId }) as Record<string, unknown>
  } catch {
    return null
  }
}
