'use client'

import {
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js'
import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

export default function PaymentForm({
  clientSecret,
  fullName,
  email,
  phone,
  quantity,
  ticketId,
  eventId,
  newsletterConsent = false,
}: {
  clientSecret: string
  fullName: string
  email: string
  phone: string
  quantity: number
  ticketId: string
  eventId: string
  newsletterConsent?: boolean
}) {

  const { t } = useLanguage()
  const stripe = useStripe()
  const elements = useElements()

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setLoading(true)
    setErrorMessage('')

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success?name=${encodeURIComponent(fullName)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&ticketId=${encodeURIComponent(ticketId)}&eventId=${eventId}&quantity=${quantity}&paymentIntent=${clientSecret.split('_secret')[0]}${newsletterConsent ? '&newsletter=1' : ''}`,
      },
    })

    if (error) {
      setErrorMessage(error.message || 'Une erreur est survenue.')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-4">
      <PaymentElement />
      {errorMessage && (
        <div className="text-red-500 text-sm font-medium">{errorMessage}</div>
      )}
      <p className="text-center text-xs text-gray-400">
        {t('checkoutPolicyNotice')}{' '}
        <Link href="/refund-policy" target="_blank" className="underline hover:text-white">
          {t('refundPolicy')}
        </Link>
      </p>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="bg-main text-white py-2 px-4 rounded-md hover:bg-opacity-80 transition disabled:opacity-50"
      >
        {loading ? 'Paiement en cours...' : 'Payer maintenant'}
      </button>
    </form>
  )
}
