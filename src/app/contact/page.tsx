import React from 'react'
import Image from 'next/image'

import FlatButton from '@/components/FlatButton'
import { FaLocationDot, FaPhone } from "react-icons/fa6";
import { IoMailSharp } from "react-icons/io5";


const page = () => {
  return (
    <div className='flex flex-col'>
        <div className='text-center '>
        <h2 className='text-main text-center text-2xl font-Josefin'>Contact</h2>
        <Image src="/arrows.svg" className="m-auto " width={300} height={100} alt='arrows'/>
        <h3 className='uppercase text-2xl  font-Josefin text-main font-bold '>Contact Us</h3>
        <div className='lg:flex lg:flex-row-reverse lg:text-left lg:w-[70vw] lg:justify-around'>
        <form action="" className='max-md:w-[90vw] max-md:m-auto'>
            <div className='flex gap-3 '>
                <input type="text" placeholder='Name*' className='border-b-2 w-[48%] p-5'/>
                <input type="email" placeholder='Email Adress' className='border-b-2 w-[48%] p-5'/>
            </div>
            <div className='flex gap-2 '>
                <input type="text" placeholder='Phone' className='border-b-2 w-[48%] p-5'/>
                <input type="email" placeholder='Subject' className='border-b-2 w-[48%] p-5'/>
            </div>
            <div className=''>
                <input type="email" placeholder='How can we help you? Feel free to get in touch!' className='border-b-2 w-[100%] p-5'/>
            </div>
            <div>
                <input type="checkbox" name="agreement" id="agreement" className='border-2 mt-5'/>
                <label htmlFor="agreement">I agree that my submitted data is being collected and stored.</label>
            </div>
            <FlatButton className='mt-5 '> Get In touch </FlatButton>
        </form>
        <div>
        <h4 className='mt-5 text-2xl font-bold'>Contact Details</h4>
        
        <div className='lg:flex lg:items-center lg:w-[300px] lg:gap-3'> 
        <span className='bg-main p-4 rounded-full inline-block mt-4'>
        <FaLocationDot className='text-black'/>
        </span>
        <p>785 15h Street, Office 478 Berlin, De 81566</p>
        </div>
        <div className='lg:flex lg:items-center lg:w-[300px] lg:gap-3'>
        <span className='bg-main p-4 rounded-full inline-block mt-4'>
        <IoMailSharp className='text-black'/>
        </span>
        <p>info@thefifthevent.com</p>
        </div>
        <div className='lg:flex lg:items-center lg:w-[300px] lg:gap-3'>
        <span className='bg-main p-4 rounded-full inline-block mt-4'>
        <FaPhone className='text-black'/>
        </span>
        <p>+4200 555 2569</p>
        </div>
       </div>
       </div>
       </div>
    </div>
  )
}

export default page