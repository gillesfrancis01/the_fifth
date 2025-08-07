'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface TransitionLinkProps {
  href: string
  label: string
  className?: string
  onClick?: () => void
}

const TransitionLink = ({ href, label, className = '', onClick}: TransitionLinkProps) => {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${isActive ? 'text-[#FFD700]' : 'text-main'} ${className} transition-all`}
    >
      {label}
    </Link>
  )
}

export default TransitionLink
