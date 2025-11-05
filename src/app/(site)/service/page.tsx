import React from 'react'
import NextEvent from '@/components/NextEvent'
import PortfolioFull from '@/components/PortfolioFull'
import ServicesHeader from '@/components/ServicesHeader'

const page = () => {
  return (
    <div className='flex flex-col'>
        <ServicesHeader />
        <PortfolioFull />
        <NextEvent />
    </div>
  )
}

export default page