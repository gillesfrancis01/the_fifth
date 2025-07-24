import React from 'react'
import getNextEvent from '@/app/actions/getNextEvent'
import { formatDate, formatHour } from '@/app/actions/dateFormat'
import NextEventClient from './NextEventClient'

const NextEvent = async () => {
  const nextEvent = await getNextEvent()
  const date = formatDate(nextEvent?.date)
  const hour = formatHour(nextEvent?.date)

  return <NextEventClient nextEvent={nextEvent} date={date} hour={hour} />
}

export default NextEvent