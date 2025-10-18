'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FaCheckCircle } from 'react-icons/fa'
import Link from 'next/link'
import { upsertAppwriteCustomer } from '@/app/actions/upsertAppwriteCustomer'


export default function SuccessClient() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const fullName = searchParams.get('name')
    const email = searchParams.get('email')
    const phone = searchParams.get('phone')
    const ticketId = searchParams.get('ticketId')
    const eventId = searchParams.get('eventId')
    const paymentIntent = searchParams.get('paymentIntent')

    if (!fullName || !email || !phone || !ticketId || !eventId || !paymentIntent) {
      setError('Données client ou ticket incomplètes.')
      setLoading(false)
      return
    }

    const runUpsert = async () => {
      try {
        await upsertAppwriteCustomer({
          fullName,
          email,
          phone,
          ticketId,
          paymentIntent,
          eventId
        })
      } catch (err) {
        console.error('Appwrite error:', err)
        setError("Erreur lors de l'enregistrement du client ou de l'envoi du courriel.")
      } finally {
        setLoading(false)
      }
    }

    runUpsert()
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Chargement...</div>
  }

  if (error) {
    return <div className="min-h-screen bg-black text-red-500 flex items-center justify-center">{error}</div>
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center px-6">
      <FaCheckCircle className="text-yellow-400 text-6xl mb-6 animate-pulse" />
      <h1 className="text-3xl font-bold text-yellow-400 mb-4 text-center">
        Paiement confirmé !
      </h1>
      <p className="text-center text-lg max-w-md text-gray-300">
        Merci pour votre achat. Vous recevrez une confirmation par courriel sous peu.
      </p>

      <Link
        href="/"
        className="mt-8 inline-block bg-yellow-400 text-black font-bold px-6 py-3 rounded-lg hover:bg-yellow-300 transition"
      >
        Retour à l’accueil
      </Link>
    </div>
  )
}
