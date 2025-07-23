import React from 'react'
import Image from 'next/image'
import getNextEvent from '@/app/actions/getNextEvent'
import { Event } from '@/components/Event'
import { formatDate, formatHour } from '@/app/actions/dateFormat'
import { useLanguage } from '@/context/LanguageContext'

interface NextEventClientProps {
  nextEvent: Awaited<ReturnType<typeof getNextEvent>> | null
  date: string
  hour: string
}

const NextEventClient = ({ nextEvent, date, hour }: NextEventClientProps) => {
  'use client'
  const { t } = useLanguage()

  if (!nextEvent) {
    return (
      <div className="text-center mt-9">
        <h2 className="text-main text-2xl font-Josefin">{t('whatWeDo')}</h2>
        <Image src="/arrows.svg" className="m-auto" width={300} height={100} alt="arrows" />
        <h3 className="uppercase text-2xl font-Josefin text-main font-bold">{t('nextEvent')}</h3>
        <p>{t('noNextEvent')}</p>
      </div>
    )
  }

  return (
    <div className="text-center mt-9">
      <h2 className="text-main text-center text-2xl font-Josefin">{t('whatWeDo')}</h2>
      <Image src="/arrows.svg" className="m-auto " width={300} height={100} alt="arrows" />
      <h3 className="uppercase text-2xl  font-Josefin text-main font-bold ">{t('nextEvent')}</h3>
      <Event event={nextEvent} date={date} hour={hour} />
    </div>
  )
}

const NextEvent = async () => {
  const nextEvent = await getNextEvent()
  const date = formatDate(nextEvent?.date)
  const hour = formatHour(nextEvent?.date)

  return <NextEventClient nextEvent={nextEvent} date={date} hour={hour} />
}

export default NextEvent