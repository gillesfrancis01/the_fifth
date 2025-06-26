import React, { forwardRef } from 'react'
import classNames from 'classnames'

type FlatButtonProps = {
  children: React.ReactNode
  className?: string
  rounded?: boolean
  onClick?: () => void
  borderColor?: string
  border?: number
} & React.ButtonHTMLAttributes<HTMLButtonElement>

const FlatButton = forwardRef<HTMLButtonElement, FlatButtonProps>(
  (
    {
      children,
      className = '',
      rounded = false,
      onClick,
      borderColor = 'transparent',
      border = 2,
      ...rest
    },
    ref
  ) => {
    const roundedClass = rounded ? 'rounded-full' : 'rounded-none'

    const borderClass = borderColor
      ? `border-[${border}] border-${borderColor}`
      : `border-[${border}] border-transparent`

    return (
      <button
        ref={ref}
        onClick={onClick}
        className={classNames(
          'relative inline-block p-[2px]',
          roundedClass,
          borderClass,
          className
        )}
        {...rest}
      >
        <div
          className={classNames(
            'flex items-center justify-center w-full h-full bg-black px-2 py-2',
            roundedClass
          )}
        >
          {children}
        </div>
      </button>
    )
  }
)

FlatButton.displayName = 'FlatButton'

export default FlatButton
