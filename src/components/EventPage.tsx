'use client'

import React, { useEffect, useRef, useState } from 'react'
import { FaLongArrowAltRight } from 'react-icons/fa'
import { GrStatusGood } from 'react-icons/gr'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { events, TicketWithAvailability } from '@/types'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import PaymentForm from './PaymentForm'

import { verifyPromoCode } from '@/app/actions/promo'
import { PromoCode } from '@/types'
import { useLanguage } from '@/context/LanguageContext'

gsap.registerPlugin(ScrollTrigger)

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const PROVINCES = [
  { code: 'QC', name: 'Québec (14.975%)', rate: 0.14975 },
  { code: 'ON', name: 'Ontario (13%)', rate: 0.13 },
  { code: 'BC', name: 'Colombie-Britannique (12%)', rate: 0.12 },
  { code: 'AB', name: 'Alberta (5%)', rate: 0.05 },
  { code: 'MB', name: 'Manitoba (12%)', rate: 0.12 },
  { code: 'NB', name: 'Nouveau-Brunswick (15%)', rate: 0.15 },
  { code: 'NL', name: 'Terre-Neuve-et-Labrador (15%)', rate: 0.15 },
  { code: 'NS', name: 'Nouvelle-Écosse (15%)', rate: 0.15 },
  { code: 'PE', name: 'Île-du-Prince-Édouard (15%)', rate: 0.15 },
  { code: 'SK', name: 'Saskatchewan (11%)', rate: 0.11 },
  { code: 'NT', name: 'Territoires du Nord-Ouest (5%)', rate: 0.05 },
  { code: 'NU', name: 'Nunavut (5%)', rate: 0.05 },
  { code: 'YT', name: 'Yukon (5%)', rate: 0.05 },
]

function getProvinceFromPostalCode(postalCode: string): string {
  const cleanCode = postalCode.trim().toUpperCase().replace(/\s+/g, '')
  if (!cleanCode) return 'QC'

  const firstLetter = cleanCode.charAt(0)
  switch (firstLetter) {
    case 'A': return 'NL'
    case 'B': return 'NS'
    case 'C': return 'PE'
    case 'E': return 'NB'
    case 'G':
    case 'H':
    case 'J': return 'QC'
    case 'K':
    case 'L':
    case 'M':
    case 'N':
    case 'P': return 'ON'
    case 'R': return 'MB'
    case 'S': return 'SK'
    case 'T': return 'AB'
    case 'V': return 'BC'
    case 'Y': return 'YT'
    case 'X':
      if (cleanCode.startsWith('X0A') || cleanCode.startsWith('X0B') || cleanCode.startsWith('X0C')) {
        return 'NU'
      }
      return 'NT'
    default:
      return 'QC'
  }
}

interface EventPageProps {
  event: events
  tickets: TicketWithAvailability[]
}

const EventPage = ({ event, tickets }: EventPageProps) => {
  const { t } = useLanguage()
  const [postalCode, setPostalCode] = useState('')
  const selectedProvince = getProvinceFromPostalCode(postalCode)
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const ticketsRef = useRef<HTMLDivElement>(null)

  const scrollToTickets = () => {
    ticketsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const [showFloatingBtn, setShowFloatingBtn] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const ticketsSection = ticketsRef.current
      if (!ticketsSection) return

      const rect = ticketsSection.getBoundingClientRect()
      const scrolledPastHero = window.scrollY > 200
      const ticketsSectionVisible = rect.top < window.innerHeight && rect.bottom > 0

      setShowFloatingBtn(scrolledPastHero && !ticketsSectionVisible)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const [selectedTicket, setSelectedTicket] = useState<TicketWithAvailability | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [clientSecret, setClientSecret] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [ticketQuantity, setTicketQuantity] = useState(1)

  // Promo Code State
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null)
  const [promoError, setPromoError] = useState('')
  const [isVerifyingPromo, setIsVerifyingPromo] = useState(false)

  const handleApplyPromo = async () => {
    if (!promoCode) return
    setIsVerifyingPromo(true)
    setPromoError('')
    setAppliedPromo(null)

    const result = await verifyPromoCode(promoCode.toUpperCase())
    if (result.success && result.promo) {
      setAppliedPromo(result.promo)
    } else {
      setPromoError(result.error || 'Code invalide')
    }
    setIsVerifyingPromo(false)
  }

  const calculateTotalBeforeTax = () => {
    if (!selectedTicket) return 0
    let total = selectedTicket.price * ticketQuantity

    if (appliedPromo) {
      if (appliedPromo.type === 'percentage') {
        total = total - (total * (appliedPromo.value / 100))
      } else {
        total = Math.max(0, total - appliedPromo.value)
      }
    }
    return total
  }

  const getTaxRate = () => {
    const province = PROVINCES.find((p) => p.code === selectedProvince)
    return province ? province.rate : 0
  }

  const calculateTax = () => {
    return calculateTotalBeforeTax() * getTaxRate()
  }

  const calculateGrandTotal = () => {
    return calculateTotalBeforeTax() + calculateTax()
  }

  const handleGetTicket = (ticket: TicketWithAvailability) => {
    setSelectedTicket(ticket)
    setTicketQuantity(1)
    setPromoCode('')
    setAppliedPromo(null)
    setPromoError('')
    setPostalCode('')
    setShowModal(true)
  }

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Animation - Cinematic Entrance + Parallax
      const tl = gsap.timeline();

      // Initial Reveal (Fade + Scale Down)
      tl.fromTo(
        heroRef.current,
        { scale: 1.2, opacity: 0 },
        { scale: 1.1, opacity: 1, duration: 1.8, ease: 'power2.out' }
      );

      // Parallax Effect on Scroll
      gsap.to(heroRef.current, {
        yPercent: 20, // Moves image down slightly as user scrolls down
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Continuous Cinematic Zoom (Ken Burns)
      gsap.to(heroRef.current, {
        scale: 1.0,
        duration: 20,
        ease: 'none',
        repeat: -1,
        yoyo: true, // Slowly zooms in and out
      });

      // Title Animation
      gsap.fromTo(
        titleRef.current,
        { y: "100%" },
        { y: "0%", duration: 1.2, delay: 0.5, ease: 'power4.out' }
      )

      // Cards Animation
      gsap.fromTo(
        cardsRef.current?.children ?? [],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 85%',
          },
        }
      )

      // Map Animation
      gsap.fromTo(
        mapRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: mapRef.current,
            start: 'top 90%',
          },
        }
      )
    }, containerRef)

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
        quantity: ticketQuantity,
        promoCode: appliedPromo ? appliedPromo.code : null,
        eventId: event.$id,
        province: selectedProvince
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
    <div ref={containerRef} className="min-h-screen bg-[#0a0a0a] text-white selection:bg-main selection:text-black">
      {/* Immersive Hero Section */}
      <div className="relative w-full h-[70vh] overflow-hidden">
        <div ref={heroRef} className="absolute inset-0 w-full h-full">
          <Image
            src={event.image}
            alt={event.name}
            fill
            className="object-cover"
            priority
          />
          {/* Gradient Overlay - Enhanced for Cinematic Feel */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-[#0a0a0a]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#0a0a0a_120%)] opacity-60" /> {/* Vignette */}
        </div>

        <div className="absolute bottom-0 left-0 w-full p-8 lg:p-16 z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="overflow-hidden pb-4"> {/* Added padding-bottom to ensure descenders/shadows aren't clipped */}
            <h1 ref={titleRef} className="text-4xl lg:text-7xl font-Josefin font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#B78418] via-[#E6C55D] to-[#B78418] drop-shadow-2xl transform translate-y-full"> {/* Initial state accessible if JS fails, though GSAP handles it */}
              {event.name}
            </h1>
          </div>
          <button
            onClick={scrollToTickets}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#B78418] bg-black/40 backdrop-blur-md px-8 py-3 text-xs font-semibold uppercase tracking-widest text-[#B78418] hover:bg-[#B78418] hover:text-black transition-all duration-300 shadow-lg hover:shadow-[#B78418]/20"
          >
            <span>{t('getTickets')}</span>
            <FaLongArrowAltRight className="rotate-90" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-6 py-16 space-y-24">

        {/* Description */}
        <div className="space-y-8 max-w-4xl mx-auto text-center lg:text-left">
          <p className="text-gray-400 italic text-sm uppercase tracking-widest">
            Event Description
          </p>
          <p className='text-xs text-gray-500 italic mt-4'>French description will Follow</p>

          <div className="space-y-6 text-lg lg:text-xl text-gray-300 font-light leading-relaxed">
            {event.description_sections ? (
              event.description_sections.map((section, idx) => (
                <p key={idx}>{section}</p>
              ))
            ) : event.description ? (
              <p>{event.description}</p>
            ) : null}
          </div>

          <div className="pt-6 flex justify-center lg:justify-start">
            <button
              onClick={scrollToTickets}
              className="inline-flex items-center gap-2 rounded-full border border-[#B78418] bg-transparent px-8 py-3 text-sm font-semibold uppercase tracking-widest text-[#B78418] hover:bg-[#B78418] hover:text-black transition-all duration-300"
            >
              <span>{t('getTickets')}</span>
              <FaLongArrowAltRight className="rotate-90" />
            </button>
          </div>
        </div>

        {/* Tickets Section */}
        <div ref={ticketsRef} className="relative">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-Josefin font-bold text-main">Get Your Tickets</h2>
            <div className="w-24 h-1 bg-main mx-auto rounded-full" />
            <p className="text-gray-400">Secure your spot for an unforgettable experience</p>
          </div>

          <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center items-stretch">
            {tickets.map((ticket) => (
              <div
                key={ticket.$id}
                className="group relative flex flex-col p-8 rounded-2xl bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-main/10 border border-[#B78418]"
              >
                {/* Card Glow Effect */}
                {/* Card Glow Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-2xl font-Josefin font-bold uppercase tracking-wide text-white mb-2">
                    {ticket.name}
                  </h3>
                  <div className="w-12 h-0.5 bg-main mb-6 group-hover:bg-main transition-colors duration-300" />

                  <ul className="flex-1 space-y-4 mb-8">
                    {ticket.advantages.map((ad, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-300 font-light text-sm">
                        <GrStatusGood className="text-main w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span className='leading-snug'>{ad}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto border-t border-white/10 pt-6">
                    <div className="flex items-end justify-between mb-6">
                      <span className="text-gray-400 text-sm">{t('price')}</span>
                      <span className="text-3xl font-bold text-white">
                        {ticket.price === 0 ? t('free') : `$${ticket.price}`}
                      </span>
                    </div>

                    {ticket.available === null ? (
                      <button disabled className="w-full bg-gray-500/10 border border-gray-500/50 text-gray-400 font-bold py-3 px-6 rounded-lg cursor-not-allowed uppercase tracking-wider text-sm">
                        Not Yet Available
                      </button>
                    ) : ticket.available && ticket.remaining > 0 ? (
                      <button
                        onClick={() => handleGetTicket(ticket)}
                        className="w-full group/btn relative overflow-hidden bg-transparent border border-[#B78418] text-[#B78418] font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:bg-[#B78418] hover:text-black flex items-center justify-center gap-2"
                      >
                        <span className="relative z-10">Get Ticket</span>
                        <FaLongArrowAltRight className="relative z-10 transform group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    ) : (
                      <button disabled className="w-full bg-red-500/10 border border-red-500/50 text-red-500 font-bold py-3 px-6 rounded-lg cursor-not-allowed uppercase tracking-wider">
                        Sold Out
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Section */}
        <div ref={mapRef} className="mt-24 w-full h-[400px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 grayscale hover:grayscale-0 transition-all duration-700">
          <iframe
            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBmOnXwk6UJGZrviERljANNWizRXjccyM8&q=${encodeURIComponent(
              event.adresse
            )}`}
            width="100%"
            height="100%"
            loading="lazy"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#171717] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold font-Josefin text-white">
                Checkout: <span className="text-main">{selectedTicket?.name}</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {!clientSecret ? (
                <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-main focus:ring-1 focus:ring-main transition-all"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-main focus:ring-1 focus:ring-main transition-all"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-main focus:ring-1 focus:ring-main transition-all"
                      required
                    />

                    <input
                      type="text"
                      placeholder="Postal Code (ex: H3Z 2B1)"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-main focus:ring-1 focus:ring-main transition-all placeholder:text-gray-600"
                      required
                      maxLength={7}
                    />

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Quantity</label>
                      <select
                        value={ticketQuantity}
                        onChange={(e) => setTicketQuantity(Number(e.target.value))}
                        className="w-full bg-black/30 border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-main transition-all appearance-none cursor-pointer"
                      >
                        {Array.from({ length: Math.max(1, selectedTicket?.remaining ?? 1) }, (_, index) => index + 1).map(
                          (value) => (
                            <option key={value} value={value} className="bg-[#171717] text-white">
                              {value}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {/* Promo Code Section */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Promo Code</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter Code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          className="flex-1 bg-black/30 border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-main transition-all placeholder:text-gray-600"
                          disabled={!!appliedPromo}
                        />
                        {appliedPromo ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAppliedPromo(null)
                              setPromoCode('')
                            }}
                            className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 rounded-lg hover:bg-red-500/20 transition-colors"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleApplyPromo}
                            disabled={!promoCode || isVerifyingPromo}
                            className="bg-white/10 border border-white/10 text-white px-4 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isVerifyingPromo ? '...' : 'Apply'}
                          </button>
                        )}
                      </div>
                      {promoError && <p className="text-red-400 text-xs">{promoError}</p>}
                      {appliedPromo && (
                        <p className="text-green-400 text-xs">
                          Code applied: {appliedPromo.type === 'percentage' ? `-${appliedPromo.value}%` : `-$${appliedPromo.value}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedTicket && (
                    <div className="flex flex-col gap-2 bg-white/5 p-4 rounded-lg mt-2 border border-white/5">
                      <div className="flex justify-between items-center text-sm text-gray-400">
                        <span>Subtotal</span>
                        <span>${(selectedTicket.price * ticketQuantity).toFixed(2)}</span>
                      </div>
                      {appliedPromo && (
                        <div className="flex justify-between items-center text-sm text-green-400">
                          <span>Discount</span>
                          <span>-${((selectedTicket.price * ticketQuantity) - calculateTotalBeforeTax()).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm text-gray-400 border-t border-white/5 pt-2">
                        <span>Taxes ({ (getTaxRate() * 100).toFixed(3).replace(/\.?0+$/, '') }%)</span>
                        <span>${calculateTax().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-white/10 mt-2">
                        <span className="text-gray-300 font-bold">Total Amount</span>
                        <span className="text-xl font-bold text-main">
                          ${calculateGrandTotal().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-main text-black font-bold py-3 px-6 rounded-lg hover:bg-main/90 transition-colors mt-2"
                  >
                    Proceed to Payment
                  </button>
                </form>
              ) : (
                <div className="animate-in slide-in-from-right duration-300">
                  <Elements stripe={stripePromise} options={{
                    clientSecret, appearance: {
                      theme: 'night',
                      variables: {
                        colorPrimary: '#FFD700',
                        colorBackground: '#171717',
                        colorText: '#ffffff',
                        colorDanger: '#ff4d4f',
                        spacingUnit: '4px',
                        borderRadius: '8px',
                      },
                    },
                  }}>
                    <PaymentForm
                      clientSecret={clientSecret}
                      fullName={name}
                      email={email}
                      phone={phone}
                      quantity={ticketQuantity}
                      ticketId={selectedTicket!.$id}
                      eventId={event.$id}
                    />
                  </Elements>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Tickets Button */}
      <button
        onClick={scrollToTickets}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#B78418] to-[#E6C55D] text-black px-6 py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-500 shadow-[0_8px_30px_rgba(183,132,24,0.3)] hover:shadow-[#B78418]/50 hover:scale-105 active:scale-95 ${
          showFloatingBtn ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-4 scale-90 pointer-events-none'
        }`}
      >
        <span>{t('getTickets')}</span>
        <FaLongArrowAltRight className="rotate-90 animate-bounce" />
      </button>
    </div>
  )
}

export default EventPage
