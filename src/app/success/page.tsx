'use client'

import Link from 'next/link'
import { FaCheckCircle } from 'react-icons/fa'

export default function Success() {
  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center px-6">
      <FaCheckCircle className="text-yellow-400 text-6xl mb-6 animate-pulse" />
      <h1 className="text-3xl font-bold text-main mb-4 text-center">
        Paiement confirmé !
      </h1>
      <p className="text-center text-lg max-w-md text-gray-300">
        Merci pour votre achat. Vous recevrez une confirmation par courriel sous peu.
      </p>

      <Link
        href="/"
        className="mt-8 inline-block bg-main text-black font-bold px-6 py-3 rounded-lg hover:bg-yellow-300 transition"
      >
        Retour à l accueil
      </Link>
    </div>
  )
}
