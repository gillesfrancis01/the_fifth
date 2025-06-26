"use client"
import { SideBarMenu } from '@/constants'
import React from 'react'
import { MdClose } from "react-icons/md";
import TransitionLink from './TransitionLink';


const SideBar = ({active, handleSetVisible} : {active: boolean, handleSetVisible: any}) => {
    const sidebarstate = active ? 'sidebar-active' : 'hidden'
    
  return (
    <div className= {`${sidebarstate}`}>
        <button className='p-1 border-1 border-solid border-white rounded-full' onClick={handleSetVisible}><MdClose className='text-4xl'/></button>
        <ul>
     {SideBarMenu.map((item)=>(
            <li key={item.id} className='mt-9'><TransitionLink href={item.link} label={item.name} isActive={false} /></li>
        ))
     }
     </ul>
    </div>
  )
}

export default SideBar