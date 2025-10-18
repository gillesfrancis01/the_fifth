"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import { IoMenu } from "react-icons/io5";
import SideBar from './SideBar';
import Link from 'next/link';
import useConstants from '@/hooks/useConstants';
import FlatButton from './FlatButton';
//import { usePathname } from 'next/navigation'
import TransitionLink from './TransitionLink';
import { useLanguage, Language } from '@/context/LanguageContext';

const Header = () => {
  const [visible, setVisible] = useState(false)
  const { lang, setLang, t } = useLanguage()
  const { SideBarMenu } = useConstants()

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
  {SideBarMenu.map((item) => (
      <li key={item.id} className='mt-9'>
        <TransitionLink href={item.link} label={t(item.name)} />
      </li>
  ))}
</ul>

       <FlatButton className='max-md:hidden'><Link href="/contact">{t('contact')}</Link> </FlatButton>
       <select
        value={lang}
        onChange={e => setLang(e.target.value as Language)}
        className='border bg-black p-1 rounded ml-4'
       >
         <option value='en'>EN</option>
         <option value='fr'>FR</option>
         <option value='es'>ES</option>
       </select>
        <button className='p-3 rounded-full bg-main lg:hidden' onClick={handleSetVisible}>
        <IoMenu className='text-black text-2xl'/>

        </button>
    </section>
  )
}

export default Header
