'use client'

import { useRouter } from 'next/navigation'
import React, { FormEvent, createContext, useContext, useEffect, useState, useTransition } from 'react'

import { createTicket } from '@/app/actions/adminTickets'
import Modal from '@/components/ui/Modal'
import TicketForm, { initialTicketForm, parseLines, type FeedbackState } from '@/components/admin/TicketForm'
import type { events } from '@/types'

interface CreateTicketModalContextValue {
  openCreateModal: (eventId?: string) => void
}

const CreateTicketModalContext = createContext<CreateTicketModalContextValue | null>(null)

export function useCreateTicketModal() {
  const context = useContext(CreateTicketModalContext)
  if (!context) {
    throw new Error('useCreateTicketModal must be used within CreateTicketModalProvider')
  }
  return context
}

export function CreateTicketModalProvider({ events, children }: { events: events[]; children: React.ReactNode }) {
  const router = useRouter()
  const [formValues, setFormValues] = useState(() => ({ ...initialTicketForm }))
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [banner, setBanner] = useState<FeedbackState | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!banner) {
      return
    }

    const timeout = window.setTimeout(() => setBanner(null), 4000)
    return () => window.clearTimeout(timeout)
  }, [banner])

  const openCreateModal = (eventId = '') => {
    setFormValues({ ...initialTicketForm, eventId })
    setFeedback(null)
    setIsModalOpen(true)
  }

  const closeCreateModal = () => {
    if (isPending) {
      return
    }
    setIsModalOpen(false)
  }

  const handleChange = (
    event: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = event.currentTarget as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value

    setFormValues((previous) => ({
      ...previous,
      [target.name]: value,
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formValues.eventId || !formValues.name || !formValues.price || !formValues.quantity) {
      setFeedback({ type: 'error', message: "L'événement, le nom, le prix et la quantité sont obligatoires." })
      return
    }

    const price = Number(formValues.price)
    const quantity = Number(formValues.quantity)

    if (Number.isNaN(price) || Number.isNaN(quantity)) {
      setFeedback({ type: 'error', message: 'Le prix et la quantité doivent être des nombres.' })
      return
    }

    if (quantity < 0) {
      setFeedback({ type: 'error', message: 'La quantité doit être positive.' })
      return
    }

    const advantages = parseLines(formValues.advantages)

    startTransition(async () => {
      const result = await createTicket({
        event: formValues.eventId,
        name: formValues.name,
        price,
        quantity,
        available: Boolean(formValues.available),
        advantages,
      })

      if (!result.success) {
        setFeedback({ type: 'error', message: result.error ?? 'Impossible de créer le ticket.' })
        return
      }

      setFormValues({ ...initialTicketForm })
      setFeedback(null)
      setIsModalOpen(false)
      setBanner({ type: 'success', message: 'Ticket créé avec succès.' })
      router.refresh()
    })
  }

  return (
    <CreateTicketModalContext.Provider value={{ openCreateModal }}>
      {children}

      {banner && (
        <div className="fixed right-6 top-6 z-[100] max-w-sm">
          <p
            className={`rounded-2xl border px-4 py-3 text-sm shadow-lg ${
              banner.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                : 'border-red-500/40 bg-red-500/10 text-red-200'
            }`}
          >
            {banner.message}
          </p>
        </div>
      )}

      <Modal
        open={isModalOpen}
        onClose={closeCreateModal}
        title="Nouveau ticket premium"
        description="Paramétrez la gamme, le tarif et les avantages pour enrichir l’expérience client."
      >
        <TicketForm
          events={events}
          values={formValues}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={closeCreateModal}
          isPending={isPending}
          feedback={feedback}
          submitLabel="Créer le ticket"
          pendingLabel="Création..."
        />
      </Modal>
    </CreateTicketModalContext.Provider>
  )
}
