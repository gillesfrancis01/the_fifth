'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, description, children }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/12 bg-[linear-gradient(160deg,rgba(10,10,10,0.95),rgba(2,2,2,0.85))] shadow-[0_80px_120px_-60px_rgba(0,0,0,0.9)]"
      >
        {(title || description) && (
          <header className="flex items-start justify-between gap-6 border-b border-white/10 p-6">
            <div className="space-y-2">
              {title && <h2 className="font-heading text-2xl text-white">{title}</h2>}
              {description && <p className="text-sm text-white/60">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-xl text-white/70 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white"
              aria-label="Fermer la boîte modale"
            >
              ×
            </button>
          </header>
        )}
        <div className="max-h-[75vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}

