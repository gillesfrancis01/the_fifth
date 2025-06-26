"use client"
import React from 'react'
import Image from 'next/image'
import Slider from 'react-slick'
import { Portfolio } from '@/constants'
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"



const settings = {
    dots: true,
    infinite: true,
    speed:500,
    autoplay:false,
    autoplaySpeed:5000,
    arrows:true,
    slidesToShow: 4,
    slidesToScroll:4,
    
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
const PortfolioFull = () => {
  return (
    <div className='text-center font-Poppins '>

    <Slider {...settings} className='w-[90vw] m-auto'>
        {Portfolio.map((portfolio,i) => {
            return(
                <aside key={i}>
                <div className="p-1 rounded-lg flex flex-col lg:gap-9 lg:items-center text-center">
                <div className="relative group overflow-hidden rounded-md w-full max-w-[600px]">
  <img
    src={portfolio.image}
    alt={portfolio.image}
    className="object-cover h-[500px] w-full transform transition-transform duration-300 group-hover:scale-110"
  />

  <div className="absolute bottom-0 left-0 w-full h-1/2 bg-[#171717] bg-opacity-80 flex flex-col justify-start transition-all duration-300 translate-y-full group-hover:translate-y-0 p-6">
    <h3 className="text-left uppercase font-light text-[16px]">Porfolio</h3>
    <h3 className="font-Josefin font-extrabold text-[42px] text-main text-left">
      {portfolio.name}
    </h3>
    <h4 className="text-s text-left pt-5 flex items-center gap-2">
      Read More
      <Image src="/bi_arrow-right.png" width={18} height={18} alt="arrow" />
    </h4>
  </div>
</div>

                </div>
              </aside>
              
            )
        })}
    
    </Slider>
    </div>
  )
}

export default PortfolioFull