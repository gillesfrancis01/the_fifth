"use client"
import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const Separator = () => {
  const containerRef = useRef(null)
  const leftBarRef = useRef(null)
  const rightBarRef = useRef(null)
  const logoRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: true,
        // markers: true, // active si tu veux debug
      },
    })

    // Animation d'entrée : barres qui viennent de l'extérieur
    tl.fromTo(
      leftBarRef.current,
      { x: '-100%' },
      { x: '0%', duration: 0.5, ease: 'power2.out' }
    )
      .fromTo(
        rightBarRef.current,
        { x: '100%' },
        { x: '0%', duration: 0.5, ease: 'power2.out' },
        '<' // commence en même temps que la précédente
      )
      .fromTo(
        logoRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' },
        '<0.3'
      )

      // Animation de sortie : barres repartent à l'extérieur, logo disparaît
      .to(
        leftBarRef.current,
        { x: '-100%', duration: 0.5, ease: 'power2.in' },
        '+=0.5'
      )
      .to(
        rightBarRef.current,
        { x: '100%', duration: 0.5, ease: 'power2.in' },
        '<'
      )
      .to(
        logoRef.current,
        { opacity: 0, scale: 0.8, duration: 0.5, ease: 'power2.in' },
        '<'
      )
  }, [])

  return (
    <div
      ref={containerRef}
      className="max-md:hidden flex justify-center gap-6 items-center pt-7 mb-6"
    >
      <hr
        ref={leftBarRef}
        className="border-main border-2 w-[40%]"
        style={{ transformOrigin: 'left center' }}
      />
      <div className="border-amber-400 border-2 rounded-full p-2">
        <img
          ref={logoRef}
          src="/logo.png"
          className="m-auto h-[50px]"
          alt="arrows"
        />
      </div>
      <hr
        ref={rightBarRef}
        className="border-main border-2 w-[40%]"
        style={{ transformOrigin: 'right center' }}
      />
    </div>
  )
}
