'use client'

import React, { useState, useTransition } from 'react'
import Image from 'next/image'

import FlatButton from '@/components/FlatButton'
import { FaLocationDot, FaPhone } from "react-icons/fa6"
import { IoMailSharp } from "react-icons/io5"
import { createContactMessage } from '@/app/actions/contact'

const ContactPage = () => {
  const [isPending, startTransition] = useTransition()
  
  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [agreed, setAgreed] = useState(false)
  
  // Feedback state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!agreed) {
      setFeedback({ type: 'error', message: "Veuillez accepter que vos données soient collectées et stockées." })
      return
    }

    if (!name.trim() || !email.trim() || !message.trim()) {
      setFeedback({ type: 'error', message: "Veuillez remplir les champs obligatoires (*)." })
      return
    }

    startTransition(async () => {
      const result = await createContactMessage({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        subject: subject.trim() || null,
        message: message.trim(),
      })

      if (result.success) {
        setFeedback({
          type: 'success',
          message: "Merci pour votre message ! Notre équipe vous contactera dans les plus brefs délais."
        })
        // Reset form
        setName('')
        setEmail('')
        setPhone('')
        setSubject('')
        setMessage('')
        setAgreed(false)
      } else {
        setFeedback({
          type: 'error',
          message: result.error || "Une erreur est survenue lors de l'envoi."
        })
      }
    })
  }

  return (
    <div className='flex flex-col'>
      <div className='text-center '>
        <h2 className='text-main text-center text-2xl font-Josefin'>Contact</h2>
        <Image src="/arrows.svg" className="m-auto " width={300} height={100} alt='arrows'/>
        <h3 className='uppercase text-2xl font-Josefin text-main font-bold '>Contact Us</h3>
        
        <div className='lg:flex lg:flex-row-reverse lg:text-left lg:w-[70vw] lg:justify-around lg:m-auto mt-8'>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className='max-md:w-[90vw] max-md:m-auto space-y-4 lg:w-[50%]'>
            {feedback && (
              <p className={`rounded-xl border px-4 py-2.5 text-xs text-left ${
                feedback.type === 'success'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : 'border-red-500/40 bg-red-500/10 text-red-200'
              }`}>
                {feedback.message}
              </p>
            )}

            <div className='flex gap-3'>
              <input
                type="text"
                placeholder='Name*'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='border-b bg-transparent w-[48%] p-3 text-sm text-white outline-none focus:border-main placeholder:text-white/40'
                required
              />
              <input
                type="email"
                placeholder='Email Address*'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='border-b bg-transparent w-[48%] p-3 text-sm text-white outline-none focus:border-main placeholder:text-white/40'
                required
              />
            </div>

            <div className='flex gap-3'>
              <input
                type="text"
                placeholder='Phone'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className='border-b bg-transparent w-[48%] p-3 text-sm text-white outline-none focus:border-main placeholder:text-white/40'
              />
              <input
                type="text"
                placeholder='Subject'
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className='border-b bg-transparent w-[48%] p-3 text-sm text-white outline-none focus:border-main placeholder:text-white/40'
              />
            </div>

            <div>
              <input
                type="text"
                placeholder='How can we help you? Feel free to get in touch!*'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className='border-b bg-transparent w-full p-3 text-sm text-white outline-none focus:border-main placeholder:text-white/40'
                required
              />
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                name="agreement"
                id="agreement"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className='mt-1 accent-main h-4 w-4 border-2 border-white/20'
              />
              <label htmlFor="agreement" className="text-xs text-white/60 cursor-pointer select-none">
                I agree that my submitted data is being collected and stored.
              </label>
            </div>

            <FlatButton type="submit" disabled={isPending} className='mt-5'>
              {isPending ? 'Sending...' : 'Get In Touch'}
            </FlatButton>
          </form>

          {/* Details */}
          <div className="max-md:mt-10 lg:w-[40%]">
            <h4 className='text-2xl font-bold'>Contact Details</h4>
            
            <div className='lg:flex lg:items-center lg:gap-3 mt-4'> 
              <span className='bg-main p-4 rounded-full inline-block'>
                <FaLocationDot className='text-black'/>
              </span>
              <p className="text-white/80">738 Rue St-Paul O, Montreal QC, H3C 0N5</p>
            </div>
            
            <div className='lg:flex lg:items-center lg:gap-3 mt-4'>
              <span className='bg-main p-4 rounded-full inline-block'>
                <IoMailSharp className='text-black'/>
              </span>
              <p className="text-white/80">info@thefifthevent.com</p>
            </div>
            
            <div className='lg:flex lg:items-center lg:gap-3 mt-4'>
              <span className='bg-main p-4 rounded-full inline-block'>
                <FaPhone className='text-black'/>
              </span>
              <p className="text-white/80">+1 (514) 519 2002</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ContactPage