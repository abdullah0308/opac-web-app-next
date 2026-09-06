import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId } from './auth'

/**
 * Who the archer screens are about.
 *
 * Most of the time that is the signed-in member. But a parent or guardian
 * listed on a child's record can switch into that child's view — for kids with
 * no phone of their own, and for parents who are members themselves. While
 * they are switched in, every archer screen reads the child's data and the
 * header says whose account is on screen.
 *
 * The ward is held in a cookie, but never trusted: it is re-checked against the
 * child's `guardians` list on every request.
 */

const WARD_COOKIE = 'opac-ward'

export interface ArcherRecord {
  id: string
  name: string
  archerId?: string
  avatarUrl?: string
  level?: string
  bowType?: string
  hideFinancials?: boolean
  [key: string]: unknown
}

export interface ViewContext {
  /** The signed-in account. */
  viewerId: string
  viewer: ArcherRecord
  /** Whose data the screen shows — the viewer, or a ward they switched into. */
  subjectId: string
  subject: ArcherRecord
  /** Children this account is a guardian for. */
  wards: ArcherRecord[]
  /** True when looking at somebody else's account. */
  isProxy: boolean
  /** Whether fees and payments may be shown on this screen. */
  canSeeFinancials: boolean
}

function toRecord(doc: Record<string, unknown>): ArcherRecord {
  return {
    ...doc,
    id: String(doc.id),
    name: (doc.name as string) ?? 'Archer',
    archerId: doc.archerId as string | undefined,
    avatarUrl: doc.avatarUrl as string | undefined,
    level: doc.level as string | undefined,
    bowType: doc.bowType as string | undefined,
    hideFinancials: Boolean(doc.hideFinancials),
  }
}

/** Children the given account is listed as a guardian of. */
export async function getWards(viewerId: string): Promise<ArcherRecord[]> {
  const payload = await getPayload({ config })
  const res = await payload
    .find({
      collection: 'users',
      where: {
        and: [{ guardians: { contains: viewerId } }, { active: { equals: true } }],
      },
      limit: 20,
      depth: 0,
    })
    .catch(() => null)
  if (!res) return []
  return (res.docs as unknown as Record<string, unknown>[]).map(toRecord)
}

export async function getViewContext(): Promise<ViewContext | null> {
  const viewerId = await getCurrentUserId()
  if (!viewerId) return null

  const payload = await getPayload({ config })
  const viewerDoc = await payload
    .findByID({ collection: 'users', id: viewerId })
    .catch(() => null)
  if (!viewerDoc) return null

  const viewer = toRecord(viewerDoc as Record<string, unknown>)
  const wards = await getWards(viewerId)

  const cookieStore = await cookies()
  const requested = cookieStore.get(WARD_COOKIE)?.value

  // Only honour the cookie if the viewer really is a guardian of that archer.
  const ward = requested ? wards.find((w) => w.id === String(requested)) : undefined

  if (!ward) {
    return {
      viewerId,
      viewer,
      subjectId: viewerId,
      subject: viewer,
      wards,
      isProxy: false,
      // An archer with a guardian handling the money does not see fees.
      canSeeFinancials: !viewer.hideFinancials,
    }
  }

  const subjectDoc = await payload
    .findByID({ collection: 'users', id: ward.id })
    .catch(() => null)
  const subject = subjectDoc ? toRecord(subjectDoc as Record<string, unknown>) : ward

  return {
    viewerId,
    viewer,
    subjectId: subject.id,
    subject,
    wards,
    isProxy: true,
    // A guardian always sees the money — that is the point of the view.
    canSeeFinancials: true,
  }
}

export const WARD_COOKIE_NAME = WARD_COOKIE
