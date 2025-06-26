import React from 'react'
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa'

type Props = {
  rating: number // ex: 4.5
  outOf?: number // default = 5
}

const StarRating = ({ rating, outOf = 5 }: Props) => {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = outOf - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className="flex text-yellow-300 w-[100px] max-md:m-auto gap-1">
      {[...Array(fullStars)].map((_, i) => <FaStar key={`full-${i}`} />)}
      {hasHalfStar && <FaStarHalfAlt key="half" />}
      {[...Array(emptyStars)].map((_, i) => <FaRegStar key={`empty-${i}`} />)}
    </div>
  )
}

export default StarRating
