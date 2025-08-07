'use client'

import React from 'react'
import { MdClose } from 'react-icons/md'
import useConstants from '@/hooks/useConstants'
import TransitionLink from './TransitionLink'
import { useLanguage } from '@/context/LanguageContext'

interface SideBarProps {
  active: boolean
  handleSetVisible: () => void
}

const SideBar = ({ active, handleSetVisible }: SideBarProps) => {
  const { t } = useLanguage()
  const { SideBarMenu } = useConstants()
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          active ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={handleSetVisible}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[80vw] sm:w-[300px] bg-[#171717] z-50 shadow-2xl transform transition-transform duration-300 ease-in-out
        ${active ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">{t('menu')}</h2>
          <button
            onClick={handleSetVisible}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Close Sidebar"
          >
            <MdClose className="text-2xl text-gray-600" />
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-4">
            {SideBarMenu.map((item) => (
              <li key={item.id}>
                <TransitionLink
                  href={item.link}
                  label={t(item.name)}
                  onClick={handleSetVisible}
                  className="block hover:text-main transition-colors font-medium"
                />
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}

export default SideBar
