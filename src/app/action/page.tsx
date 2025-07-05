'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import UploadPhotoPopup from '@/components/action/UploadPhotoPopup'
import CommentPopup from '@/components/action/CommentPopup'

export default function ActionPage() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event') || ''
  const photoId = searchParams.get('photo') || ''

  const [showUpload, setShowUpload] = useState(false)
  const [showPhotoComment, setShowPhotoComment] = useState(false)
  const [showEventComment, setShowEventComment] = useState(false)

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

  console.log(`[ActionPage] eventId: ${eventId}, photoId: ${photoId}`)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 rounded-lg p-8 shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6">Photodropper</h1>
        <p className="mb-6">What would you like to do?</p>
        <div className="space-y-4 mb-8">
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
            onClick={() => setShowUpload(true)}
          >
            Upload Photo
          </button>
          <button
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
            onClick={() => setShowPhotoComment(true)}
          >
            Comment on Photo
          </button>
          <button
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded"
            onClick={() => setShowEventComment(true)}
          >
            Comment on Event
          </button>
        </div>

        {showUpload && (
          <UploadPhotoPopup 
            eventId={eventId}
            onClose={() => setShowUpload(false)}
            autoOpenFileDialog={true}
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