'use client'

import TickerRow from './TickerRow'
import type { CommentStreamItem } from '@/lib/slices/appSlice'

interface TickerProps {
  photoComments: CommentStreamItem[]
  eventComments: CommentStreamItem[]
}

export default function Ticker({ photoComments, eventComments, speed }: TickerProps) {
  const hasPhotoComments = photoComments.length > 0
  const hasEventComments = eventComments.length > 0

  const photoTickerScrollSpeed = 75
  const eventTickerScrollSpeed = 25

  // Don't render if no comments
  if (!hasPhotoComments && !hasEventComments) {
    return null
  }

  return (
    <div className="fixed bottom-6 left-1/4 w-1/2 h-auto z-50 bg-transparent rounded-sm flex flex-col" style={{minHeight: '144px'}}>
      <div className="max-w-7xl mx-auto w-full">
        {/* Comments Row */}
        {hasPhotoComments && (
          <div>
            <TickerRow 
              comments={photoComments}
              scrollSpeed={photoTickerScrollSpeed}
              className="text-base bg-blue-900 text-white p-4 font-bold"
              extraStyle={{
                fontSize: '48px',
              }}
            />
          </div>
        )}
        {hasEventComments && (
          <div>
            <TickerRow 
              comments={eventComments}
              scrollSpeed={eventTickerScrollSpeed}
              className="text-base bg-white text-black p-4 font-bold"
              extraStyle={{
                fontSize: '48px',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
} 