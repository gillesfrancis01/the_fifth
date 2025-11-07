'use client'

import React, { useEffect, useRef } from 'react'
import { FaCalendarAlt } from 'react-icons/fa'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { events } from '@/types' // Assure-toi que ce type est bien défini

gsap.registerPlugin(ScrollTrigger)

interface EventProps {
  event: events
  date: string
  hour: string
}

export const Event = ({ event, date, hour }: EventProps) => {
  const containerRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current, {
        opacity: 0,
        y: 50,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <Link
      href={`/event/${event.$id}`}
      ref={containerRef}
      className='lg:flex lg:items-center lg:w-[90vw] lg:m-auto lg:gap-4 cursor-pointer shadow-lg rounded-lg p-6 transition-shadow hover:shadow-2xl'
    >
      <h2 className='text-2xl lg:w-[20%]'>{date.slice(0, 3)}</h2>
      <div className='lg:text-left lg:w-[70%] hover:border-l-3 border-main pl-4'>
        <div className='p-3 mt-5 inline-block bg-main rounded-full'>
          <FaCalendarAlt className='text-black' />
        </div>

        <h2 className='inline-block ml-3'>{date}</h2>
        <h1 className='text-2xl lg:font-Josefin lg:capitalize lg:w-[70%]'>{event.name}</h1>
        <h2 className='text-xl'>{event.adresse}</h2>
        <p className='mt-5'>{event.teaser}</p>
      </div>
      <img
        src={event.image}
        className='m-auto mt-10 w-[90vw] lg:w-[600px] h-[400px] max-md:rounded-xl object-cover rounded-lg shadow-lg'
        alt='event image'
      />
    </Link>
  )
}
