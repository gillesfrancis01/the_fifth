"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import { IoMenu } from "react-icons/io5";
import SideBar from './SideBar';
import Link from 'next/link';
import { SideBarMenu } from '@/constants';
import FlatButton from './FlatButton';
//import { usePathname } from 'next/navigation'
import TransitionLink from './TransitionLink';

const Header = () => {
  const [visible, setVisible] = useState(false)

  const handleSetVisible = () => {
        setVisible(!visible)
        console.log(visible)
  }
  //const pathname = usePathname()

  return (
    <section className='relative flex lg:space-arround items-center justify-between w-[90vw] m-auto '>
       <SideBar active={visible} handleSetVisible = {handleSetVisible}/>
       <Link href="/"><Image src="/logo.png" alt='logo-the-fifth' width={100} height={100}/></Link> 
       <ul className='flex gap-10 max-md:hidden'>
  {SideBarMenu.map((item) => {
    //const isActive = pathname === item.link

    return (
      <li key={item.id} className='mt-9'>
        <TransitionLink href={item.link} label={item.name} />
       
      </li>
    )
  })}
</ul>

       <FlatButton className='max-md:hidden'><Link href="/contact">Contact Us</Link> </FlatButton>
        <button className='p-3 rounded-full bg-main lg:hidden' onClick={handleSetVisible}>
        <IoMenu className='text-black text-2xl'/>

        </button>
    </section>
  )
}

export default Header