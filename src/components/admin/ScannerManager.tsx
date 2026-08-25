'use client'

import { FormEvent, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PiEye, PiEyeSlash } from 'react-icons/pi'

import Modal from '@/components/ui/Modal'
import type { events, ScannerSummary } from '@/types'
import { createScanner, deleteScanner, toggleScannerActive } from '@/app/actions/adminScanners'

interface ScannerManagerProps {
  events: events[]
  scanners: ScannerSummary[]
}

interface FeedbackState {
  type: 'success' | 'error'
  message: string
}

const initialForm = { name: '', username: '', password: '', eventId: '' }

export default function ScannerManager({ events, scanners }: ScannerManagerProps) {
  const router = useRouter()
  const [formValues, setFormValues] = useState(() => ({ ...initialForm }))
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [banner, setBanner] = useState<FeedbackState | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!banner) {
      return
    }
    const timeout = window.setTimeout(() => setBanner(null), 4000)
    return () => window.clearTimeout(timeout)
  }, [banner])

  const openCreateModal = () => {
    setFormValues({ ...initialForm })
    setFeedback(null)
    setIsPasswordVisible(false)
    setIsModalOpen(true)
  }

  const closeCreateModal = () => {
    if (isPending) {
      return
    }
    setIsModalOpen(false)
  }

  const handleChange = (event: FormEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.currentTarget
    setFormValues((previous) => ({ ...previous, [target.name]: target.value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formValues.name || !formValues.username || !formValues.password || !formValues.eventId) {
      setFeedback({ type: 'error', message: 'Tous les champs sont obligatoires.' })
      return
    }

    startTransition(async () => {
      const result = await createScanner(formValues)

      if (!result.success) {
        setFeedback({ type: 'error', message: result.error ?? 'Impossible de créer le compte scanner.' })
        return
      }

      setFormValues({ ...initialForm })
      setFeedback(null)
      setIsModalOpen(false)
      setBanner({ type: 'success', message: 'Compte scanner créé.' })
      router.refresh()
    })
  }

  const handleToggle = (scanner: ScannerSummary) => {
    startTransition(async () => {
      const result = await toggleScannerActive(scanner.$id, !scanner.active)

      if (!result.success) {
        setBanner({ type: 'error', message: result.error ?? 'Impossible de mettre à jour le compte.' })
        return
      }

      setBanner({ type: 'success', message: scanner.active ? 'Compte désactivé.' : 'Compte réactivé.' })
      router.refresh()
    })
  }

  const handleDelete = (scannerId: string) => {
    if (!window.confirm('Voulez-vous supprimer ce compte scanner ?')) {
      return
    }

    startTransition(async () => {
      const result = await deleteScanner(scannerId)

      if (!result.success) {
        setBanner({ type: 'error', message: result.error ?? 'Suppression impossible.' })
        return
      }

      setBanner({ type: 'success', message: 'Compte scanner supprimé.' })
      router.refresh()
    })
  }

  const eventNameById = new Map(events.map((event) => [event.$id, event.name]))

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-black/40 p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.45em] text-white/55">Sécurité</p>
          <h2 className="font-heading text-2xl text-white">Comptes scanner</h2>
          <p className="text-sm text-white/60">Créez des accès dédiés à la validation des billets à l&apos;entrée.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-full border border-white/20 bg-black/40 px-6 py-2.5 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white"
        >
          Ajouter un compte scanner
        </button>
      </header>

      {banner && (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm ${
            banner.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/40 bg-red-500/10 text-red-200'
          }`}
        >
          {banner.message}
        </p>
      )}

      <Modal
        open={isModalOpen}
        onClose={closeCreateModal}
        title="Nouveau compte scanner"
        description="Ce compte ne pourra valider que les billets de l'événement sélectionné."
      >
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Nom</span>
              <input
                name="name"
                value={formValues.name}
                onChange={handleChange}
                required
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Identifiant</span>
              <input
                name="username"
                value={formValues.username}
                onChange={handleChange}
                required
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Mot de passe</span>
              <div className="relative">
                <input
                  name="password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={formValues.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 pr-10 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((previous) => !previous)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-white/50 transition hover:text-white"
                  aria-label={isPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  title={isPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {isPasswordVisible ? <PiEyeSlash className="h-4 w-4" /> : <PiEye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Événement</span>
              <select
                name="eventId"
                value={formValues.eventId}
                onChange={handleChange as (event: FormEvent<HTMLSelectElement>) => void}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
                required
              >
                <option value="">Sélectionnez un événement</option>
                {events.map((event) => (
                  <option key={event.$id} value={event.$id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {feedback && (
              <p className={`text-sm ${feedback.type === 'success' ? 'text-emerald-300' : 'text-red-400'}`}>{feedback.message}</p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={closeCreateModal}
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-white/60 transition hover:border-white/25 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black/40 px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? 'Création...' : 'Créer le compte'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.3em] text-white/50">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Identifiant</th>
              <th className="px-4 py-3">Événement</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {scanners.map((scanner) => (
              <tr key={scanner.$id}>
                <td className="px-4 py-3 text-white">{scanner.name}</td>
                <td className="px-4 py-3 text-white/70">{scanner.username}</td>
                <td className="px-4 py-3 text-white/70">{eventNameById.get(scanner.eventId) ?? scanner.eventId}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold uppercase ${scanner.active ? 'text-emerald-400' : 'text-white/40'}`}>
                    {scanner.active ? 'Actif' : 'Désactivé'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(scanner)}
                      disabled={isPending}
                      className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] uppercase tracking-[0.3em] text-white/75 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {scanner.active ? 'Désactiver' : 'Réactiver'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(scanner.$id)}
                      disabled={isPending}
                      className="rounded-full border border-red-500/60 px-3 py-1.5 text-[11px] uppercase tracking-[0.3em] text-red-300 transition hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {scanners.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-white/55">
                  Aucun compte scanner pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
