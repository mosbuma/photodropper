'use client'

import { useRef } from 'react'
import { useAppSelector } from '@/lib/hooks'

interface MediaDisplayProps {
  onVideoEnded?: () => void
}

export default function MediaDisplay({ onVideoEnded }: MediaDisplayProps) {
  const { currentPlaylist, currentPhotoIndex } = useAppSelector(state => state.app)
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentItem = currentPlaylist?.photoStream?.[currentPhotoIndex]
  const mediaUrl = currentItem?.photoUrl
  const isVideo = currentItem?.mediaType === 'video'

  if (!mediaUrl) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-2">No Media</h2>
          <p className="text-gray-400">Upload photos or videos to get started!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="relative w-full h-full">
        {isVideo ? (
          <video
            ref={videoRef}
            key={currentItem.id}
            src={mediaUrl}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain"
            onEnded={onVideoEnded}
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={currentItem.id}
            src={mediaUrl}
            alt={`Photo ${currentPhotoIndex + 1}`}
            className="w-full h-full object-contain"
          />
        )}
      </div>
    </div>
  )
}
