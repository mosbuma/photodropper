'use client'

import { useMemo } from 'react'
import TickerRow from './TickerRow'
import { useIsLandscape, useSlideshowCompactUI } from '@/lib/useIsMobile'
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
  const compactUI = useSlideshowCompactUI()
  const isLandscape = useIsLandscape()

  const rowHeightPx = compactUI ? (isLandscape ? 36 : 52) : 104
  const fontSize = compactUI ? (isLandscape ? '0.75rem' : '1.125rem') : '48px'

  const tickerFontStyle = useMemo(
    () => ({ fontSize, lineHeight: '1.1' as const }),
    [fontSize]
  )

  const rowCount = (enablePhotoComments ? 1 : 0) + (enableEventComments ? 1 : 0)

  if (!enablePhotoComments && !enableEventComments) {
    return null
  }

  const positionClass = compactUI
    ? isLandscape
      ? 'bottom-1 left-14 right-2'
      : 'bottom-14 left-2 right-2'
    : 'bottom-6 left-1/4 w-1/2 right-auto'

  const paddingClass = compactUI ? 'px-1.5' : 'px-4'

  return (
    <div className={`fixed z-40 bg-transparent rounded-sm flex flex-col ${positionClass}`}>
      <div className="max-w-7xl mx-auto w-full flex flex-col" style={{ height: rowCount * rowHeightPx }}>
        {enablePhotoComments && (
          <TickerRow
            photoId={photoId}
            photoComments={photoComments}
            resetKey={eventId}
            scrollSpeed={scrollSpeedPct}
            variant="feed"
            alwaysVisible
            rowHeightPx={rowHeightPx}
            className={`bg-blue-900 text-white ${paddingClass} font-bold shrink-0`}
            extraStyle={tickerFontStyle}
          />
        )}
        {enableEventComments && (
          <TickerRow
            comments={eventComments}
            scrollSpeed={scrollSpeedPct}
            variant="loop"
            alwaysVisible
            rowHeightPx={rowHeightPx}
            className={`bg-white text-black ${paddingClass} font-bold shrink-0`}
            extraStyle={tickerFontStyle}
          />
        )}
      </div>
    </div>
  )
}
