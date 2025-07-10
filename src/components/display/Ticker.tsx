'use client'

import TickerRow from './TickerRow'
import type { CommentStreamItem } from '@/lib/slices/appSlice'
import { canShowComment, markCommentShown } from '@/lib/photoMeta';

interface TickerProps {
  photoComments: CommentStreamItem[]
  eventComments: CommentStreamItem[]
}

export default function Ticker({ photoComments, eventComments }: TickerProps) {
  // Filter comments to only those that can be shown
  const filteredPhotoComments = photoComments.filter(c => canShowComment(c.id));
  const filteredEventComments = eventComments.filter(c => canShowComment(c.id));

  // Mark as shown when rendering
  filteredPhotoComments.forEach(c => markCommentShown(c.id));
  filteredEventComments.forEach(c => markCommentShown(c.id));

  const hasPhotoComments = filteredPhotoComments.length > 0
  const hasEventComments = filteredEventComments.length > 0

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
              comments={filteredPhotoComments}
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
              comments={filteredEventComments}
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