'use client'

import React from 'react'
import Image from 'next/image'
import { services } from '@/constants'
import { Services } from './Services'
import { useLanguage } from '@/context/LanguageContext'

const ServicesHeader = () => {
  const { t } = useLanguage()
  return (
    <div className='text-center '>
      <h2 className='text-main text-center text-2xl font-Josefin'>{t('whatWeDo')}</h2>
      <Image src="/arrows.svg" className="m-auto " width={300} height={100} alt='arrows'/>
      <h3 className='uppercase text-2xl  font-Josefin text-main font-bold '>{t('fullServiceEventProduction')}</h3>
      {services.map((item) => (
        <Services key={item.id} item={item} />
      ))}
    </div>
  )
}

export default ServicesHeader
