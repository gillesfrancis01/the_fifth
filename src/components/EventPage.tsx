'use client'

import React, { useEffect, useRef, useState } from 'react'
import { FaLongArrowAltRight } from 'react-icons/fa'
import { GrStatusGood } from 'react-icons/gr'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { events, Ticket } from '@/types'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import PaymentForm from './PaymentForm'

gsap.registerPlugin(ScrollTrigger)

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface EventPageProps {
  event: events
  tickets: Ticket[]
}

const EventPage = ({ event, tickets }: EventPageProps) => {
  const imageRef = useRef<HTMLImageElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const descRef = useRef<HTMLParagraphElement>(null)
  const ticketsRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const shineRef = useRef<HTMLDivElement>(null)

  const [showForm, setShowForm] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [clientSecret, setClientSecret] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const handleGetTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setShowModal(true)
  }

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(imageRef.current, {
        y: -100,
        ease: 'none',
        scrollTrigger: {
          trigger: imageRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })

      gsap.fromTo(
        [titleRef.current, descRef.current],
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          stagger: 0.3,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 85%',
          },
        }
      )

      gsap.to(shineRef.current, {
        xPercent: 100,
        duration: 2,
        ease: 'power1.inOut',
        repeat: -1,
        yoyo: true,
      })

      gsap.fromTo(
        ticketsRef.current?.children,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: ticketsRef.current,
            start: 'top 90%',
          },
        }
      )

      gsap.fromTo(
        mapRef.current,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 1.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: mapRef.current,
            start: 'top 90%',
          },
        }
      )
    })

    return () => ctx.revert()
  }, [])

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!selectedTicket) return

  const res = await fetch('/actions/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email,
      phone,
      ticket: selectedTicket,
    }),
  })

  const data = await res.json()

  if (data.clientSecret) {
    setClientSecret(data.clientSecret)
  } else {
    alert('Erreur lors de la création du paiement.')
  }
}


  return (
    <div>
      <div className="relative overflow-hidden">
        <img
          ref={imageRef}
          src={event.image}
          className="m-auto mt-10 w-[90vw] h-[500px] max-md:rounded-xl object-cover rounded-lg shadow-lg"
          alt="event"
        />
      </div>

      <h1
        ref={titleRef}
        className="text-3xl text-center uppercase font-extrabold text-main mt-5 font-Josefin lg:text-left lg:w-[90vw] lg:m-auto lg:my-10 relative overflow-hidden"
      >
        {event.name}
        <div
          ref={shineRef}
          className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
          style={{ transform: 'translateX(-100%)', mixBlendMode: 'screen' }}
        />
      </h1>

      <p
        ref={descRef}
        className="text-center my-10 lg:w-[90vw] lg:m-auto lg:text-left"
      >
        {event.description}
      </p>

      <h2 className="text-main text-center text-2xl font-Josefin">Tickets</h2>
      <Image src="/arrows.svg" className="m-auto" width={300} height={100} alt="arrows" />
      <h3 className="uppercase text-2xl font-Josefin text-main font-bold text-center">
        Get your Ticket now
      </h3>

      <div ref={ticketsRef} className="lg:flex justify-center gap-10 flex-wrap mt-8">
        {tickets.map((item) => (
          <div
            key={item.$id}
            className="flex flex-col w-[70vw] max-w-[300px] border-2 border-main p-8 mt-10 rounded-lg shadow-md transition-transform hover:scale-105 hover:shadow-xl cursor-pointer"
          >
            <h3 className="text-3xl uppercase font-extrabold text-main font-Josefin">
              {item.name}
            </h3>
            <ul>
              {item.advantages.map((ad) => (
                <li
                  key={ad}
                  className="flex gap-3 items-center mt-5 font-extralight"
                >
                  <GrStatusGood className="text-yellow-400" />
                  {ad}
                </li>
              ))}
            </ul>
            <div className="flex mt-10 gap-4 items-center justify-between">
              <h3 className="font-extrabold text-2xl">${item.price}</h3>
              {item.available ? (
                <button
                  className="flex gap-1 items-center border-main border p-2 text-main rounded-md shadow-md transition-transform hover:scale-110 hover:rotate-1 hover:shadow-yellow-400/50"
                  onClick={() => handleGetTicket(item)}
                >
                  Get Ticket <FaLongArrowAltRight className="text-yellow-400" />
                </button>
              ) : (
                <p className="text-red-500 font-semibold">Not Available</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div
        ref={mapRef}
        className="mt-10 w-full h-[200px] rounded-xl overflow-hidden shadow-lg"
      >
        <iframe
          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBmOnXwk6UJGZrviERljANNWizRXjccyM8&q=${encodeURIComponent(
            event.adresse
          )}`}
          width="100%"
          height="100%"
          loading="lazy"
          allowFullScreen
          className="rounded-xl"
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-scroll">
          <div className="bg-[#171717] p-8 rounded-lg w-[90vw] max-w-md relative shadow-xl">
            <button
              className="absolute top-2 right-2 text-red-500 font-bold"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-main mb-4">
              Ticket for: {selectedTicket?.name}
            </h2>
            {!clientSecret ? (
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder="Nom Complet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border p-2 rounded-md"
                />
                <input
                  type="email"
                  placeholder="Courriel"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border p-2 rounded-md"
                />
                <input
                  type="tel"
                  placeholder="Numéro de Téléphone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border p-2 rounded-md"
                />
                <button
                  type="submit"
                  className="bg-main text-white py-2 px-4 rounded-md hover:bg-opacity-80"
                >
                  Confirmer l'achat
                </button>
              </form>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret,appearance: {
                theme: 'night',
                variables: {
                  colorPrimary: '#FFD700',
                  colorBackground: '#171717',
                  colorText: '#ffffff',
                  colorDanger: '#ff4d4f',
                  spacingUnit: '4px',
                  borderRadius: '8px',
                },
              }, }}>
                <PaymentForm />
              </Elements>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default EventPage