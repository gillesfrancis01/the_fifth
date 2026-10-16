'use client'

import { useRouter } from 'next/navigation'
import React, { FormEvent, createContext, useContext, useEffect, useState, useTransition } from 'react'

import { createEvent, uploadEventImage } from '@/app/actions/adminEvents'
import Modal from '@/components/ui/Modal'
import EventForm, { emptyForm, type FeedbackState } from '@/components/admin/EventForm'

interface CreateEventModalContextValue {
  openCreateModal: () => void
}

const CreateEventModalContext = createContext<CreateEventModalContextValue | null>(null)

export function useCreateEventModal() {
  const context = useContext(CreateEventModalContext)
  if (!context) {
    throw new Error('useCreateEventModal must be used within CreateEventModalProvider')
  }
  return context
}

export function CreateEventModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [formValues, setFormValues] = useState(() => ({ ...emptyForm }))
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [banner, setBanner] = useState<FeedbackState | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (!banner) {
      return
    }

    const timeout = window.setTimeout(() => setBanner(null), 4000)
    return () => window.clearTimeout(timeout)
  }, [banner])

  const openCreateModal = () => {
    setFormValues({ ...emptyForm })
    setSelectedFile(null)
    setFeedback(null)
    setIsModalOpen(true)
  }

  const closeCreateModal = () => {
    if (isPending) {
      return
    }
    setIsModalOpen(false)
  }

  const handleChange = (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = event.currentTarget as HTMLInputElement | HTMLTextAreaElement
    setFormValues((previous) => ({ ...previous, [target.name]: target.value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formValues.name || !formValues.date) {
      setFeedback({ type: 'error', message: 'Le nom et la date sont obligatoires.' })
      return
    }

    startTransition(async () => {
      let imageUrl = formValues.image

      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        const uploadResult = await uploadEventImage(formData)
        if (!uploadResult.success || !uploadResult.url) {
          setFeedback({ type: 'error', message: uploadResult.error ?? "Échec du téléversement de l'image." })
          return
        }
        imageUrl = uploadResult.url
      }

      const sectionsEn = formValues.descriptionEn
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
      const sectionsFr = formValues.descriptionFr
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)

      const result = await createEvent({
        name: formValues.name,
        description: formValues.descriptionEn,
        date: formValues.date,
        adresse: formValues.adresse,
        image: imageUrl,
        teaser: formValues.teaser,
        description_sections: sectionsEn,
        description_sections_en: sectionsEn,
        description_sections_fr: sectionsFr,
      })

      if (!result.success) {
        setFeedback({ type: 'error', message: result.error ?? 'Une erreur est survenue.' })
        return
      }

      setFormValues({ ...emptyForm })
      setSelectedFile(null)
      setFeedback(null)
      setIsModalOpen(false)
      setBanner({ type: 'success', message: 'Événement créé avec succès.' })
      router.refresh()
    })
  }

  return (
    <CreateEventModalContext.Provider value={{ openCreateModal }}>
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
        title="Nouvel événement signature"
        description="Déployez un nouveau rendez-vous : renseignez les informations clés avant de l’ouvrir aux invités."
      >
        <EventForm
          values={formValues}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={closeCreateModal}
          isPending={isPending}
          feedback={feedback}
          submitLabel="Créer l’événement"
          pendingLabel="Création..."
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
        />
      </Modal>
    </CreateEventModalContext.Provider>
  )
}
