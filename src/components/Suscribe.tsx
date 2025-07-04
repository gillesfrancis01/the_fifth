'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useActionState } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import addCustomer from '@/app/actions/addCustomer'
import 'react-toastify/dist/ReactToastify.css'

const SubscribeModal = () => {
  const [state, formAction] = useActionState(addCustomer, {})
  const [isOpen, setIsOpen] = useState(false)
  const modalRef = useRef(null)

  useEffect(() => {
    const isFirstVisit = localStorage.getItem('hasVisited') !== 'true'
    if (isFirstVisit) {
      setIsOpen(true)
      localStorage.setItem('hasVisited', 'true')
    }
  }, [])

  useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.success) {
      toast.success('Subscribed successfully')
      setIsOpen(false)
    }
  }, [state])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div ref={modalRef} className="bg-[#262626] p-6 rounded-md border border-[#404040] w-full max-w-md">
        <h3 className="text-xl font-Josefin text-main font-bold mb-4">
          Subscribe for the Newsletter
        </h3>
        <form action={formAction} className="flex flex-col gap-4">
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Your email here"
            required
            className="p-3 rounded bg-[#1a1a1a] text-white border border-[#333]"
          />
          <button
            type="submit"
            className="bg-main text-black p-3 rounded-xl hover:opacity-90 transition"
          >
            Subscribe
          </button>
        </form>
        <ToastContainer />
      </div>
    </div>
  )
}

export default SubscribeModal