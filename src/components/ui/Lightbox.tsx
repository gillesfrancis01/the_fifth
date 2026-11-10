'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MdClose, MdChevronLeft, MdChevronRight } from 'react-icons/md'

export interface LightboxItem {
  src: string
  caption?: string
}

interface LightboxProps {
  items: LightboxItem[]
  /** Index of the displayed item, or null when closed. */
  index: number | null
  onClose: () => void
  onIndexChange: (index: number) => void
}

const SWIPE_THRESHOLD = 50

// Owns its own loading state: re-mounted (via `key`) for every picture, so
// each one shows a spinner and fades in instead of popping.
function LightboxImage({ src, alt }: { src: string; alt: string }) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  return (
    <>
      {state === 'loading' && (
        <div
          className="absolute h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#E6C55D]"
          role="status"
          aria-label="Loading"
        />
      )}
      {state === 'error' ? (
        <p className="text-sm text-white/60">This image could not be loaded.</p>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          draggable={false}
          onLoad={() => setState('ready')}
          onError={() => setState('error')}
          className={`max-h-full max-w-full select-none object-contain shadow-2xl transition-opacity duration-300 ${
            state === 'ready' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </>
  )
}

export default function Lightbox({ items, index, onClose, onIndexChange }: LightboxProps) {
  const touchStartX = useRef<number | null>(null)
  const isOpen = index !== null && items[index] !== undefined
  const total = items.length

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return
      onIndexChange((next + total) % total)
    },
    [total, onIndexChange]
  )

  // Keyboard: ← → to navigate, Esc to close. Also lock the page scroll.
  useEffect(() => {
    if (!isOpen || index === null) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') goTo(index - 1)
      else if (e.key === 'ArrowRight') goTo(index + 1)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, index, goTo, onClose])

  // Preload the neighbours so next/previous feel instant.
  useEffect(() => {
    if (!isOpen || index === null || total < 2) return
    for (const i of [index + 1, index - 1]) {
      const preloaded = new window.Image()
      preloaded.src = items[(i + total) % total].src
    }
  }, [isOpen, index, items, total])

  if (!isOpen || index === null) return null

  const item = items[index]

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return
    goTo(deltaX > 0 ? index - 1 : index + 1)
  }

  const iconButton =
    'flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E6C55D]'

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.caption ? `${item.caption}, photo ${index + 1} of ${total}` : `Photo ${index + 1} of ${total}`}
      className="fixed inset-0 z-[10000] flex flex-col bg-black/95 backdrop-blur-sm"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX
      }}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-8">
        <div className="min-w-0">
          {item.caption && <p className="truncate font-Josefin text-lg text-main">{item.caption}</p>}
          <p className="text-xs tracking-widest text-white/60">
            {index + 1} / {total}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className={iconButton}>
          <MdClose className="text-2xl" />
        </button>
      </div>

      {/* Picture: clicking the empty area around it closes the viewer */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6 md:px-20"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <LightboxImage key={item.src} src={item.src} alt={item.caption ?? `Photo ${index + 1}`} />

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous photo"
              className={`${iconButton} absolute left-2 top-1/2 -translate-y-1/2 md:left-6`}
            >
              <MdChevronLeft className="text-3xl" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next photo"
              className={`${iconButton} absolute right-2 top-1/2 -translate-y-1/2 md:right-6`}
            >
              <MdChevronRight className="text-3xl" />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
