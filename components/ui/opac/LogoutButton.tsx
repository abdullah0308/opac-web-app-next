'use client'

export function LogoutButton() {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full h-12 rounded-[12px] border border-red-200 bg-red-50 text-red-600 font-body text-[15px] font-semibold"
    >
      Log Out
    </button>
  )
}
