'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import getAllEvents from '../../actions/getAllEvent'
import { events } from '@/types'
import { Event } from '@/components/Event'
import { CiSearch } from "react-icons/ci"
import { formatDate, formatHour, getComparableEventDate } from '../../actions/dateFormat'

export default function Events() {
  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [allEvents, setAllEvents] = useState<events[]>([])
  const [filteredEvents, setFilteredEvents] = useState<events[]>([])

  useEffect(() => {
    async function fetchEvents() {
      const data = await getAllEvents()
      setAllEvents(data || [])
      setFilteredEvents(data || [])
    }
    fetchEvents()
  }, [])

  useEffect(() => {
    const filtered = allEvents.filter(event => {
      const matchSearch = event.name.toLowerCase().includes(search.toLowerCase())

      const normalizedEventDate = getComparableEventDate(event.date)

      const matchDate = selectedDate
        ? normalizedEventDate
          ? normalizedEventDate === selectedDate
          : true
        : true

      const matchLocation = selectedLocation
        ? event.adresse?.toLowerCase().includes(selectedLocation.toLowerCase())
        : true

      return matchSearch && matchDate && matchLocation
    })

    setFilteredEvents(filtered)
  }, [search, selectedDate, selectedLocation, allEvents])

  return (
    <div className='text-center'>
      <h2 className='text-main text-center text-2xl font-Josefin'>Event</h2>
      <Image src="/arrows.svg" className="m-auto " width={300} height={100} alt='arrows' />
      <h3 className='uppercase text-2xl font-Josefin text-main font-bold'>Our events</h3>

      {/* Search Bar */}
      <div className='flex flex-col mt-10'>
        <div className='flex justify-between p-[2px] w-[60vw] border-1 border-main rounded-sm lg:m-auto'>
          <input
            type="text"
            className='w-[40%]'
            placeholder='Search'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className='text-main p-1 flex items-center gap-1 border-1 border-main'>
            <CiSearch className='text-yellow-400' /> Find Events
          </button>
        </div>

        {/* Filters */}
        <div className='lg:flex lg:w-[80vw] lg:m-auto'>
          <div className='flex max-md:justify-between w-[90vw] m-auto mt-5 items-center gap-2'>
            <p>Date</p>
            <input
              type="date"
              className='border-1 border-main p-1 w-[60%]'
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className='flex max-md:justify-between w-[90vw] m-auto mt-5 items-center gap-2'>
            <p>Location</p>
            <select
              className='border-1 border-main p-1 w-[60%]'
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              {[...new Set(allEvents.map(e => e.adresse))].map((loc, idx) => (
                <option key={idx} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Event List */}
      <div className='flex flex-col mt-10'>
        {allEvents.length === 0 ? (
          <p className="text-gray-500">Aucun événement n’est actuellement disponible.</p>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((item) => {
            const date = formatDate(item.date)
            return (
              <div key={item.$id} className='mt-20'>
                <Event event={item} date={date}  />
              </div>
            )
          })
        ) : (
          <p className="text-gray-500">Aucun événement ne correspond à vos critères de recherche.</p>
        )}
      </div>
    </div>
  )
}
