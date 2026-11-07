"use client"
import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const Partners = () => {
  const sectionRef = useRef(null)
  const logosRef = useRef([])

  useEffect(() => {
    const logos = logosRef.current

    gsap.fromTo(
      logos,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      }
    )
  }, [])

  return (
    <section ref={sectionRef} className="my-30">
      <h2 className="text-main text-center text-2xl font-Josefin mb-8">
        Check our best clients and partners
      </h2>
      <div className="flex w-full justify-around overflow-hidden opacity-40 flex-wrap gap-6">
        {[
          { src: '/partners/partner-b.png', alt: 'Partner logo', className: 'h-16 sm:h-20 md:h-24 lg:h-28' },
          { src: '/partners/partner-wave.png', alt: 'Partner logo', className: 'h-14 sm:h-16 md:h-20 lg:h-24' },
          { src: '/partners/partner-heritaj.png', alt: 'Heritaj', className: 'h-14 sm:h-16 md:h-20 lg:h-24' },
          { src: '/partners/partner-w.png', alt: 'W', className: 'h-12 sm:h-14 md:h-16 lg:h-20' },
          { src: '/partners/partner-place-des-arts.png', alt: 'Place des Arts', className: 'h-12 sm:h-14 md:h-16 lg:h-20' },
        ].map((logo, i) => (
          <img
            key={i}
            src={logo.src}
            alt={logo.alt}
            className={`${logo.className} object-contain`}
            ref={(el) => {
              if (el) logosRef.current[i] = el
            }}
                      />
        ))}
      </div>
    </section>
  )
}

export default Partners
