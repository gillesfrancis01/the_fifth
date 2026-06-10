'use client'

import React, { useEffect, useState, useTransition } from 'react'
import Image from 'next/image'
import getAllEvents from '@/app/actions/getAllEvent'
import { createProviderApplication } from '@/app/actions/adminProviders'
import type { events as Event } from '@/types'
import FlatButton from '@/components/FlatButton'
import { PiUser, PiEnvelope, PiPhone, PiMusicNotes, PiGlobe, PiChatText, PiCalendar } from 'react-icons/pi'

export default function DevenirPrestatairePage() {
  const [events, setEvents] = useState<Event[]>([])
  const [isPending, startTransition] = useTransition()
  
  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [specialty, setSpecialty] = useState('DJ')
  const [portfolio, setPortfolio] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [message, setMessage] = useState('')
  
  // UI states
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    async function loadEvents() {
      const data = await getAllEvents()
      if (data) {
        // Filter events that are not in the past
        const now = new Date()
        const upcoming = data.filter(e => new Date(e.date).getTime() >= now.getTime())
        setEvents(upcoming)
        if (upcoming.length > 0) {
          setSelectedEventId(upcoming[0].$id)
        }
      }
    }
    loadEvents()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!agreed) {
      setFeedback({ type: 'error', message: "Veuillez accepter la politique de traitement des données." })
      return
    }

    if (!name || !email || !phone || !portfolio) {
      setFeedback({ type: 'error', message: "Veuillez remplir tous les champs obligatoires (*)." })
      return
    }

    startTransition(async () => {
      const result = await createProviderApplication({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        specialty,
        portfolio: portfolio.trim(),
        eventId: selectedEventId || null,
        message: message.trim() || null,
      })

      if (result.success) {
        setFeedback({ 
          type: 'success', 
          message: "Votre candidature a été envoyée avec succès ! Notre direction artistique l'examinera dans les plus brefs délais." 
        })
        // Reset form
        setName('')
        setEmail('')
        setPhone('')
        setPortfolio('')
        setMessage('')
        setAgreed(false)
      } else {
        setFeedback({ type: 'error', message: result.error || "Une erreur est survenue." })
      }
    })
  }

  return (
    <div className="relative min-h-screen py-16 text-white overflow-hidden">
      {/* Background gradients mirroring the premium nocturnal brand style */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(201,161,77,0.08),transparent_50%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(68,54,24,0.12),transparent_50%)]" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-main text-center text-xl font-Josefin uppercase tracking-[0.2em]">Programmation</h2>
          <Image src="/arrows.svg" className="m-auto opacity-80" width={220} height={60} alt="arrows" />
          <h3 className="uppercase text-3xl md:text-4xl font-Josefin text-main font-bold tracking-widest mt-2">
            Devenir Prestataire
          </h3>
          <p className="mt-4 text-sm text-white/60 max-w-xl mx-auto leading-relaxed">
            DJ, artiste live, performeur ou créateur visuel : intégrez la direction artistique de nos événements after-dark d’exception.
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-3xl border border-white/10 bg-[linear-gradient(160deg,rgba(15,15,15,0.9),rgba(5,5,5,0.85))] p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          {feedback && feedback.type === 'success' ? (
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-3xl">
                ✓
              </div>
              <h4 className="text-2xl font-bold text-white">Merci pour votre intérêt !</h4>
              <p className="text-sm text-white/70 max-w-md mx-auto leading-relaxed">
                {feedback.message}
              </p>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="mt-6 inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-2.5 text-xs uppercase tracking-widest text-white hover:border-[rgba(201,161,77,0.55)] transition"
              >
                Soumettre une autre candidature
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Name */}
                <label className="flex flex-col gap-2">
                  <span className="text-[11px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-1.5">
                    <PiUser className="h-4 w-4 text-main" />
                    Nom ou Nom de Scène *
                  </span>
                  <input
                    type="text"
                    placeholder="Ex: DJ Golden / Stephane Sam"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border-b border-white/20 bg-transparent py-3 text-sm text-white outline-none transition focus:border-main placeholder:text-white/20"
                    required
                  />
                </label>

                {/* Email */}
                <label className="flex flex-col gap-2">
                  <span className="text-[11px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-1.5">
                    <PiEnvelope className="h-4 w-4 text-main" />
                    Adresse E-mail *
                  </span>
                  <input
                    type="email"
                    placeholder="Ex: artiste@thefifth.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-b border-white/20 bg-transparent py-3 text-sm text-white outline-none transition focus:border-main placeholder:text-white/20"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {/* Phone */}
                <label className="flex flex-col gap-2">
                  <span className="text-[11px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-1.5">
                    <PiPhone className="h-4 w-4 text-main" />
                    Numéro de Téléphone *
                  </span>
                  <input
                    type="tel"
                    placeholder="Ex: +1 (514) 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border-b border-white/20 bg-transparent py-3 text-sm text-white outline-none transition focus:border-main placeholder:text-white/20"
                    required
                  />
                </label>

                {/* Specialty */}
                <label className="flex flex-col gap-2">
                  <span className="text-[11px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-1.5">
                    <PiMusicNotes className="h-4 w-4 text-main" />
                    Spécialité Artistique *
                  </span>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full border-b border-white/20 bg-transparent py-3 text-sm text-white outline-none transition focus:border-main bg-neutral-950"
                  >
                    <option value="DJ">DJ (Deep House, Tech, Afro...)</option>
                    <option value="Artiste Live">Artiste Live (Chanteur, Musicien...)</option>
                    <option value="Performeur">Performeur / Danseur</option>
                    <option value="Photographe / Vidéaste">Photographe / Vidéaste</option>
                    <option value="Hôte / Hôtesse">Hôte / Hôtesse VIP</option>
                    <option value="Autre">Autre spécialité</option>
                  </select>
                </label>
              </div>

              {/* Portfolio Link */}
              <label className="flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-1.5">
                  <PiGlobe className="h-4 w-4 text-main" />
                  Lien Portfolio / Instagram / Soundcloud *
                </span>
                <input
                  type="url"
                  placeholder="Ex: https://instagram.com/mon_profil_artiste"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  className="w-full border-b border-white/20 bg-transparent py-3 text-sm text-white outline-none transition focus:border-main placeholder:text-white/20"
                  required
                />
              </label>

              {/* Target Event */}
              {events.length > 0 && (
                <label className="flex flex-col gap-2">
                  <span className="text-[11px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-1.5">
                    <PiCalendar className="h-4 w-4 text-main" />
                    Événement Visé
                  </span>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full border-b border-white/20 bg-transparent py-3 text-sm text-white outline-none transition focus:border-main bg-neutral-950"
                  >
                    {events.map((evt) => (
                      <option key={evt.$id} value={evt.$id}>
                        {evt.name} ({new Date(evt.date).toLocaleDateString('fr-FR')})
                      </option>
                    ))}
                    <option value="">Candidature spontanée (Aucun événement particulier)</option>
                  </select>
                </label>
              )}

              {/* Message */}
              <label className="flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-1.5">
                  <PiChatText className="h-4 w-4 text-main" />
                  Présentation & Besoins Techniques (Optionnel)
                </span>
                <textarea
                  placeholder="Présentez brièvement votre parcours, votre univers nocturne, ou vos spécifications techniques..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full border border-white/10 rounded-xl bg-black/40 p-4 text-sm text-white outline-none transition focus:border-main placeholder:text-white/20 resize-none"
                />
              </label>

              {/* Data Agreement */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="agreement"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 accent-main h-4 w-4 rounded border-white/10"
                />
                <label htmlFor="agreement" className="text-xs text-white/60 leading-relaxed cursor-pointer select-none">
                  J'accepte que les données soumises soient collectées et stockées par la direction de l'établissement dans le but d'analyser ma candidature artistique.
                </label>
              </div>

              {feedback && feedback.type === 'error' && (
                <p className="text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                  {feedback.message}
                </p>
              )}

              {/* Submit Button */}
              <div className="pt-4 flex justify-center">
                <FlatButton 
                  type="submit" 
                  disabled={isPending}
                  className="w-full sm:w-auto px-10"
                >
                  {isPending ? "Envoi..." : "Envoyer ma Candidature"}
                </FlatButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
