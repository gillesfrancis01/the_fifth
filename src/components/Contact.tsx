import React from 'react'
import Image from 'next/image'
import FlatButton from './FlatButton'
import Link from 'next/link'
const Contact = () => {
  return (
    <div className='text-center font-Poppins '>
      {/* Bloc avec image de fond jusqu'au bouton */}
      <div className='relative z-0 overflow-hidden h-[400px]'>
        <img
          src="/contact-bg.jpeg"
          className="absolute inset-0 z-[-1] opacity-10 h-full w-full object-cover object-top"
          alt="background"
        />
        <div className='mt-[50px]'>
        <h2 className='text-main text-center text-2xl font-Josefin '>Contact Us</h2>
        <Image src="/arrows.svg" className="m-auto" width={300} height={100} alt="arrows" />
        <h3 className='uppercase lg:text-3xl lg:leading-16 font-Josefin text-main font-extrabold mt-10 lg:w-[50%] lg:m-auto'>
        Let’s bring your vision to life together now!         </h3>

        <FlatButton className="mt-15 w-[150px]" border={0}><Link href="/contact">Let's Talk</Link>
        </FlatButton>      </div>
      </div>
  
    </div>
  )
}

export default Contact