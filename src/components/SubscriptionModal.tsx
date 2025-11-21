'use client'

import addCustomer from '@/app/actions/addCustomer'
import { useActionState, useEffect, useRef, useState } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function SubscriptionModal() {
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [state, formAction] = useActionState(addCustomer, {})
  const modalRef = useRef<HTMLDivElement>(null)

  // Affichage après délai (newsletter classique)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const DELAY = 5000 // 5 sec pour test
    const modalAlreadyShown = localStorage.getItem('newsletterModalShown')

    if (modalAlreadyShown) return

    const scheduledAt = localStorage.getItem('newsletterModalScheduledAt')
    const now = Date.now()
    const parsedScheduledTime = scheduledAt ? parseInt(scheduledAt, 10) : NaN
    const scheduledTime = Number.isNaN(parsedScheduledTime) ? now : parsedScheduledTime
    const remainingDelay = Math.max(DELAY - (now - scheduledTime), 0)

    if (!scheduledAt) {
      localStorage.setItem('newsletterModalScheduledAt', now.toString())
    }

    const timer = setTimeout(() => {
      setIsFirstVisit(true)
      localStorage.setItem('newsletterModalShown', 'true')
    }, remainingDelay)

    return () => clearTimeout(timer)
  }, [])

  // Gestion states success/error
  useEffect(() => {
    if (state?.error) toast.error(state.error)
    if (state?.success) {
      toast.success('Inscription réussie')
      setIsSubmitted(true)
      setTimeout(() => setIsFirstVisit(false), 2000)
    }
  }, [state])

  // Fermeture en cliquant dehors
  const handleClickOutside = (e: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setIsFirstVisit(false)
    }
  }

  useEffect(() => {
    if (isFirstVisit) {
      window.addEventListener('mousedown', handleClickOutside)
      return () => window.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isFirstVisit])

  if (!isFirstVisit) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="bg-[#171717] text-white p-8 rounded-2xl shadow-2xl max-w-md w-full transform animate-scaleFade"
      >
        {!isSubmitted ? (
          <form action={formAction} className="flex flex-col space-y-5">
            <h2 className="text-2xl font-semibold leading-tight text-center">
              Unlock exclusive access  
              <br />
              <span className="text-gray-300 text-base">
                Accédez aux privilèges exclusifs
              </span>
            </h2>

            <input
              type="email"
              required
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre adresse email"
              className="border border-gray-600 bg-transparent text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            />

            <button
              type="submit"
              className="bg-main text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              S&#39;inscrire
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-green-400 font-semibold">Merci pour votre inscription !</p>
          </div>
        )}

        <ToastContainer position="bottom-right" />
      </div>
    </div>
  )
}
