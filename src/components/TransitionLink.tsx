'use client'

import Link from 'next/link'

interface TransitionLinkProps {
  href: string
  label: string
  className?: string
  onClick?: () => void
}

const TransitionLink = ({ href, label, className = '', onClick}: TransitionLinkProps) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${className} transition-all`}
      
    >
      {label}
    </Link>
  )
}

export default TransitionLink
