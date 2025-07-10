'use client'

import { useSearchParams } from 'next/navigation'
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

interface Photo {
  id: string
  eventId: string
  index: number
  photoUrl: string
  uploaderName?: string
  dateTaken?: string
  coordinates?: string
  location?: string
  visible: boolean
  createdAt: string
  updatedAt: string
  comments: Comment[]
}

interface Comment {
  id: string
  eventId: string
  photoId?: string
  index: number
  comment: string
  commenterName?: string
  visible: boolean
  createdAt: string
  updatedAt: string
}

export default function ActionPage() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event') || ''
  const photoId = searchParams.get('photo') || ''

  const [showUpload, setShowUpload] = useState(false)
  const [showPhotoComment, setShowPhotoComment] = useState(false)
  const [showEventComment, setShowEventComment] = useState(false)
  const [event, setEvent] = useState<SocialEvent | null>(null)
  const [photo, setPhoto] = useState<Photo | null>(null)
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
      } catch {
        setError('Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

  // Fetch photo details if photoId is provided
  useEffect(() => {
    async function fetchPhoto() {
      if (!photoId) {
        return
      }

      try {
        const response = await fetch(`/api/photos/${photoId}`)
        if (response.ok) {
          const photoData = await response.json()
          setPhoto(photoData)
        } else {
          console.error('Photo not found:', photoId)
        }
      } catch {
        console.error('Failed to load photo')
      }
    }

    fetchPhoto()
  }, [photoId])

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
    <div className="min-h-screen bg-gray-900 text-white relative">
      {/* Background photo display */}
      {photo?.photoUrl && (
        <div className="absolute inset-0 bg-black">
          <img
            src={photo.photoUrl}
            alt="Background photo"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
      )}

      {/* Action popup overlay */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 shadow-lg w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-6">{event.name}</h1>
          <p className="mb-8">What would you like to do?</p>
          
          <div className="flex flex-col gap-4 mb-8 items-center">
            <button
              className="flex flex-col items-center justify-center bg-gray-600 hover:bg-gray-700 text-white w-32 h-32 rounded-lg transition-colors"
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
                className="flex flex-col items-center justify-center bg-gray-600 hover:bg-gray-700 text-white w-32 h-32 rounded-lg transition-colors"
                onClick={() => setShowPhotoComment(true)}
              >
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm font-medium">Photo Comment</span>
              </button>
            )}

            <button
              className="flex flex-col items-center justify-center bg-gray-600 hover:bg-gray-700 text-white w-32 h-32 rounded-lg transition-colors"
              onClick={() => setShowEventComment(true)}
            >
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-medium">Event Comment</span>
            </button>
          </div>

          {showUpload && (
            <UploadPhotoPopup 
              eventId={eventId}
              eventName={event?.name}
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
    </div>
  )
} 