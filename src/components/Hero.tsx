'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const heroImages = [
  '/hero-background.jpg',
  '/hero-background2.jpg',
  '/hero-background3.jpg',
  '/hero-background4.jpg',

]

const Hero = () => {
  const heroRef = useRef(null)
  const [currentIndex, setCurrentIndex] = useState(0)

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length)
    }, 5000) // Change toutes les 5s
    return () => clearInterval(interval)
  }, [])

  return (
    <section ref={heroRef} className="relative lg:mb-60">
      {/* Carousel */}
      <div className="absolute top-0 left-0 w-full h-[700px] max-md:hidden overflow-hidden">
        {heroImages.map((src, index) => (
          <Image
            key={index}
            src={src}
            alt={`hero-${index}`}
            fill
            className={`object-cover object-top transition-opacity duration-1000 ${
              currentIndex === index ? 'opacity-20' : 'opacity-0'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="text-center mt-10 lg:text-left lg:w-[564px] lg:relative lg:ml-[50%]">
        <h1 className="hero-text text font-Josefin font-bold text-main leading-13">
          EXPERIENCE EVENTS LIKE NEVER BEFORE.
        </h1>
        <h4 className="hero-text font-Poppins mt-10 text-[16px]">
          Welcome to The Fifth Event Agency, where innovation meets excellence in event planning. We take pride in crafting extraordinary moments tailored to your vision.
        </h4>
        <Link
          href="/event"
          className="hero-text flex items-center lg:justify-start mt-10 justify-center text-xl font-bold"
        >
          Our Events
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
