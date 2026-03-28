'use client'

import { useEffect } from 'react'
import { useRole, type UserRole } from '@/contexts/RoleContext'

/**
 * Fetches the current user's roles from /api/me on mount
 * and syncs them into RoleContext.
 */
export function RoleSync() {
  const { setAvailableRoles } = useRole()

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.roles) && d.roles.length > 0) {
          setAvailableRoles(d.roles as UserRole[])
        }
      })
      .catch(() => {})
  }, [setAvailableRoles])

  return null
}
