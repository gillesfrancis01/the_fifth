'use client'

import { FormEvent, useEffect, useRef, useState, useTransition } from 'react'
import { FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaPaperPlane } from 'react-icons/fa'
import { createContactMessage } from '@/app/actions/contact'
import { useLanguage } from '@/context/LanguageContext'

export default function ContactCard() {
  const { t } = useLanguage()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Anti-spam: a hidden field a human never fills, and the time the form was rendered.
  const [website, setWebsite] = useState('')
  const formRenderedAtRef = useRef(0)
  useEffect(() => {
    formRenderedAtRef.current = Date.now()
  }, [])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!agreed) {
      setFeedback({ type: 'error', message: t('contactAgreementRequired') })
      return
    }

    if (!name.trim() || !email.trim() || !message.trim()) {
      setFeedback({ type: 'error', message: t('contactRequiredFields') })
      return
    }

    startTransition(async () => {
      const result = await createContactMessage({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        honeypot: website,
        formRenderedAt: formRenderedAtRef.current,
      })

      if (result.success) {
        setFeedback({ type: 'success', message: t('contactSuccessMessage') })
        setName('')
        setEmail('')
        setMessage('')
        setAgreed(false)
      } else {
        setFeedback({ type: 'error', message: result.error || t('contactErrorMessage') })
      }
    })
  }

  return (
    <div className="max-w-md w-full self-start p-6 rounded-2xl bg-main text-black shadow-xl space-y-6">
      <h2 className="text-2xl font-semibold">{t('contact')}</h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot: hidden from real visitors, but bots that fill every field will trip it */}
        <label className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
          Site web
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>

        <input
          type="text"
          placeholder={t('namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full bg-transparent border-b border-black outline-none placeholder-black/70 py-2"
        />
        <input
          type="email"
          placeholder={t('emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-transparent border-b border-black outline-none placeholder-black/70 py-2"
        />
        <textarea
          placeholder={t('messagePlaceholder')}
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          className="w-full bg-transparent border-b border-black outline-none placeholder-black/70 py-2"
        ></textarea>

        <label className="flex items-start gap-2 text-xs cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-black"
          />
          <span>{t('dataAgreement')}</span>
        </label>

        {feedback && (
          <p
            role="status"
            className={`rounded-lg px-3 py-2 text-sm ${
              feedback.type === 'success' ? 'bg-black/80 text-emerald-300' : 'bg-black/80 text-red-300'
            }`}
          >
            {feedback.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded shadow transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FaPaperPlane />
          {isPending ? t('sending') : t('send')}
        </button>
      </form>

      {/* Contact Info */}
      <div className="pt-6 border-t border-black space-y-4">
        <h3 className="text-lg font-medium">{t('contactDetails')}</h3>

        <div className="flex items-start gap-3">
          <FaMapMarkerAlt className="mt-1" />
          <p>
            Montreal QC-<br />
            738 Rue St-Paul O<br />
            H3C 0N5
          </p>
        </div>

        <a href="mailto:info@thefifthevent.com" className="flex items-center gap-3 hover:underline">
          <FaEnvelope />
          info@thefifthevent.com
        </a>

        <a href="tel:+15145192002" className="flex items-center gap-3 hover:underline">
          <FaPhoneAlt />
          +1 (514) 519 2002
        </a>
      </div>
    </div>
  )
}
