import React from 'react'
import Link from 'next/link'
import classNames from 'classnames'

type CtaLinkProps = {
  href: string
  children: React.ReactNode
  className?: string
  variant?: 'solid' | 'outline'
}

const variants = {
  solid:
    'bg-main text-black shadow-[0_12px_35px_-12px_rgba(201,161,77,0.75)] hover:brightness-110',
  outline:
    'border border-[#E6C55D] text-[#E6C55D] hover:bg-[rgba(230,197,93,0.12)]',
}

// Gold call-to-action style: reads clearly on the site's black background.
// Shared with submit buttons, which can't be a Link.
export function ctaClassName(variant: 'solid' | 'outline' = 'solid', className?: string) {
  return classNames(
    'inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
    variants[variant],
    className
  )
}

// The whole pill is clickable (unlike a Link nested in FlatButton).
const CtaLink = ({ href, children, className, variant = 'solid' }: CtaLinkProps) => (
  <Link href={href} className={ctaClassName(variant, className)}>
    {children}
  </Link>
)

export default CtaLink
