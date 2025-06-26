import React from 'react'
import Image from 'next/image'
import getNextEvent from '@/app/actions/getNextEvent';
import { Event } from '@/components/Event'
import { formatDate, formatHour } from '@/app/actions/dateFormat';

const NextEvent = async () => {
    const nextEvent = await getNextEvent();
    const date = formatDate(nextEvent?.date)
    const hour = formatHour(nextEvent?.date)
    if (!nextEvent) {
        return (
          <div className="text-center mt-9">
            <h2 className="text-main text-2xl font-Josefin">What we do</h2>
            <Image src="/arrows.svg" className="m-auto" width={300} height={100} alt="arrows" />
            <h3 className="uppercase text-2xl font-Josefin text-main font-bold">Next Event</h3>
            <p>No next event</p>
          </div>
        )
      }
    
  return (
    <div className='text-center mt-9'>
      <h2 className='text-main text-center text-2xl font-Josefin'>What we do</h2>
        <Image src="/arrows.svg" className="m-auto " width={300} height={100} alt='arrows'/>
        <h3 className='uppercase text-2xl  font-Josefin text-main font-bold '>Next Event</h3>
        <Event event={nextEvent} date={date} hour={hour} />

    </div>
  )
}

export default NextEvent