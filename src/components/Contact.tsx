'use client'

import React from 'react'
import Image from 'next/image'
import { FaPhone } from 'react-icons/fa6'
import { IoMailSharp } from 'react-icons/io5'
import CtaLink from './CtaLink'
import { useLanguage } from '@/context/LanguageContext'

const Contact = () => {
  const { t } = useLanguage()

  return (
    <section className='relative z-0 overflow-hidden text-center font-Poppins py-24 lg:py-32'>
      {/* Image de fond, fondue dans le noir en haut et en bas */}
      <img
        src="/contact-bg.jpeg"
        className="absolute inset-0 z-[-2] h-full w-full object-cover object-top opacity-30"
        alt=""
      />
      <div className="absolute inset-0 z-[-1] bg-[linear-gradient(180deg,#000_0%,rgba(0,0,0,0.55)_30%,rgba(0,0,0,0.55)_70%,#000_100%)]" />
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(circle_at_center,rgba(201,161,77,0.18),transparent_60%)]" />

      <div className='mx-auto w-[90vw] max-w-4xl rounded-3xl border border-[rgba(201,161,77,0.35)] bg-black/50 px-6 py-12 backdrop-blur-sm lg:px-16 lg:py-16'>
        <h2 className='text-main text-center text-2xl font-Josefin'>{t('contact')}</h2>
        <Image src="/arrows.svg" className="m-auto" width={300} height={18} alt="" />
        <h3 className='uppercase text-2xl lg:text-4xl lg:leading-tight font-Josefin text-main font-extrabold mt-8'>
          {t('contactCtaTitle')}
        </h3>
        <p className='mt-6 text-white/80 lg:text-lg'>{t('contactCtaSubtitle')}</p>

        <CtaLink href="/contact" className="mt-10 px-12 py-4 text-base">
          {t('letsTalk')}
        </CtaLink>

        <div className='mt-10 flex flex-col items-center justify-center gap-4 text-white/85 sm:flex-row sm:gap-10'>
          <a href="tel:+15145192002" className='group flex items-center gap-3 transition hover:text-white'>
            <span className='bg-main rounded-full p-3'><FaPhone className='text-black' /></span>
            +1 (514) 519 2002
          </a>
          <a href="mailto:info@thefifthevent.com" className='group flex items-center gap-3 transition hover:text-white'>
            <span className='bg-main rounded-full p-3'><IoMailSharp className='text-black' /></span>
            info@thefifthevent.com
          </a>
        </div>
      </div>
    </section>
  )
}

export default Contact
