'use client'

import { FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaPaperPlane } from 'react-icons/fa'

export default function ContactCard() {
  return (
    <div className="max-w-md w-full p-6 rounded-2xl bg-main text-black shadow-xl space-y-6 h-[700px]">
      <h2 className="text-2xl font-semibold">Get in Touch</h2>

      {/* Form */}
      <form className="space-y-4">
        <input
          type="text"
          placeholder="Name"
          className="w-full bg-transparent border-b border-black outline-none placeholder-black py-2"
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full bg-transparent border-b border-black outline-none placeholder-black py-2"
        />
        <textarea
          placeholder="Message"
          rows={3}
          className="w-full bg-transparent border-b border-black outline-none placeholder-black py-2"
        ></textarea>
        <button
          type="submit"
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded shadow hover:bg-opacity-90 transition"
        >
          <FaPaperPlane />
          Get In Touch
        </button>
      </form>

      {/* Contact Info */}
      <div className="pt-6 border-t border-black space-y-4">
        <h3 className="text-lg font-medium">Contact Info</h3>

        <div className="flex items-start gap-3">
          <FaMapMarkerAlt className="mt-1" />
          <p>
            Montreal QC-<br />
            738 Rue St-Paul O<br />
            H3C 0N5
          </p>
        </div>

        <div className="flex items-center gap-3">
          <FaEnvelope />
          <p>info@thefifthevent.com</p>
        </div>

        <div className="flex items-center gap-3">
          <FaPhoneAlt />
          <p>+1 (514) 519 2002</p>
        </div>
      </div>
    </div>
  )
}
