// Exemple TransitionLink.tsx
import Link from 'next/link'

const TransitionLink = ({
  href,
  label,
  className = '',
}: {
  href: string
  label: string
  isActive?: boolean
  className?: string
}) => {
  return (
    <Link href={href} className={`${className} transition-all`}>
      {label}
    </Link>
  )
}

export default TransitionLink
