'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLanguage } from '@/context/LanguageContext'

gsap.registerPlugin(ScrollTrigger)

const Hero = () => {
  const heroRef = useRef(null)
  const { t } = useLanguage()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-text', {
        y: 100,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 1,
        stagger: 0.4,
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top 80%',
        },
      })
    }, heroRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={heroRef} className="relative  h-[700px] overflow-hidden">
      {/* Background Video */}
      <video
        className="absolute top-0 left-0 w-full h-[700px] object-cover opacity-20"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/hero.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Content */}
      <div className="text-center mt-[40%] lg:mt-[15%] lg:text-left lg:w-[564px] lg:relative lg:ml-[50%] z-10 relative">
        <h1 className="hero-text text font-Josefin font-bold text-main leading-13">
          {t('heroTitle')}
        </h1>
        <h4 className="hero-text font-Poppins mt-10 text-[16px]">
          {t('heroSubtitle')}
        </h4>
        <Link
          href="/event"
          className="hero-text flex items-center lg:justify-start mt-10 justify-center text-xl font-bold"
        >
          {t('heroButton')}
          <span className="inline-block ml-2 p-2 rounded-full bg-main">
            <Image
              src="/bi_arrow-right-black.svg"
              width={18}
              height={18}
              alt="arrow right"
            />
          </span>
        </Link>
      </div>
    </section>
  )
}

export default Hero
