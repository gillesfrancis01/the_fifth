'use client'

import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ScannerLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/scanner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: 'Erreur inconnue.' }))
        setError(payload?.message ?? 'Identifiants incorrects.')
        setIsSubmitting(false)
        return
      }

      const redirectTo = searchParams.get('redirect')
      const destination = redirectTo && redirectTo.startsWith('/check-in') ? redirectTo : '/scan'

      router.push(destination)
      router.refresh()
    } catch (error) {
      console.error(error)
      setError('Impossible de se connecter. Veuillez réessayer.')
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-6 rounded-lg border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl"
    >
      <div>
        <h1 className="text-3xl font-semibold text-main">Connexion scanner</h1>
        <p className="mt-2 text-sm text-zinc-300">
          Entrez vos identifiants pour valider les billets à l&apos;entrée.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium text-zinc-200">
          Identifiant
        </label>
        <input
          id="username"
          name="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full rounded-md border border-zinc-700 bg-black px-4 py-2 text-sm outline-none transition focus:border-[#E6C55D]"
          autoComplete="username"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-zinc-200">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border border-zinc-700 bg-black px-4 py-2 text-sm outline-none transition focus:border-[#E6C55D]"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-main px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  )
}
