'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import UploadPhotoPopup from '@/components/action/UploadPhotoPopup'
import CommentPopup from '@/components/action/CommentPopup'

interface SocialEvent {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  photoDurationMs: number
  scrollSpeedPct: number
  commentStyle: 'TICKER' | 'COMICBOOK'
}

export default function ActionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const eventId = searchParams.get('event') || ''
  const photoId = searchParams.get('photo') || ''

  const [showUpload, setShowUpload] = useState(false)
  const [showPhotoComment, setShowPhotoComment] = useState(false)
  const [showEventComment, setShowEventComment] = useState(false)
  const [event, setEvent] = useState<SocialEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch event details
  useEffect(() => {
    async function fetchEvent() {
      if (!eventId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/social_events/${eventId}`)
        if (response.ok) {
          const eventData = await response.json()
          setEvent(eventData)
        } else {
          setError('Event not found')
        }
      } catch (err) {
        setError('Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

  const handleViewPhotos = () => {
    // Navigate to the main page with the event in the same tab
    router.push(`/?event=${eventId}`)
  }

  if (!eventId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid QR Code</h1>
          <p>Missing event information.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p>{error || 'Failed to load event'}</p>
        </div>
      </div>
    )
  }

  console.log(`[ActionPage] eventId: ${eventId}, photoId: ${photoId}, eventName: ${event.name}`)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 rounded-lg p-8 shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6">{event.name}</h1>
        <p className="mb-8">What would you like to do?</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            className="flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg transition-colors"
            onClick={() => setShowUpload(true)}
          >
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium">Upload</span>
          </button>

          {photoId && (
            <button
              className="flex flex-col items-center justify-center bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg transition-colors"
              onClick={() => setShowPhotoComment(true)}
            >
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-medium">Photo Comment</span>
            </button>
          )}

          <button
            className="flex flex-col items-center justify-center bg-yellow-600 hover:bg-yellow-700 text-white p-6 rounded-lg transition-colors"
            onClick={() => setShowEventComment(true)}
          >
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm font-medium">Event Comment</span>
          </button>

          <button
            className="flex flex-col items-center justify-center bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg transition-colors"
            onClick={handleViewPhotos}
          >
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">View Photos</span>
          </button>
        </div>

        {showUpload && (
          <UploadPhotoPopup 
            eventId={eventId}
            onClose={() => setShowUpload(false)}
          />
        )}
        {showPhotoComment && (
          <CommentPopup 
            eventId={eventId}
            photoId={photoId}
            type="photo"
            onClose={() => setShowPhotoComment(false)}
          />
        )}
        {showEventComment && (
          <CommentPopup 
            eventId={eventId}
            type="event"
            onClose={() => setShowEventComment(false)}
          />
        )}
      </div>
    </div>
  )
} 