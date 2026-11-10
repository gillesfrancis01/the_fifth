'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import getGallery from '../../actions/getGallery'
import { Gallery } from '@/types'
import Lightbox from '@/components/ui/Lightbox'
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

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([^&?]+)/);
  if (match && match[1]) {
    // Add autoplay, mute (required for autoplay), and loop
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}&rel=0`;
  }
  return url; // return as-is if it doesn't match
}

export default function GalleryPage() {
  const [allGalleries, setAllGalleries] = useState<Gallery[]>([])
  const [activeGalleryId, setActiveGalleryId] = useState<string>('all')

  // Lightbox state: index into the currently displayed pictures
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    async function fetchGallery() {
      const data = await getGallery()
      setAllGalleries(data || [])
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

  // Get videos for banner based on selection
  const displayedVideos = React.useMemo(() => {
    if (activeGalleryId === 'all') {
      return allGalleries
        .filter(g => g.video && g.video.trim() !== '')
        .map(g => ({ url: getYouTubeEmbedUrl(g.video!), name: g.event }))
    } else {
      const gallery = allGalleries.find(g => g.$id === activeGalleryId)
      return gallery && gallery.video && gallery.video.trim() !== '' 
        ? [{ url: getYouTubeEmbedUrl(gallery.video), name: gallery.event }] 
        : []
    }
  }, [activeGalleryId, allGalleries])

  const lightboxItems = React.useMemo(
    () => displayedImages.map(i => ({ src: transformImageURL(i.url), caption: i.event })),
    [displayedImages]
  )

  return (
    <div className='min-h-screen relative pb-10'>

      {/* YouTube Video Banner */}
      {displayedVideos.length > 0 && (
        <div className="w-full mb-16">
          <div className="text-center mb-8">
            <h2 className="text-main text-center text-3xl md:text-4xl font-Josefin font-bold tracking-widest uppercase">
              Event Highlight
            </h2>
          </div>
          <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory bg-black">
            {displayedVideos.map((video, idx) => (
              <div key={idx} className="flex-none snap-center snap-always w-full h-[50vh] relative">
                <iframe
                  className="absolute inset-0 w-full h-full border-none"
                  src={video.url}
                  title={`Event Highlight ${video.name}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center mb-10 mt-16 pt-10">
        <h2 className='text-main text-center text-2xl font-Josefin'>Our Data</h2>
        <Image src="/arrows.svg" className="m-auto " width={300} height={18} alt='arrows' />
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
                    onClick={() => setLightboxIndex(index)}
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

            {/* Floating Navigation Tabs: stick to the bottom of the screen while scrolling,
                but stop above the footer instead of covering it */}
            <div className="sticky bottom-8 z-40 mx-auto mt-10 w-fit max-w-[95vw]">
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

      <Lightbox
        items={lightboxItems}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />

    </div >
  )
}
