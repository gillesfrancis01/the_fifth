'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { FaCheckCircle, FaSpinner } from 'react-icons/fa'
import Link from 'next/link'
import { processReservation } from '@/app/actions/processReservation'

export default function SuccessClient() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  // Utiliser useRef pour s'assurer que l'appel n'est fait qu'une seule fois (React StrictMode)
  const isProcessed = useRef(false)

  useEffect(() => {
    async function handleSuccess() {
      if (isProcessed.current) return
      isProcessed.current = true

      const name = searchParams.get('name')
      const email = searchParams.get('email')
      const phone = searchParams.get('phone')
      const eventId = searchParams.get('eventId')
      const ticketId = searchParams.get('ticketId')
      const quantity = searchParams.get('quantity')
      const paymentIntent = searchParams.get('paymentIntent')

      if (!name || !email || !eventId || !ticketId || !paymentIntent) {
        setError('Informations de réservation manquantes. Veuillez contacter le support.')
        setLoading(false)
        return
      }

      setLoading(true)

      const result = await processReservation({
        fullName: decodeURIComponent(name),
        email: decodeURIComponent(email),
        phone: decodeURIComponent(phone || ''),
        eventId,
        ticketId,
        paymentIntent,
        quantity: Number(quantity) || 1,
      })

      if (!result.success) {
        setError(result.error || "Erreur lors de la création de la réservation.")
      }
      
      setLoading(false)
    }

    handleSuccess()
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center space-y-4">
        <FaSpinner className="text-yellow-400 text-4xl animate-spin" />
        <p className="text-white text-lg">Génération de vos billets en cours...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-white mb-2">Un problème est survenu</h1>
        <p className="text-gray-400 mb-8 max-w-md">{error}</p>
        <Link
          href="/"
          className="bg-yellow-400 text-black font-bold px-6 py-3 rounded-lg hover:bg-yellow-300 transition"
        >
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center px-6 text-center">
      <FaCheckCircle className="text-yellow-400 text-6xl mb-6 animate-pulse" />
      <h1 className="text-3xl font-bold text-yellow-400 mb-4">
        Paiement et réservation confirmés !
      </h1>
      <p className="text-lg max-w-md text-gray-300 mb-2">
        Vos billets ont été générés avec succès.
      </p>
      <p className="text-sm max-w-md text-gray-400 mb-8">
        Vérifiez votre boîte de réception (et vos indésirables). Vous venez de recevoir un courriel contenant votre billet en pièce jointe PDF.
      </p>

      <Link
        href="/"
        className="inline-block bg-yellow-400 text-black font-bold px-8 py-3 rounded-lg hover:bg-yellow-300 transition shadow-[0_0_15px_rgba(250,204,21,0.3)]"
      >
        Retour à l'accueil
      </Link>
    </div>
  )
}
