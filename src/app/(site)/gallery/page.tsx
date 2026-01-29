'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import getGallery from '../../actions/getGallery'
import { Gallery } from '@/types'
import Modal from '@/components/ui/Modal'
import HeicImage from '@/components/ui/HeicImage'

const transformImageURL = (url: string) => {
  if (url.startsWith('http')) {
    return url;
  }
  // Construct the Appwrite storage URL
  // We use the event bucket by default as per the plan, assuming images resolve there
  const endpoint = process.env.NEXT_PUBLIC_ENDPOINT;
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKETS_EVENT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;

  if (endpoint && bucketId && projectId) {
    return `${endpoint}/storage/buckets/${bucketId}/files/${url}/view?project=${projectId}&mode=admin`;
  }

  return url;
}

export default function GalleryPage() {
  const [allGalleries, setAllGalleries] = useState<Gallery[]>([])
  const [activeGalleryId, setActiveGalleryId] = useState<string>('all')

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])

  useEffect(() => {
    async function fetchGallery() {
      const data = await getGallery()
      setAllGalleries(data)
    }
    fetchGallery()
  }, [])

  // Flatten images if "all" is selected, or pick specific gallery
  const displayedImages = React.useMemo(() => {
    if (activeGalleryId === 'all') {
      // Collect all images from all galleries
      // We might want to shuffle them or just list them
      return allGalleries.flatMap(g => g.images.map(img => ({ url: img, event: g.event })))
    } else {
      const gallery = allGalleries.find(g => g.$id === activeGalleryId)
      return gallery ? gallery.images.map(img => ({ url: img, event: gallery.event })) : []
    }
  }, [activeGalleryId, allGalleries])

  // Update lightbox images when selection changes or user clicks an image
  // Actually, we should set the lightbox context to the currently displayed list

  const handleImageClick = (index: number) => {
    setLightboxImages(displayedImages.map(i => i.url))
    setLightboxIndex(index)
  }

  // Handlers for Lightbox navigation
  const handlePrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : lightboxImages.length - 1))
    }
  }

  const handleNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev! < lightboxImages.length - 1 ? prev! + 1 : 0))
    }
  }


  return (
    <div className='min-h-screen py-10 relative pb-32'>

      <div className="text-center mb-10">
        <h2 className='text-main text-center text-2xl font-Josefin'>Our Data</h2>
        <Image src="/arrows.svg" className="m-auto " width={300} height={100} alt='arrows' />
        <h3 className='uppercase text-2xl font-Josefin text-main font-bold'>Inspirations</h3>
      </div>

      {
        allGalleries.length === 0 ? (
          <div className="text-center text-gray-500 py-20">Loading Gallery...</div>
        ) : (
          <>
            {/* Masonry Grid */}
            <div className="w-[95vw] max-w-[1600px] m-auto px-2">
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                {displayedImages.map((item, index) => (
                  <div
                    key={`${item.url}-${index}`}
                    className="break-inside-avoid relative group cursor-pointer overflow-hidden rounded-lg bg-gray-900 border border-white/5 mb-4"
                    onClick={() => handleImageClick(index)}
                  >
                    <HeicImage
                      src={transformImageURL(item.url)}
                      alt={`${item.event} - ${index}`}
                      className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4">
                      <span className="text-white font-Josefin text-lg mb-2">{item.event}</span>
                      <span className="text-main font-bold tracking-widest uppercase text-xs border border-main px-3 py-1 bg-black/70">View</span>
                    </div>
                  </div>
                ))}
              </div>

              {displayedImages.length === 0 && (
                <div className="text-center text-gray-400 py-20">No images found</div>
              )}
            </div>

            {/* Floating Navigation Tabs */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 max-w-[95vw]">
              <div className="flex flex-nowrap overflow-x-auto gap-2 p-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl items-center no-scrollbar">
                <button
                  onClick={() => setActiveGalleryId('all')}
                  className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all duration-300
                      ${activeGalleryId === 'all'
                      ? 'bg-white text-black shadow-lg scale-105'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                >
                  View All
                </button>
                <div className="w-[1px] h-6 bg-white/20 mx-1"></div>
                {allGalleries.map((gallery) => (
                  <button
                    key={gallery.$id}
                    onClick={() => setActiveGalleryId(gallery.$id)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-300
                      ${activeGalleryId === gallery.$id
                        ? 'bg-main text-black shadow-[0_0_10px_rgba(201,161,77,0.4)]'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    {gallery.event}
                  </button>
                ))}
              </div>
            </div>
          </>
        )
      }

      {/* Lightbox Modal */}
      <Modal
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        title={lightboxIndex !== null ? /* lightboxImages[lightboxIndex] (We don't have title easily here, maybe optional) */ "Gallery" : ""}
        description={`${(lightboxIndex || 0) + 1} / ${lightboxImages.length}`}
      >
        {lightboxIndex !== null && (
          <div className="relative w-full h-[60vh] flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              <HeicImage
                src={transformImageURL(lightboxImages[lightboxIndex])}
                alt="Lightbox"
                className="max-h-full max-w-full object-contain shadow-2xl"
              />
            </div>

            {/* Navigation Arrows */}
            {lightboxImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  className="absolute -left-4 md:left-0 p-4 bg-black/20 hover:bg-black/60 text-white rounded-r-lg transition-all text-2xl h-full flex items-center"
                >
                  &#10094;
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="absolute -right-4 md:right-0 p-4 bg-black/20 hover:bg-black/60 text-white rounded-l-lg transition-all text-2xl h-full flex items-center"
                >
                  &#10095;
                </button>
              </>
            )}
          </div>
        )}
      </Modal>

    </div >
  )
}
