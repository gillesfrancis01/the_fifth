import React from 'react'
import Image from 'next/image'
import FlatButton from './FlatButton'
import { services } from '@/constants'
import { Services } from './Services'
import { Separator } from './Separator'

const About = () => {
  return (
    <div className='text-center font-Poppins'>
      
      {/* Bloc avec image de fond jusqu'au bouton */}
      <div className='relative z-0 overflow-hidden h-[600px]'>
        <img
          src="/about-bg.jpeg"
          className="absolute inset-0 z-[-1] opacity-10 h-full w-full object-cover object-top"
          alt="background"
        />
        <div className='mt-[100px]'>
        <h2 className='text-main text-center text-2xl font-Josefin '>About Us</h2>
        <Image src="/arrows.svg" className="m-auto" width={300} height={100} alt="arrows" />
        <h3 className='uppercase lg:text-3xl lg:leading-16 font-Josefin text-main font-extrabold mt-10 lg:w-[50%] lg:m-auto'>
  Inspiring Events, Lasting Impressions, Let&rsquo;s Write Your Story
</h3>

        <p className='w-[95vw] m-auto lg:w-[50%] lg:leading-8'>
          Join us as we take you behind the scenes of our spectacular events, showcasing the magic we create from concept to execution. From elegant weddings to corporate galas and everything in between, our channel offers expert tips, creative inspiration, and captivating event recaps that will leave you inspired to host your own unforgettable gatherings.
        </p>
        <FlatButton className="mt-5 z-10 relative" border={0}>Learn More</FlatButton>
      </div>
      </div>
      
 <Separator/>
      <div className="relative z-10 bg-[url('/bg-logo.png')] bg-size-[100px]">
        {services.map((item) => (
          <Services item={item} key={item.id} />
        ))}
      </div>
      <Separator />

    </div>
  )
}

export default About
