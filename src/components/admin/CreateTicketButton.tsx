'use client'

import { useCreateTicketModal } from '@/context/CreateTicketModalContext'

const defaultClassName =
  "inline-flex items-center justify-center rounded-full border border-white/20 bg-black/40 px-6 py-2.5 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white"

export default function CreateTicketButton({ className }: { className?: string }) {
  const { openCreateModal } = useCreateTicketModal()

  return (
    <button type="button" onClick={() => openCreateModal()} className={className ?? defaultClassName}>
      Ajouter un ticket
    </button>
  )
}
