'use client'

import React, { useState } from 'react'
import { ImageProps } from 'next/image'

interface HeicImageProps extends Omit<ImageProps, 'src'> {
    src: string
    onImageReady?: () => void
}

export default function HeicImage({ src, alt, onImageReady, ...props }: HeicImageProps) {
    const [isLoading, setIsLoading] = useState(true)

    const handleLoad = () => {
        setIsLoading(false)
        if (onImageReady) onImageReady()
    }

    return (
        <div className={`relative ${props.className}`} style={props.style}>
            {isLoading && (
                <div className="absolute inset-0 bg-gray-800 animate-pulse" style={{ minHeight: '200px' }} />
            )}
            <img
                src={src}
                alt={alt}
                className={`${props.className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
                style={props.style}
                loading="eager"
                onLoad={handleLoad}
                onError={(e) => {
                    // Fallback or retry logic could go here
                    // console.error("Image failed to load", src)
                    handleLoad() // Mark as ready even if failed so loader doesn't hang
                }}
            />
        </div>
    )
}
