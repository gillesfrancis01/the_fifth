'use client'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className='text-center font-Poppins p-6'>
      <h2 className='text-main text-center text-2xl font-Josefin'>The Fifth Event</h2>
      <Image src="/arrows.svg" className="m-auto" width={300} height={100} alt='arrows' />
      <p className='mt-10 leading-8 max-w-3xl mx-auto'>
        The Fifth Event is more than an event platform it’s a movement. A celebration of bold talent, cultural fusion, and unforgettable nights.
      </p>
      <p className='mt-6 leading-8 text-justify max-w-3xl mx-auto'>
        We shine a spotlight on artists from every background musicians, dancers, acrobats, magicians, and more  giving them the stage to showcase what makes them extraordinary. Our mission? To break boundaries and turn every event into a unique, immersive experience.
      </p>
      <p className='mt-6 leading-8 text-justify max-w-3xl mx-auto'>
        When you attend a Fifth Event show, you’re not just watching a performance  you’re stepping into a world of sound, movement, and imagination. Expect powerful music, mind-blowing visuals, dynamic choreography, and raw energy that fills the room.
      </p>
      <p className='mt-6 leading-8 text-justify max-w-3xl mx-auto'>
        We team up with top-tier venues, cutting-edge creators, and passionate visionaries to make every night unforgettable from the first beat to the final bow. It’s art. It’s vibe. It’s connection.
      </p>
      <p className='mt-6 leading-8 text-justify max-w-3xl mx-auto'>
        Whether you’re an art lover, a curious soul, or just looking for something real and different  The Fifth Event is for you. Follow us on social @thefifthevent_official and subscribe to our newsletter so you never miss a moment.
      </p>
      <p className='mt-6 leading-8 text-justify max-w-3xl mx-auto'>
        The Fifth Event feel it, live it, and let it inspire you.
      </p>
    </div>
  )
}
