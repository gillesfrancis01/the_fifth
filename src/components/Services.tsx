'use client'

import React, { useEffect, useRef } from 'react'
import FlatButton from './FlatButton'
import Image from 'next/image'
import { service } from '@/types'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRouter } from 'next/navigation'

gsap.registerPlugin(ScrollTrigger)

export const Services = ({ item }: { item: service }) => {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          end: 'bottom 10%',
          toggleActions: 'play reverse play reverse',
        },
      })

      tl.fromTo(
        containerRef.current,
        { opacity: 0, xPercent: -100, rotate: -10 },
        { opacity: 1, xPercent: 0, rotate: 0, duration: 1, ease: 'power3.out' }
      )

      tl.fromTo(
        textRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.6'
      )

      tl.fromTo(
        imageRef.current,
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4 },
        '-=0.4'
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const handleRedirect = () => {
    router.push(`/service/${item.id}`)
  }

  return (
    <div
      ref={containerRef}
      onClick={handleRedirect}
      className="cursor-pointer lg:text-left text-center my-10 font-Poppins font-light lg:flex items-center justify-around hover:text-yellow-400 transition-colors"
    >
      <h3 className="text-3xl">{item.id}.</h3>
      <h3 ref={textRef} className="text-3xl lg:text-left lg:w-[20%]">{item.title}</h3>
      <p className="mt-3 text-xl lg:w-[30%]">{item.description}</p>

      <span className="inline-block ml-2 p-2 rounded-full bg-main">
            <Image
              src="/bi_arrow-right-black.svg"
              width={18}
              height={18}
              alt="arrow right"
            />
          </span>
    </div>
  )
}
