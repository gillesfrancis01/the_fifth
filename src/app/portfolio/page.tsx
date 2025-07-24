'use client'
import React from 'react'
import Image from 'next/image'
import { Portfolio } from '@/constants'

import PortfolioList from '@/components/PortfolioList'
import { useLanguage } from '@/context/LanguageContext'
const Page = () => {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col bg-[url('/bg-logo-the-fifth.png')] bg-size-[90vw] bg-no-repeat bg-center">
        <div className='text-center '>
        <h2 className='text-main text-center text-2xl font-Josefin'>{t('ourPortfolio')}</h2>
        <Image src="/arrows.svg" className="m-auto " width={300} height={100} alt='arrows'/>
        <h3 className='uppercase text-2xl  font-Josefin text-main font-bold '>{t('portfolioTagline')}</h3>
       </div>
       {Portfolio.map((item,index)=>[
        <PortfolioList portfolio={item} key={item.id} reverse={index % 2 !== 0}/>
       ])}
    </div>
  )
}

export default Page