'use client'

import React from 'react'
import { MdChevronLeft, MdChevronRight } from 'react-icons/md'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

type PageItem = number | 'gap-start' | 'gap-end'

// 1 … 4 [5] 6 … 20: always the first, last and current pages, plus one neighbour each side.
function getPageItems(page: number, totalPages: number): PageItem[] {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1])
  const pages = [...wanted].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)

  const items: PageItem[] = []
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) {
      items.push(p - pages[i - 1] === 2 ? p - 1 : i === 1 ? 'gap-start' : 'gap-end')
    }
    items.push(p)
  })
  return items
}

const baseButton =
  'flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E6C55D] disabled:cursor-not-allowed disabled:opacity-30'

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className={`${baseButton} bg-white/10 text-white hover:bg-white/20`}
      >
        <MdChevronLeft className="text-2xl" />
      </button>

      {/* Small screens: not enough room for the numbers */}
      <span className="px-3 text-sm tracking-widest text-white/70 sm:hidden" aria-live="polite">
        {page} / {totalPages}
      </span>

      <div className="hidden items-center gap-2 sm:flex">
        {getPageItems(page, totalPages).map((item) =>
          typeof item === 'number' ? (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-label={`Page ${item}`}
              aria-current={item === page ? 'page' : undefined}
              className={`${baseButton} ${
                item === page ? 'bg-main text-black' : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item}
            </button>
          ) : (
            <span key={item} className="px-1 text-white/40" aria-hidden="true">
              …
            </span>
          )
        )}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        className={`${baseButton} bg-white/10 text-white hover:bg-white/20`}
      >
        <MdChevronRight className="text-2xl" />
      </button>
    </nav>
  )
}
