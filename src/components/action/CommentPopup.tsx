'use client'

import { useState, useEffect } from 'react'
import Spinner from '@/components/ui/Spinner'
import RotateDevicePrompt from '@/components/ui/RotateDevicePrompt'
import { useMobileLandscape } from '@/lib/useIsMobile'
import { useAppSelector } from '@/lib/hooks'
import MediaThumbnail from '@/components/display/MediaThumbnail'

interface CommentPopupProps {
  eventId: string
  photoId?: string
  type: 'photo' | 'event'
  accessCode: string
  onClose: () => void
}

export default function CommentPopup({ eventId, photoId, type, accessCode, onClose }: CommentPopupProps) {
  const mobileLandscape = useMobileLandscape()
  const [name, setName] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('photodropper_name') || '' : ''
  )
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewMedia, setPreviewMedia] = useState<{
    photoUrl: string
    thumbnailUrl?: string | null
    mediaType?: 'image' | 'video'
  } | null>(null)

  const { currentPlaylist } = useAppSelector(state => state.app)

  useEffect(() => {
    if (type === 'photo' && photoId) {
      if (currentPlaylist) {
        const photo = currentPlaylist.photoStream.find(p => p.photoId === photoId)
        if (photo?.photoUrl) {
          setPreviewMedia({
            photoUrl: photo.photoUrl,
            thumbnailUrl: photo.thumbnailUrl,
            mediaType: photo.mediaType,
          })
          return
        }
      }

      const fetchPhoto = async () => {
        try {
          const response = await fetch(`/api/photos?id=${photoId}`)
          if (response.ok) {
            const photoData = await response.json()
            setPreviewMedia({
              photoUrl: photoData.photoUrl,
              thumbnailUrl: photoData.thumbnailUrl,
              mediaType: photoData.mediaType === 'video' ? 'video' : 'image',
            })
          }
        } catch (err) {
          console.error('Error fetching photo:', err)
        }
      }

      fetchPhoto()
    }
  }, [type, photoId, currentPlaylist])

  console.log(`[CommentPopup] type: ${type}`)
  console.log(`[CommentPopup] photoId: ${photoId}`)
  console.log(`[CommentPopup] currentPlaylist: ${JSON.stringify(currentPlaylist)}`)
  console.log(`[CommentPopup] previewMedia:`, previewMedia)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Save name to localStorage
      if (name) {
        localStorage.setItem('photodropper_name', name)
      }

      // Prepare comment data
      const commentData = {
        eventId: eventId,
        accessCode,
        photoId: type === 'photo' && photoId ? photoId : null,
        index: 0, // Will be set by backend
        comment: comment.trim(),
        commenterName: name || null,
        visible: true
      }

      // Submit to backend
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Kon reactie niet verzenden')
      }

      onClose()
    } catch (err) {
      console.error('Error submitting comment:', JSON.stringify(err, null, 2))
      setError('Kon reactie niet verzenden')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white text-black rounded-lg p-6 w-full max-w-sm relative max-h-[95vh] overflow-y-auto">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>&times;</button>
        
        <h2 className="text-xl font-bold mb-4 pr-6">
          {type === 'photo' ? 'Reageren op foto' : 'Reageren op feest'}
        </h2>

        {mobileLandscape && !isSubmitting ? (
          <>
            <RotateDevicePrompt message="Draai je telefoon om te reageren" />
            <div className="flex justify-center mt-2">
              <button
                type="button"
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={onClose}
              >
                Annuleren
              </button>
            </div>
          </>
        ) : (
        <form onSubmit={handleSubmit}>
          {/* Photo preview for photo comments */}
          {type === 'photo' && previewMedia && (
            <div className="flex justify-center mb-3">
              <MediaThumbnail
                photoUrl={previewMedia.photoUrl}
                thumbnailUrl={previewMedia.thumbnailUrl}
                mediaType={previewMedia.mediaType}
                alt="Mediavoorbeeld"
                className="w-auto h-48 object-cover rounded shadow border"
                videoControls
              />
            </div>
          )}
          <input
            type="text"
            placeholder="Naam (anoniem)"
            value={name}
            maxLength={10}
            onChange={e => setName(e.target.value)}
            className="w-full mb-3 px-3 py-2 border rounded"
          />
          
          <textarea
            placeholder="Voeg een reactie toe"
            value={comment}
            maxLength={100}
            onChange={e => setComment(e.target.value)}
            className="w-full mb-4 px-3 py-2 border rounded h-24 resize-none"
            required
          />

          <div className="flex gap-2">
            <button
              type="button"
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
              disabled={!comment.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Verzenden...
                </div>
              ) : (
                'GA!'
              )}
            </button>
          </div>

          {error && <div className="text-red-600 mt-2">{error}</div>}
        </form>
        )}
      </div>
    </div>
  )
} 