'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import UploadPhotoPopup from '@/components/action/UploadPhotoPopup'
import CommentPopup from '@/components/action/CommentPopup'
import WelcomePopup, { HelpButton } from '@/components/action/WelcomePopup'
import MediaThumbnail from '@/components/display/MediaThumbnail'
import { shouldShowWelcome } from '@/lib/welcomeStorage'
import { verifyAndGrantEventAccess } from '@/lib/eventAccessClient'
import { getEventAccessCode, grantEventAccess, hasEventAccess } from '@/lib/eventAccessStorage'
import { buildSlideshowPath } from '@/lib/eventAccess'

interface SocialEvent {
  id: string
  name: string
  slug?: string
  createdAt: string
  updatedAt: string
  photoDurationMs: number
  scrollSpeedPct: number
  commentStyle: 'TICKER' | 'COMICBOOK'
  enablePhotoComments?: boolean
  enableEventComments?: boolean
}

interface Photo {
  id: string
  eventId: string
  index: number
  photoUrl: string
  mediaType?: 'image' | 'video'
  thumbnailUrl?: string | null
  uploaderName?: string
  dateTaken?: string
  coordinates?: string
  location?: string
  visible: boolean
  flaggedNotOk?: boolean
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
  const router = useRouter()
  const eventId = searchParams.get('event') || ''
  const photoId = searchParams.get('photo') || ''
  const codeParam = searchParams.get('code') || ''

  const [showUpload, setShowUpload] = useState(false)
  const [showPhotoComment, setShowPhotoComment] = useState(false)
  const [showEventComment, setShowEventComment] = useState(false)
  const [event, setEvent] = useState<SocialEvent | null>(null)
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accessCode, setAccessCode] = useState('')
  const [accessError, setAccessError] = useState<string | null>(null)
  const [accessUnlocked, setAccessUnlocked] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomePersistDismiss, setWelcomePersistDismiss] = useState(true)
  const [flagging, setFlagging] = useState(false)
  const [flagMessage, setFlagMessage] = useState<string | null>(null)

  useEffect(() => {
    async function unlockAndLoad() {
      if (!eventId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      setAccessError(null)

      let code = codeParam || getEventAccessCode(eventId) || ''

      if (codeParam) {
        const verified = await verifyAndGrantEventAccess({ eventId, code: codeParam })
        if (!verified.ok) {
          setAccessUnlocked(false)
          setAccessCode(codeParam)
          setAccessError('Ongeldige toegangscode voor dit feest.')
          setLoading(false)
          return
        }
        code = codeParam
      } else if (hasEventAccess(eventId)) {
        code = getEventAccessCode(eventId) || code
      } else {
        setAccessUnlocked(false)
        setAccessCode('')
        setLoading(false)
        return
      }

      grantEventAccess(eventId, code)
      setAccessCode(code)
      setAccessUnlocked(true)

      try {
        const response = await fetch(`/api/social_events/${eventId}`)
        if (!response.ok) {
          setError('Feest niet gevonden')
          setLoading(false)
          return
        }
        const eventData = await response.json()
        setEvent(eventData)
        if (shouldShowWelcome()) {
          setWelcomePersistDismiss(true)
          setShowWelcome(true)
        }
      } catch {
        setError('Kon feest niet laden')
      } finally {
        setLoading(false)
      }
    }

    unlockAndLoad()
  }, [eventId, codeParam])

  useEffect(() => {
    async function fetchPhoto() {
      if (!photoId || !accessUnlocked) {
        return
      }

      try {
        const response = await fetch(`/api/photos/${photoId}`)
        if (response.ok) {
          const photoData = await response.json()
          setPhoto(photoData)
        }
      } catch {
        console.error('Failed to load photo')
      }
    }

    fetchPhoto()
  }, [photoId, accessUnlocked])

  const handleFlagNotOk = async () => {
    if (!photoId || !accessCode || flagging) return
    if (!window.confirm('Deze foto of video verbergen van het scherm?')) return

    setFlagging(true)
    setFlagMessage(null)
    try {
      const response = await fetch(`/api/photos/${photoId}/flag-not-ok`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode }),
      })
      if (!response.ok) {
        setFlagMessage('Kon niet verbergen. Probeer het opnieuw.')
        return
      }
      const updated = await response.json()
      setPhoto(updated)
      setFlagMessage('Bedankt — deze is van het scherm gehaald.')
    } catch {
      setFlagMessage('Kon niet verbergen. Probeer het opnieuw.')
    } finally {
      setFlagging(false)
    }
  }

  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId || !accessCode.trim()) return

    setAccessError(null)
    setLoading(true)
    const verified = await verifyAndGrantEventAccess({ eventId, code: accessCode.trim() })
    if (!verified.ok) {
      setAccessError('Ongeldige toegangscode.')
      setLoading(false)
      return
    }

    grantEventAccess(eventId, accessCode.trim())
    setAccessUnlocked(true)

    try {
      const response = await fetch(`/api/social_events/${eventId}`)
      if (response.ok) {
        const eventData = await response.json()
        setEvent(eventData)
        if (shouldShowWelcome()) {
          setWelcomePersistDismiss(true)
          setShowWelcome(true)
        }
      } else {
        setError('Feest niet gevonden')
      }
    } catch {
      setError('Kon feest niet laden')
    } finally {
      setLoading(false)
    }
  }

  if (!eventId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Ongeldige link</h1>
          <p>Deze link mist feestinformatie. Gebruik de uitnodigingslink van het feest.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Laden...</p>
        </div>
      </div>
    )
  }

  if (!accessUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
        <form onSubmit={handleAccessSubmit} className="bg-gray-800 rounded-lg p-8 shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-3 text-center">Feesttoegang</h1>
          <p className="text-gray-300 text-sm mb-6 text-center">
            Voer de toegangscode in die je van de organisator hebt gekregen.
          </p>
          <input
            type="text"
            value={accessCode}
            onChange={e => setAccessCode(e.target.value.toUpperCase())}
            placeholder="Toegangscode"
            className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 mb-4 uppercase tracking-widest"
            autoComplete="off"
          />
          {accessError && <p className="text-red-400 text-sm mb-4">{accessError}</p>}
          <button
            type="submit"
            disabled={!accessCode.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 rounded font-medium"
          >
            Inloggen
          </button>
        </form>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Fout</h1>
          <p>{error || 'Kon feest niet laden'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      {showWelcome && (
        <WelcomePopup
          eventName={event.name}
          enablePhotoComments={event.enablePhotoComments}
          enableEventComments={event.enableEventComments}
          persistDismiss={welcomePersistDismiss}
          onClose={() => setShowWelcome(false)}
        />
      )}

      <div className="absolute top-4 right-4 z-20">
        <HelpButton
          onClick={() => {
            setWelcomePersistDismiss(false)
            setShowWelcome(true)
          }}
          className="bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
        />
      </div>

      {photo?.photoUrl && (
        <div className="absolute inset-0 bg-black">
          <MediaThumbnail
            photoUrl={photo.photoUrl}
            thumbnailUrl={photo.thumbnailUrl}
            mediaType={photo.mediaType || 'image'}
            className="w-full h-full object-contain opacity-30"
            alt="Achtergrond"
            videoMuted
            videoLoop
          />
        </div>
      )}

      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 shadow-lg w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-6">{event.name}</h1>
          <p className="mb-8">Wat wil je doen?</p>

          <div className="grid grid-cols-2 gap-4 mx-auto w-fit mb-8">
            <button
              type="button"
              className="flex flex-col items-center justify-center bg-gray-600 hover:bg-gray-700 text-white w-32 h-32 rounded-lg transition-colors"
              onClick={() => setShowUpload(true)}
            >
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium">Uploaden</span>
            </button>

            <button
              type="button"
              className="flex flex-col items-center justify-center bg-gray-600 hover:bg-gray-700 text-white w-32 h-32 rounded-lg transition-colors"
              onClick={() => router.push(buildSlideshowPath(eventId, accessCode))}
            >
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-sm font-medium">Kijken</span>
            </button>

            {photoId && event.enablePhotoComments !== false && (
              <button
                type="button"
                className="flex flex-col items-center justify-center bg-gray-600 hover:bg-gray-700 text-white w-32 h-32 rounded-lg transition-colors"
                onClick={() => setShowPhotoComment(true)}
              >
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm font-medium">Foto-reactie</span>
              </button>
            )}

            {photoId && !photo?.flaggedNotOk && (
              <button
                type="button"
                disabled={flagging}
                className="flex flex-col items-center justify-center bg-red-950 hover:bg-red-900 disabled:opacity-50 text-white w-32 h-32 rounded-lg transition-colors"
                onClick={handleFlagNotOk}
              >
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" strokeWidth={2} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h.01M15 10h.01" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 15q4 4 8 0" />
                </svg>
                <span className="text-sm font-medium">Niet oké</span>
              </button>
            )}
          </div>

          {flagMessage && (
            <p className="text-sm text-green-400 px-2 mb-4 text-center">{flagMessage}</p>
          )}

          {event.enableEventComments && (
            <div className="flex justify-center mb-8">
              <button
                type="button"
                className="flex flex-col items-center justify-center bg-gray-600 hover:bg-gray-700 text-white w-32 h-32 rounded-lg transition-colors"
                onClick={() => setShowEventComment(true)}
              >
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm font-medium">Feest-reactie</span>
              </button>
            </div>
          )}

          {showUpload && (
            <UploadPhotoPopup
              eventId={eventId}
              eventName={event.name}
              accessCode={accessCode}
              onClose={() => setShowUpload(false)}
            />
          )}
          {showPhotoComment && (
            <CommentPopup
              eventId={eventId}
              photoId={photoId}
              type="photo"
              accessCode={accessCode}
              onClose={() => setShowPhotoComment(false)}
            />
          )}
          {showEventComment && (
            <CommentPopup
              eventId={eventId}
              type="event"
              accessCode={accessCode}
              onClose={() => setShowEventComment(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
