import React from 'react'
import Image from 'next/image'
import { Portfolio } from '@/constants'

import PortfolioList from '@/components/PortfolioList'
const page = () => {
  return (
    <div className='flex flex-col'>
        <div className='text-center '>
        <h2 className='text-main text-center text-2xl font-Josefin'>Our Portfolio</h2>
        <Image src="/arrows.svg" className="m-auto " width={300} height={100} alt='arrows'/>
        <h3 className='uppercase text-2xl  font-Josefin text-main font-bold '>From Concept to Celebration, Where Your Dreams Take Center Stage</h3>
       </div>
       {Portfolio.map((item,index)=>[
        <PortfolioList portfolio={item} key={item.id} reverse={index % 2 !== 0}/>
       ])}
    </div>
  )
}

export default page