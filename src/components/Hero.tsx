"use client"
import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const Hero = () => {
  const heroRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-text", {
        y: 100,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        delay: 1,
        stagger: 0.4,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top 80%",
        }
      })
    }, heroRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={heroRef} className='relative lg:mb-60'>
      <div>
        <img src="/hero-background.png" alt="hero background" className='max-md:hidden absolute h-[600px] w-[100vw]'/>
      </div>
      <div className='text-center mt-10 lg:text-left lg:w-[564px] lg:relative lg:ml-[50%]'>
        <h1 className='hero-text text font-Josefin font-bold text-main leading-13'>
          EXPERIENCE EVENT LIKE NEVER BEFORE.
        </h1>
        <h4 className='hero-text font-Poppins mt-10 text-[16px]'>
          Welcome to The fifth event agency, where innovation meets excellence in event planning. We take pride in crafting extraordinary moments tailored to your vision.
        </h4>
        <Link href="/event" className='hero-text flex items-center lg:justify-start mt-10 justify-center text-xl font-bold'>
          Our Events
          <span className='inline-block ml-2 p-2 rounded-full bg-main'>
            <Image src='/bi_arrow-right-black.svg' width={18} height={18} alt='arrow left'/>
          </span>
        </Link>
      </div>
    </section>
  )
}

export default Hero
