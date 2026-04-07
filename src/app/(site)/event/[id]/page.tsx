import getAllTickets from '@/app/actions/getAllTickets'
import getSingleEvent from '@/app/actions/getSingleEvent'
import React from 'react'

import EventPage from '@/components/EventPage';


const Page = async ({ params }) => {
  const {id} = await params
  const event = await getSingleEvent(id)
  const tickets = await getAllTickets(id)
  const sortedTickets = tickets.sort((a, b) => a.price - b.price)

  
  if (!event) {
    return <h1 className="text-center">Event not Found</h1>
  }

  return (
    <div>
      <EventPage event={event} tickets={sortedTickets} />
    </div>
  )
}

export default Page
