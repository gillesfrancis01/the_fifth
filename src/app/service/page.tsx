import React from 'react'
import Image from 'next/image'
import {  services } from '@/constants'
import { Services } from '@/components/Services'
import NextEvent from '@/components/NextEvent'
import PortfolioFull from '@/components/PortfolioFull'
const page = () => {
  return (
    <div className='flex flex-col'>
        <div className='text-center '>
        <h2 className='text-main text-center text-2xl font-Josefin'>What we do</h2>
        <Image src="/arrows.svg" className="m-auto " width={300} height={100} alt='arrows'/>
        <h3 className='uppercase text-2xl  font-Josefin text-main font-bold '>Full-service event production</h3>
        {services.map((item)=>(
            <Services key={item.id} item={item} />
        ))}
        </div>
         

        <PortfolioFull />
        <NextEvent />
    </div>
  )
}

export default page