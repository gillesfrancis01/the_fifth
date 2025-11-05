'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    if (isLoading) {
      return
    }

    setIsLoading(true)

    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('Impossible de se déconnecter', error)
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-white/70 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white focus:outline-none focus:ring-2 focus:ring-[rgba(201,161,77,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? 'Déconnexion…' : 'Déconnexion'}
    </button>
  )
}
