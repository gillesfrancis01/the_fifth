'use client'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className='text-center font-Poppins p-6'>
      <h2 className='text-main text-center text-2xl font-Josefin'>F-JAY&apos;S EVENTS</h2>
      <Image src="/arrows.svg" className="m-auto" width={300} height={100} alt='arrows' />
      <p className='mt-10 leading-8 max-w-3xl mx-auto'>
        F-JAY&apos;S EVENTS: A platform that promotes diverse artists and one-of-a-kind events!
      </p>
      <p className='mt-6 leading-8 text-justify max-w-3xl mx-auto'>
        Dear lovers of the arts and unique experiences, We are delighted to present F-JAY&apos;S EVENTS, a platform dedicated to promoting artists from every background and creating unforgettable nights. At F-JAY&apos;S EVENTS we firmly believe that artistic diversity is something to celebrate, and we strive to offer extraordinary experiences.
      </p>
      <p className='mt-6 leading-8 text-justify max-w-3xl mx-auto'>
        Our goal is to showcase the wide range of artistic talent from around the world&mdash;musicians, dancers, singers, magicians, acrobats and more&mdash;offering them a platform to express their creativity. We continually scout new talent and support them throughout their artistic journey so they can reach new heights.
      </p>
      <p className='mt-6 leading-8 text-justify max-w-3xl mx-auto'>
        Events hosted by F-JAY&apos;S EVENTS are far more than simple shows. They are designed to take you on a journey through captivating performances: prodigious musicians immersing you in mesmerizing melodies, dancers pushing their bodies with grace and flexibility, and gravity-defying circus artists. We promise an eclectic blend of talent.
      </p>
      <p className='mt-6 leading-8 text-justify max-w-3xl mx-auto'>
        But our events go beyond what happens on stage. We craft immersive experiences using stunning visuals, creative sets and a unique vibe so you can enjoy an exceptional moment. Let the magic, raw energy and electrifying atmosphere sweep you away.
      </p>
      <p className='mt-6 leading-8 text-justify max-w-3xl mx-auto'>
        We partner with prestigious venues, renowned event organizers and visionary companies to ensure every night is exceptional from start to finish. Our passionate team works hard to create a welcoming, inclusive environment where everyone feels at ease and ready to enjoy art in all its forms.
      </p>
      <p className='mt-6 leading-8 text-justify max-w-3xl mx-auto'>
        Stay tuned for upcoming events by subscribing to our newsletter and following us on social media [@f_jaysevents_official]. Don&apos;t miss the chance to explore, discover and celebrate the variety of artistic talents showcased at F-JAY&apos;S EVENTS.
      </p>
      <p className='mt-6 leading-8 text-justify max-w-3xl mx-auto'>
        F-JAY&apos;S EVENTS: Feel, appreciate and let yourself be inspired by the extraordinary lineup of artists lighting up our nights!
      </p>
    </div>
  )
}