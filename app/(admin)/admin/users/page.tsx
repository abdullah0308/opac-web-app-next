import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { AddArcherClient } from './AddArcherClient'

export const metadata = { title: 'User Management — OPAC Admin' }

export default async function AdminUsersPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })
  const [usersResult, clansResult] = await Promise.all([
    payload.find({ collection: 'users', sort: 'name', limit: 100 }),
    payload.find({ collection: 'clans', sort: 'name', limit: 20 }),
  ])
  type UserDoc = { id: string | number; name?: string; email?: string; roles?: string[]; active?: boolean; bowType?: string }
  const users = usersResult.docs as unknown as UserDoc[]
  const clans = clansResult.docs.map(c => ({ id: String(c.id), name: c.name as string }))

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[24px] text-opac-ink">Members</h1>
          <p className="font-body text-[13px] text-opac-ink-60">{users.length} total</p>
        </div>
        <AddArcherClient clans={clans} />
      </div>

      {/* Filter row */}
      <div className="flex gap-2">
        {['All', 'Archers', 'Coaches', 'Inactive'].map((tab, i) => (
          <div key={tab}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full border text-[13px] font-body font-semibold cursor-pointer ${
              i === 0 ? 'bg-opac-green text-white border-opac-green' : 'bg-white text-opac-ink-60 border-opac-border'
            }`}>
            {tab}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {users.map((user) => {
          const name = user.name ?? 'Unknown'
          const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
          const roles = (user.roles ?? []) as string[]

          return (
            <div key={String(user.id)} className="bg-white rounded-[14px] px-4 py-3.5 border border-opac-border flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${user.active ? 'bg-opac-green-light' : 'bg-opac-surface'}`}>
                <span className={`font-display text-[13px] ${user.active ? 'text-opac-green' : 'text-opac-ink-30'}`}>{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-[14px] font-semibold text-opac-ink">{name}</p>
                <p className="font-body text-[12px] text-opac-ink-60">{user.email}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex gap-1">
                  {roles.map((role) => (
                    <span key={role} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      role === 'admin' ? 'bg-[#FEE2E2] text-[#DC2626]' :
                      role === 'coach' ? 'bg-opac-gold-light text-opac-gold' :
                      'bg-opac-green-light text-opac-green'
                    }`}>{role}</span>
                  ))}
                </div>
                {!user.active && (
                  <span className="text-[10px] font-semibold text-opac-ink-30">Inactive</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
