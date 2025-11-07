'use client'

import Image from 'next/image'
import { Event } from '@/components/Event'
import { useLanguage } from '@/context/LanguageContext'
import { events } from '@/types'

interface NextEventClientProps {
  nextEvent: events | null
  date: string
}

const NextEventClient = ({ nextEvent, date }: NextEventClientProps) => {
  const { t } = useLanguage()

  if (!nextEvent) {
    return (
      <div className='text-center mt-9'>
        <h2 className='text-main text-2xl font-Josefin'>{t('whatWeDo')}</h2>
        <Image src='/arrows.svg' className='m-auto' width={300} height={100} alt='arrows' />
        <h3 className='uppercase text-2xl font-Josefin text-main font-bold'>{t('nextEvent')}</h3>
        <p>{t('noNextEvent')}</p>
      </div>
    )
  }

  return (
    <div className='text-center mt-9'>
      <h2 className='text-main text-center text-2xl font-Josefin'>{t('whatWeDo')}</h2>
      <Image src='/arrows.svg' className='m-auto ' width={300} height={100} alt='arrows' />
      <h3 className='uppercase text-2xl  font-Josefin text-main font-bold '>{t('nextEvent')}</h3>
      <Event event={nextEvent} date={date}/>
    </div>
  )
}

export default NextEventClient
