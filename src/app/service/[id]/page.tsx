import { services } from '@/constants'
import React from 'react'
import Image from 'next/image'
import ContactCard from '@/components/ContactCard'

const Page = async ({ params }) => {
  const { id } = await params
  const item = services.find((el) => el.id === id)

  if (!item) {
    return (
      <div className="text-red-500 p-10 text-center">
        Aucun élément trouvé pour l ID : {id}
      </div>
    )
  }

  return (
    <div className="text-white px-6 py-12 max-w-5xl mx-auto">
      <Image
        src="/arrows.svg"
        alt="arrows"
        width={300}
        height={100}
        className="mx-auto"
      />

      <h1 className="text-center uppercase text-3xl lg:text-4xl font-Josefin text-main font-extrabold mt-10">
        {item.title}
      </h1>
      <div className='lg:flex lg:flex-row '>
        <div>
      <p className="text-lg text-center mt-6 max-w-2xl mx-auto text-gray-300">
        {item.description}
      </p>

      <hr className="my-10 border-gray-700" />

      <div className="space-y-12">
        {Object.values(item.long_description).map((section, index) => (
          <div key={index}>
            <h2 className="text-xl lg:text-2xl text-main font-semibold mb-3">
              {section.title}
            </h2>
            <p className="text-gray-300 leading-relaxed">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
    <ContactCard />
    </div>
    </div>
  )
}

export default Page
