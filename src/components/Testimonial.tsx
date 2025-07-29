import React from 'react'
import Image from 'next/image'
import useConstants from '@/hooks/useConstants'
import Carousel from './Carousel'

const Testimonial = () => {
  const { Testimonials } = useConstants()
  return (
    <div className='text-center font-Poppins '>
      <h2 className='text-main text-center text-2xl font-Josefin'>Testimonials</h2>
      <Image src="/arrows.svg" className="m-auto " width={300} height={100} alt='arrows'/>
      <h3 className='uppercase text-2xl  font-Josefin text-main font-bold '>WHAT OUR CLIENT SAY ABOUT US</h3>
      <div className='max-w-lg'>
        <Carousel
          data={Testimonials}
          type="testimonial"
          autoSlide
          autoSlideInterval={5000}
        />
      </div>
    </div>
  )
}

export default Testimonial
