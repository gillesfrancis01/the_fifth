'use client'

import React, { useEffect, useState } from 'react'
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi'
import { FaArrowRightLong } from "react-icons/fa6"
import StarRating from './StarRating'
import Link from 'next/link'

// Types des données
type TestimonialItem = {
  id: string
  userImg: string
  userMessage: string
  rate: number
  userName: string
}

type PortfolioItem = {
  id: string
  image: string
  name: string
}

// Type générique pour props
type CarouselProps =
  | {
      type: 'testimonial'
      data: TestimonialItem[]
      autoSlide: boolean
      autoSlideInterval: number
    }
  | {
      type: 'portfolio'
      data: PortfolioItem[]
      autoSlide: boolean
      autoSlideInterval: number
    }

const Carousel = ({ data, autoSlide, autoSlideInterval, type }: CarouselProps) => {
  const [current, setCurrent] = useState(0)

  const prev = () => {
    setCurrent((current) => (current === 0 ? data.length - 1 : current - 1))
  }

  const next = () => {
    setCurrent((current) => (current === data.length - 1 ? 0 : current + 1))
  }

  useEffect(() => {
    if (!autoSlide) return
    const slideInterval = setInterval(next, autoSlideInterval)
    return () => clearInterval(slideInterval)
  }, [autoSlide, autoSlideInterval])

  return (
    <div className="overflow-hidden relative">
      <div
        className="flex transition-transform ease-out duration-500"
        style={{
          transform: `translateX(-${(current * 100) / data.length}%)`,
          width: `${data.length * 100}%`,
        }}
      >
        {data.map((item) => (
          <div key={item.id} className="w-full">
            {type === 'testimonial' && (
              <div>
                <img
                  src={(item as TestimonialItem).userImg}
                  alt=""
                  className="w-[90%] h-[500px] object-cover m-auto"
                />
                <p className="font-Poppins text-[12px] w-[90%] m-auto">
                  {(item as TestimonialItem).userMessage}
                </p>
                <StarRating rating={(item as TestimonialItem).rate} />
                <p className="font-Poppins text-6xl font-extrabold mt-5">
                  {(item as TestimonialItem).userName}
                </p>
              </div>
            )}
            {type === 'portfolio' && (
              <div className="text-center">
                <img
                  src={(item as PortfolioItem).image}
                  alt=""
                  className="w-[90%] h-[500px] object-cover m-auto rounded-4xl"
                />
                <h4 className="uppercase mt-3 text-2xl">Portfolio</h4>
                <h3 className="font-Poppins text-[26px] mt-9">
                  {(item as PortfolioItem).name}
                </h3>
                <Link
                  href="#"
                  className="flex items-center gap-2 text-[20px] justify-center mt-5 mb-5"
                >
                  Read More <FaArrowRightLong />
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Arrows */}
      <div className="absolute inset-0 flex items-center justify-between">
        <button onClick={prev} className="p-1 bg-white/40 hover:bg-white rounded-full">
          <BiChevronLeft className="text-4xl text-gray-800" />
        </button>
        <button onClick={next} className="p-1 bg-white/40 hover:bg-white rounded-full">
          <BiChevronRight className="text-4xl text-gray-800" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {data.map((_, i) => (
          <div
            key={i}
            className={`transition-all w-3 h-3 bg-white rounded-full ${
              current === i ? 'p-2' : 'opacity-50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default Carousel
