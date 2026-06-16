'use client'

import { useMemo } from 'react'
import TickerRow from './TickerRow'
import type { CommentStreamItem } from '@/lib/slices/appSlice'

interface TickerProps {
  eventId?: string
  photoId?: string
  photoComments: CommentStreamItem[]
  eventComments: CommentStreamItem[]
  scrollSpeedPct?: number
  enablePhotoComments?: boolean
  enableEventComments?: boolean
}

export default function Ticker({
  eventId,
  photoId,
  photoComments,
  eventComments,
  scrollSpeedPct = 50,
  enablePhotoComments = true,
  enableEventComments = false,
}: TickerProps) {
  const photoTickerStyle = useMemo(
    () => ({ fontSize: '48px', lineHeight: '1.1' as const }),
    []
  )
  const eventTickerStyle = useMemo(
    () => ({ fontSize: '48px', lineHeight: '1.1' as const }),
    []
  )

  const rowCount = (enablePhotoComments ? 1 : 0) + (enableEventComments ? 1 : 0)

  if (!enablePhotoComments && !enableEventComments) {
    return null
  }

  return (
    <div className="fixed bottom-6 left-1/4 w-1/2 z-50 bg-transparent rounded-sm flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex flex-col" style={{ height: rowCount * 104 }}>
        {enablePhotoComments && (
          <TickerRow
            photoId={photoId}
            photoComments={photoComments}
            resetKey={eventId}
            scrollSpeed={scrollSpeedPct}
            variant="feed"
            alwaysVisible
            className="bg-blue-900 text-white px-4 font-bold shrink-0"
            extraStyle={photoTickerStyle}
          />
        )}
        {enableEventComments && (
          <TickerRow
            comments={eventComments}
            scrollSpeed={scrollSpeedPct}
            variant="loop"
            alwaysVisible
            className="bg-white text-black px-4 font-bold shrink-0"
            extraStyle={eventTickerStyle}
          />
        )}
      </div>
    </div>
  )
}
