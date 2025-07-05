'use client'

import { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setCurrentPhotoIndex } from '@/lib/slices/appSlice'

export default function ImageDisplay() {
  const dispatch = useAppDispatch()
  const { currentPlaylist, currentPhotoIndex } = useAppSelector(state => state.app)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Auto-advance slideshow
  useEffect(() => {
    if (!currentPlaylist?.photoStream || currentPlaylist.photoStream.length === 0) {
      return
    }

    const interval = setInterval(() => {
      const nextIndex = (currentPhotoIndex + 1) % currentPlaylist.photoStream.length
      setIsTransitioning(true)
      
      setTimeout(() => {
        dispatch(setCurrentPhotoIndex(nextIndex))
        setIsTransitioning(false)
      }, 500) // Transition duration
    }, 5000) // Default 5 seconds per photo

    return () => clearInterval(interval)
  }, [currentPhotoIndex, currentPlaylist, dispatch])

  const photoUrl = currentPlaylist?.photoStream?.[currentPhotoIndex]?.photoUrl
  if (!photoUrl) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-2">No Photos</h2>
          <p className="text-gray-400">Upload some photos to get started!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className={`relative w-full h-full transition-opacity duration-500 ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={`Photo ${currentPhotoIndex}`}
          className="w-full h-full object-contain"
        />
        
        {/* Photo info overlay */}
        {/* <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-3 py-2 rounded">
          <p className="text-sm">
            Photo {currentPhotoIndex + 1} of {currentPlaylist?.photoStream?.length || 0}
          </p>
          {currentPlaylist?.photoStream?.[currentPhotoIndex]?.uploaderName && (
            <p className="text-xs text-gray-300">by {currentPlaylist?.photoStream?.[currentPhotoIndex]?.uploaderName || 'Unknown'}</p>
          )}
        </div> */}
      </div>
    </div>
  )
} 