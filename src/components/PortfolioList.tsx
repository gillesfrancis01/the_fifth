'use client'

import { portfolio as PortfolioType } from '@/types'
import React, { useEffect, useRef } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const PortfolioList = ({
  portfolio,
  reverse
}: {
  portfolio: PortfolioType
  reverse?: boolean
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (imageRef.current && textRef.current) {
        gsap.fromTo(
          imageRef.current,
          {
            x: reverse ? 200 : -200,
            y: -100,
            opacity: 0,
          },
          {
            x: 0,
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
            delay:0.5,
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top 80%',
              toggleActions: 'play reverse play reverse'
            },
          }
        )

        gsap.fromTo(
          textRef.current,
          {
            y: 50,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            delay: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top 85%',
              toggleActions: 'play reverse play reverse'
            },
          }
        )
      }
    }, containerRef)

    return () => ctx.revert()
  }, [reverse])

  return (
    <div
      ref={containerRef}
      className={`max-md:text-center lg:flex lg:items-center lg:gap-14 ${
        reverse ? 'lg:flex-row-reverse' : ''
      } w-[80vw] m-auto mt-10`}
    >
      <img
        ref={imageRef}
        src={portfolio.image}
        className="m-auto mt-10 w-[90vw] object-cover lg:w-1/2"
        alt="project"
      />
      <div ref={textRef} className="mt-6 lg:mt-0 lg:w-1/2">
        <h2 className="text-3xl text-main font-Josefin">{portfolio.name}</h2>
        <h3 className="mt-4">{t('client')}: {portfolio.client}</h3>
        <p className="mt-6">
          <span className="text-main font-extrabold">{t('description')}:</span>{' '}
          {portfolio.description}
        </p>
      </div>
    </div>
  )
}

export default PortfolioList
