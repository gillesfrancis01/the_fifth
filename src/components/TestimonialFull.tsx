"use client"
import React from 'react'
import Image from 'next/image'
import Slider from 'react-slick'
import { Testimonials } from '@/constants'
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"
import StarRating from './StarRating'
import { FaQuoteLeft } from "react-icons/fa";


const settings = {
    dots: true,
    infinite: true,
    speed:500,
    autoplay:true,
    autoplaySpeed:3000,
    arrows:true,
    slidesToShow: 2,
    slidesToScroll:2,
    
    responsive:[
        {
            breakpoint:1280,
            settings:{
                slidesToShow: 2,
                slidesToScroll:2,
            }
        },
        {
            breakpoint:1279,
            settings:{
                slidesToShow: 2,
                slidesToScroll:2,
            }
        },
        {
            breakpoint:1024,
            settings:{
                slidesToShow: 2,
                slidesToScroll:2,
            }
        },
        {
            breakpoint:640,
            settings:{
                slidesToShow: 1,
                slidesToScroll:1,
            }
        }
    ]
}
const TestimonialFull = () => {
  return (
    <div className='text-center font-Poppins '>
    <h2 className='text-main text-center text-2xl font-Josefin'>Testimonials</h2>
    <Image src="/arrows.svg" className="m-auto " width={300} height={100} alt='arrows'/>
    <h3 className='uppercase text-2xl  font-Josefin text-main font-bold '>WHAT OUR CLIENT SAY ABOUT US</h3>
    <Slider {...settings} className='w-[90vw] m-auto'>
        {Testimonials.map((testimonial,i) => {
            return(
<aside key={i} className='p-4'>
        <div className='p-8 rounded-lg  flex max-md:flex-col lg:gap-9 lg:items-center text-center'>
            <img src={testimonial.userImg} alt={testimonial.userImg} className='object-cover h-[400px] lg:w-[250px]'/>
            <div className='text-left'>
            <span className='bg-main p-3 inline-block rounded-full'>
            <FaQuoteLeft />

            </span>
            <p>{testimonial.userMessage}</p>
            <StarRating rating={testimonial.rate}/>

            <h3 className='font-Josefin font-extrabold text-xl mt-3'>{testimonial.userName}</h3>
            </div>
        </div>
    </aside>
            )
        })}
    
    </Slider>
    </div>
  )
}

export default TestimonialFull