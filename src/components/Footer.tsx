import React from 'react'
import Image from 'next/image'
import { BsYoutube } from 'react-icons/bs'
import { FaFacebookF, FaXTwitter } from 'react-icons/fa6'
import { SideBarMenu } from '@/constants'
import Link from 'next/link'
import Suscribe from './Suscribe'
export const Footer = () => {
  return (
    <div>
    <div className='max-md:text-center mt-32 lg:flex lg:w-[80vw] lg:m-auto lg:mt-32 lg:justify-between'>
      <div className='lg:w-[30%]'>
        <h3 className='max-md:uppercase  text-4xl  font-Josefin text-main font-bold '>Crafting 
        Extraordinary Events Together</h3>
        <p className='max-md:w-[70vw] m-auto'>From concept to celebration, we bring your vision to life with precision, passion, and a touch of luxury. Let’s make every moment unforgettable.</p>
        <div className='flex text-3xl mb-10 gap-5 w-40 max-md:m-auto mt-10 '>
       <div className='p-2  bg-white text-black rounded-full '><FaFacebookF /> </div> 
       <div className='p-2  bg-white/10  rounded-full'> <FaXTwitter /> </div> 
       <div className='p-2  bg-white text-black rounded-full'> <BsYoutube /> </div> 

       </div>
      </div>
      <div>
        <h2 className='font-Josefin text-main text-3xl'>Links</h2>
        <ul className='text-xl '>
          {SideBarMenu.map((item) => (
            <li key={item.id} className='py-3'><Link href={item.link}>{item.name}</Link></li>
          ))}
        </ul>
      </div>
      <Suscribe />

    </div>
    <div className='flex justify-between p-1 bg-[#262626] items-center px-14'>
       <Link href="/"><Image src="/logo.png" alt='logo-the-fifth' width={100} height={100}/></Link> 
       <Link href="https://arnoldadadjissoportfolio.bit-technology.ca/">Made By Bit-Technology/kokouvi</Link>
       </div>
    </div>
  )
}
