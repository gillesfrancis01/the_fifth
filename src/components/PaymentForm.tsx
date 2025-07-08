'use client'

import {
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js'
import { FormEvent, useState } from 'react'

export default function PaymentForm({
  clientSecret,
  fullName,
  email,
  phone,
  ticketId,
  eventId,
}: {
  clientSecret: string
  fullName: string
  email: string
  phone: string
  ticketId: string
  eventId: string
}) {

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
        return_url: `${window.location.origin}/success?name=${encodeURIComponent(fullName)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&ticketId=${encodeURIComponent(ticketId)}&eventId=${eventId}&paymentIntent=${clientSecret.split('_secret')[0]}`,
      },
    })

    if (error) {
      setErrorMessage(error.message || 'Une erreur est survenue.')
      console.error(error)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-4">
      <PaymentElement />
      {errorMessage && (
        <div className="text-red-500 text-sm font-medium">{errorMessage}</div>
      )}
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
