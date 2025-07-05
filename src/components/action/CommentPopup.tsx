'use client'

import { useState } from 'react'
import Spinner from '@/components/ui/Spinner'

interface CommentPopupProps {
  eventId: string
  photoId?: string
  type: 'photo' | 'event'
  onClose: () => void
}

export default function CommentPopup({ eventId, photoId, type, onClose }: CommentPopupProps) {
  const [name, setName] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('photodropper_name') || '' : ''
  )
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        throw new Error(errorData.error || 'Failed to submit comment')
      }

      onClose()
    } catch (err) {
      console.error('Error submitting comment:', JSON.stringify(err, null, 2))
      setError('Failed to submit comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white text-black rounded-lg p-6 w-full max-w-sm relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>&times;</button>
        
        <h2 className="text-xl font-bold mb-4">
          Comment on {type === 'photo' ? 'Photo' : 'Event'}
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name (Anonymous)"
            value={name}
            maxLength={10}
            onChange={e => setName(e.target.value)}
            className="w-full mb-3 px-3 py-2 border rounded"
          />
          
          <textarea
            placeholder="Add a comment"
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
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
              disabled={!comment.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Submitting...
                </div>
              ) : (
                'GO!'
              )}
            </button>
          </div>

          {error && <div className="text-red-600 mt-2">{error}</div>}
        </form>
      </div>
    </div>
  )
} 