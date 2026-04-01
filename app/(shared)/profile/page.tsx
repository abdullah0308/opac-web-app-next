import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { ScreenHeader, RoleChip, RoleModeSwitch, AdminAccessButton, LogoutButton } from '@/components/ui/opac'

export const metadata = { title: 'Profile — OPAC' }

export default async function ProfilePage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })
  const user = await payload.findByID({ collection: 'users', id: userId }).catch(() => null)
  if (!user) redirect('/login')

  const roles = (user.roles ?? []) as string[]
  const displayName = (user.name as string) || 'Archer'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const clanName =
    typeof user.clanId === 'object' && user.clanId !== null
      ? (user.clanId as { name?: string }).name ?? '—'
      : '—'

  return (
    <>
      <ScreenHeader title="Profile" />

      <div className="p-5 flex flex-col gap-4">
        {/* Avatar & name */}
        <div className="bg-white rounded-[20px] p-6 border border-opac-border flex flex-col items-center gap-3">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl as string}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-opac-green-light flex items-center justify-center">
              <span className="font-display text-[28px] text-opac-green">{initials}</span>
            </div>
          )}
          <div className="text-center">
            <p className="font-display text-[22px] text-opac-ink">{displayName}</p>
            <p className="font-body text-[14px] text-opac-ink-60">{user.email as string}</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {roles.map((role) => (
              <RoleChip key={role} role={role as 'archer' | 'coach' | 'admin'} />
            ))}
          </div>
          {roles.includes('coach') && <RoleModeSwitch />}
          {roles.includes('admin') && <AdminAccessButton />}
        </div>

        {/* Details */}
        <div className="bg-white rounded-[16px] border border-opac-border divide-y divide-opac-border">
          {[
            { label: 'Bow type', value: user.bowType as string ?? '—' },
            { label: 'Gender', value: user.gender as string ?? '—' },
            { label: 'Clan', value: clanName },
            { label: 'Phone', value: user.phone as string ?? '—' },
            {
              label: 'Date of birth',
              value: user.dateOfBirth
                ? new Date(user.dateOfBirth as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                : '—',
            },
            {
              label: 'Face ID',
              value: user.faceEnrolled ? 'Enrolled' : 'Not enrolled',
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-3.5">
              <span className="font-body text-[14px] text-opac-ink-60">{label}</span>
              <span className="font-body text-[14px] font-semibold text-opac-ink capitalize">{value}</span>
            </div>
          ))}
        </div>
        <LogoutButton />
      </div>
    </>
  )
}
