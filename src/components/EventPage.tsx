'use client'
import React, { useEffect, useRef } from 'react'
import { FaLongArrowAltRight } from 'react-icons/fa'
import { GrStatusGood } from 'react-icons/gr'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const EventPage = ({ event, tickets }: { event: any; tickets: any }) => {
  const imageRef = useRef<HTMLImageElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const descRef = useRef<HTMLParagraphElement>(null)
  const ticketsRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const shineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax image scroll
      gsap.to(imageRef.current, {
        y: -100,
        ease: 'none',
        scrollTrigger: {
          trigger: imageRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })

      // Fade + slide titles and description on scroll
      gsap.fromTo(
        [titleRef.current, descRef.current],
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          stagger: 0.3,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 85%',
          },
        }
      )

      // Shine effect on title looping
      gsap.to(shineRef.current, {
        xPercent: 100,
        duration: 2,
        ease: 'power1.inOut',
        repeat: -1,
        yoyo: true,
      })

      // Tickets appearance staggered
      gsap.fromTo(
        ticketsRef.current?.children,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: ticketsRef.current,
            start: 'top 90%',
          },
        }
      )

      // Map zoom + fade in
      gsap.fromTo(
        mapRef.current,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 1.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: mapRef.current,
            start: 'top 90%',
          },
        }
      )
    })

    return () => ctx.revert()
  }, [])

  return (
    <div>
      <div className="relative overflow-hidden">
        <img
          ref={imageRef}
          src={event.image}
          className="m-auto mt-10 w-[90vw] h-[500px] max-md:rounded-xl object-cover rounded-lg shadow-lg"
          alt="event"
        />
      </div>

      <h1
        ref={titleRef}
        className="text-3xl text-center uppercase font-extrabold text-main mt-5 font-Josefin lg:text-left lg:w-[90vw] lg:m-auto lg:my-10 relative overflow-hidden"
      >
        {event.name}
        {/* Shine effect overlay */}
        <div
          ref={shineRef}
          className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
          style={{ transform: 'translateX(-100%)', mixBlendMode: 'screen' }}
        ></div>
      </h1>

      <p
        ref={descRef}
        className="text-center my-10 lg:w-[90vw] lg:m-auto lg:text-left "
      >
        {event.description}
      </p>

      <h2 className="text-main text-center text-2xl font-Josefin">Tickets</h2>
      <Image
        src="/arrows.svg"
        className="m-auto"
        width={300}
        height={100}
        alt="arrows"
      />
      <h3 className="uppercase text-2xl font-Josefin text-main font-bold text-center">
        Get your Ticket now
      </h3>

      <div ref={ticketsRef} className="lg:flex justify-center gap-10 flex-wrap mt-8">
        {tickets?.map((item: any) => (
          <div
            key={item.$id}
            className="flex flex-col w-[70vw] max-w-[300px] border-2 border-main p-8 mt-10 rounded-lg shadow-md  transition-transform hover:scale-105 hover:shadow-xl cursor-pointer"
          >
            <h3 className="text-3xl uppercase font-extrabold text-main font-Josefin">
              {item.name}
            </h3>
            <ul>
              {item.advantages.map((ad: any) => (
                <li
                  key={ad}
                  className="flex gap-3 items-center mt-5 font-extralight "
                >
                  <GrStatusGood className="text-yellow-400" />
                  {ad}
                </li>
              ))}
            </ul>
            <div className="flex mt-10 gap-4 items-center justify-between">
              <h3 className="font-extrabold text-2xl">${item.price}</h3>
              {item.available ? (
                <button className="flex gap-1 items-center border-main border p-2 text-main rounded-md shadow-md transition-transform hover:scale-110 hover:rotate-1 hover:shadow-yellow-400/50">
                  Get Ticket <FaLongArrowAltRight className="text-yellow-400" />
                </button>
              ) : (
                <p className="text-red-500 font-semibold">Not Available</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div
        ref={mapRef}
        className="mt-10 w-full h-[200px] rounded-xl overflow-hidden shadow-lg"
      >
        <iframe
          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBmOnXwk6UJGZrviERljANNWizRXjccyM8&q=${encodeURIComponent(
            event.adresse
          )}`}
          width="100%"
          height="100%"
          loading="lazy"
          allowFullScreen
          className="rounded-xl"
        />
      </div>
    </div>
  )
}

export default EventPage
