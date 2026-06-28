'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setActiveEvent, resetApp, setCurrentPhotoIndex } from '@/lib/slices/appSlice'
import { playlistManager } from '@/lib/playlistManager'
import { persistor } from '@/lib/store'
import PasswordDialog from '@/components/PasswordDialog'
import WelcomePopup, { HelpButton } from '@/components/action/WelcomePopup'
import { shouldShowWelcome } from '@/lib/welcomeStorage'
import { verifyAndGrantEventAccess } from '@/lib/eventAccessClient'
import { getEventAccessCode, hasEventAccess } from '@/lib/eventAccessStorage'
import { withDevTickerComments } from '@/lib/devTickerComment'
import { useSlideshowCompactUI } from '@/lib/useIsMobile'
import MediaDisplay from '@/components/display/MediaDisplay'
import QRCode from '@/components/display/QRCode'
import MetadataDisplay from '@/components/display/MetadataDisplay'
import Ticker from '@/components/display/Ticker'
import MobileSlideshowBar from '@/components/display/MobileSlideshowBar'
import UploadPhotoPopup from '@/components/action/UploadPhotoPopup'
import CommentPopup from '@/components/action/CommentPopup'
import PhotoCommentBox from '@/components/display/PhotoCommentBox'
import EventCommentBubble from '@/components/display/EventCommentBubble'

export default function Home() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventParam = searchParams.get('event')
  const codeParam = searchParams.get('code')
  const { 
    activeEventId, 
    currentPhotoIndex, 
    currentPlaylist,
    currentPlaylistHash
  } = useAppSelector(state => state.app)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [accessDialogEventId, setAccessDialogEventId] = useState<string | null>(null)
  const [accessDialogCode, setAccessDialogCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomePersistDismiss, setWelcomePersistDismiss] = useState(true)
  const [welcomeEvent, setWelcomeEvent] = useState<{
    name: string
    enablePhotoComments?: boolean
    enableEventComments?: boolean
  } | null>(null)
  const [persistReady, setPersistReady] = useState(
    () => persistor.getState().bootstrapped
  )
  const [showUpload, setShowUpload] = useState(false)
  const [showPhotoComment, setShowPhotoComment] = useState(false)
  const [flagging, setFlagging] = useState(false)
  const compactUI = useSlideshowCompactUI()

  useEffect(() => {
    if (persistReady) return
    const unsubscribe = persistor.subscribe(() => {
      if (persistor.getState().bootstrapped) {
        setPersistReady(true)
      }
    })
    if (persistor.getState().bootstrapped) {
      setPersistReady(true)
    }
    return unsubscribe
  }, [persistReady])

  // Resolve active event via invite link or stored access
  useEffect(() => {
    if (!persistReady) return

    let cancelled = false

    async function resolveActiveEvent() {
      if (eventParam && codeParam) {
        const result = await verifyAndGrantEventAccess({ eventId: eventParam, code: codeParam })
        if (cancelled) return
        if (result.ok) {
          dispatch(setActiveEvent(eventParam))
          return
        }
        setAccessDialogEventId(eventParam)
        setAccessDialogCode(codeParam)
        setShowPasswordDialog(true)
        return
      }

      if (eventParam) {
        if (hasEventAccess(eventParam)) {
          const storedCode = getEventAccessCode(eventParam)
          if (eventParam !== activeEventId) {
            dispatch(setActiveEvent(eventParam))
          }
          if (storedCode) {
            router.replace(`/?event=${eventParam}&code=${encodeURIComponent(storedCode)}`, { scroll: false })
          }
          return
        }
        setAccessDialogEventId(eventParam)
        setAccessDialogCode(null)
        setShowPasswordDialog(true)
        return
      }

      if (activeEventId && hasEventAccess(activeEventId)) {
        const storedCode = getEventAccessCode(activeEventId)
        if (storedCode) {
          router.replace(`/?event=${activeEventId}&code=${encodeURIComponent(storedCode)}`, { scroll: false })
        }
        return
      }

      if (activeEventId && !hasEventAccess(activeEventId)) {
        dispatch(setActiveEvent(null))
      }

      setAccessDialogEventId(null)
      setAccessDialogCode(null)
      setShowPasswordDialog(true)
    }

    resolveActiveEvent()
    return () => {
      cancelled = true
    }
  }, [persistReady, eventParam, codeParam, activeEventId, dispatch, router])

  // Reset app state when switching events
  const prevEventIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (prevEventIdRef.current !== null && prevEventIdRef.current !== activeEventId) {
      dispatch(resetApp())
      setIsLoading(true)
    }
    prevEventIdRef.current = activeEventId
  }, [activeEventId, dispatch])

  const hasPhotos = !!currentPlaylist?.photoStream?.length

  // Start playlist polling when event is unlocked
  useEffect(() => {
    if (activeEventId && hasEventAccess(activeEventId)) {
      setIsLoading(true)
      playlistManager.startPolling(activeEventId, currentPlaylistHash)
    } else {
      playlistManager.stopPolling()
    }

    // Cleanup on unmount
    return () => {
      console.log(`[Home] Stopping playlist polling on unmount`)
      playlistManager.stopPolling()
    }
  }, [activeEventId, currentPlaylistHash])

  // Clear loading state when photos are loaded
  useEffect(() => {
    if (hasPhotos) {
      setIsLoading(false)
    }
  }, [hasPhotos])

  // Clear loading state when playlist is loaded (even if empty)
  useEffect(() => {
    if (currentPlaylist !== null) {
      setIsLoading(false)
    }
  }, [currentPlaylist])

  // Fallback: clear loading state after timeout
  useEffect(() => {
    if (isLoading && activeEventId) {
      const timeout = setTimeout(() => {
        console.log('[Home] Loading timeout reached, clearing loading state')
        setIsLoading(false)
      }, 10000) // 10 second timeout
      
      return () => clearTimeout(timeout)
    }
  }, [isLoading, activeEventId])

  // Check if active event still exists
  useEffect(() => {
    if (!activeEventId || !hasEventAccess(activeEventId)) return
    fetch(`/api/social_events/${activeEventId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) {
          dispatch(setActiveEvent(null))
        }
      })
      .catch(() => {
        dispatch(setActiveEvent(null))
      })
  }, [activeEventId, dispatch])

  // Show welcome/help dialog on first visit (monthly) once an event is active and unlocked
  useEffect(() => {
    if (!activeEventId || !hasEventAccess(activeEventId)) {
      setWelcomeEvent(null)
      return
    }

    let cancelled = false

    async function loadWelcomeEvent() {
      try {
        const response = await fetch(`/api/social_events/${activeEventId}`)
        if (!response.ok || cancelled) return
        const event = await response.json()
        if (cancelled) return

        setWelcomeEvent({
          name: event.name,
          enablePhotoComments: event.enablePhotoComments,
          enableEventComments: event.enableEventComments,
        })

        if (shouldShowWelcome()) {
          setWelcomePersistDismiss(true)
          setShowWelcome(true)
        }
      } catch {
        // ignore
      }
    }

    loadWelcomeEvent()
    return () => {
      cancelled = true
    }
  }, [activeEventId])

  const advanceSlide = () => {
    if (!currentPlaylist?.photoStream?.length) return
    const nextIndex = (currentPhotoIndex + 1) % currentPlaylist.photoStream.length
    dispatch(setCurrentPhotoIndex(nextIndex))
  }

  const currentPhoto = currentPlaylist?.photoStream?.[currentPhotoIndex]
  const isCurrentVideo = currentPhoto?.mediaType === 'video'

  // Slideshow timer: auto-advance for images only
  useEffect(() => {
    if (!currentPlaylist?.photoStream || currentPlaylist.photoStream.length === 0) {
      return
    }
    if (isCurrentVideo) {
      return
    }
    const durationMs = currentPlaylist.photoDurationMs ?? 5000
    const interval = setInterval(advanceSlide, durationMs)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhotoIndex, currentPlaylist, isCurrentVideo, dispatch])

  const handleVideoEnded = () => {
    advanceSlide()
  }

  // Click handler to open admin dialog when event is active (desktop / TV)
  const handlePageClick = () => {
    if (compactUI && activeEventId && hasEventAccess(activeEventId)) return
    const show = !activeEventId || !showPasswordDialog
    setShowPasswordDialog(show)
  }

  const handleClosePasswordDialog = () => {
    console.log(`[Home] handleClosePasswordDialog`)
    setShowPasswordDialog(false)
  }

  const handleEventSelected = (eventId: string, code: string) => {
    setShowPasswordDialog(false)
    router.replace(`/?event=${eventId}&code=${encodeURIComponent(code)}`, { scroll: false })
  }

  const slideshowAccessCode =
    (activeEventId ? getEventAccessCode(activeEventId) : null) || codeParam || ''

  const slideshowUnlocked = Boolean(activeEventId && hasEventAccess(activeEventId))

  // Get current photo and comments
  const photoComments = withDevTickerComments(
    currentPhoto?.comments || [],
    currentPhoto?.photoId || '',
    activeEventId || ''
  )
  const eventComments = currentPlaylist?.eventCommentStream || []

  // Map comments to expected type for bubble components
  const mappedPhotoComments = photoComments.map(c => ({
    ...c,
    commenterName: c.commenterName ?? undefined
  }))
  const mappedEventComments = eventComments.map(c => ({
    ...c,
    commenterName: c.commenterName ?? undefined
  }))

  const handleFlagNotOk = async () => {
    const photoId = currentPhoto?.photoId
    if (!photoId || !slideshowAccessCode || flagging) return
    if (!window.confirm('Deze foto of video verbergen van het scherm?')) return

    setFlagging(true)
    try {
      const response = await fetch(`/api/photos/${photoId}/flag-not-ok`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: slideshowAccessCode }),
      })
      if (!response.ok) {
        alert('Kon niet verbergen. Probeer het opnieuw.')
      }
    } catch {
      alert('Kon niet verbergen. Probeer het opnieuw.')
    } finally {
      setFlagging(false)
    }
  }

  // console.log(`[Home] currentPlaylist: ${JSON.stringify(currentPlaylist, null, 2)}`)
  // console.log(`[Home] currentPhotoIndex: ${JSON.stringify(currentPhotoIndex, null, 2)}`)
  console.log(`[Home] showPasswordDialog: ${showPasswordDialog}`)

  return (
    <div className="min-h-screen bg-black relative overflow-hidden" onClick={handlePageClick}>
      {showWelcome && welcomeEvent && (
        <WelcomePopup
          eventName={welcomeEvent.name}
          enablePhotoComments={welcomeEvent.enablePhotoComments}
          enableEventComments={welcomeEvent.enableEventComments}
          persistDismiss={welcomePersistDismiss}
          onClose={() => setShowWelcome(false)}
        />
      )}

      {/* Loading indicator */}
      {isLoading && slideshowUnlocked && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Feest laden...</p>
          </div>
        </div>
      )}

      {/* Main Photo Display or Placeholder */}
      {slideshowUnlocked && currentPhoto?.photoUrl ? (
        <MediaDisplay onVideoEnded={handleVideoEnded} />
      ) : (
        <div className="h-screen bg-black flex items-center justify-center">
          <div className="text-white text-center">
            <h2 className="text-2xl font-bold mb-2">
              {slideshowUnlocked ? 'Geen foto\'s of video\'s' : 'Feesttoegang vereist'}
            </h2>
            <p className="text-gray-400">
              {slideshowUnlocked
                ? 'Upload foto\'s of video\'s om te beginnen!'
                : 'Open je uitnodigingslink of log in met feestnaam en code.'}
            </p>
          </div>
        </div>
      )}

      {slideshowUnlocked && (
      <>
      {!compactUI && (
      <div className="absolute top-4 left-4 z-10">
        <QRCode 
          photoId={currentPhoto?.photoId || ''}
          eventId={activeEventId || ''}
          accessCode={slideshowAccessCode}
          large={true}
        />
      </div>
      )}

      {!compactUI && (
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        {activeEventId && welcomeEvent && (
          <HelpButton
            onClick={() => {
              setWelcomePersistDismiss(false)
              setShowWelcome(true)
            }}
            className="bg-black/60 hover:bg-black/80 text-white border border-white/30"
          />
        )}
        {currentPlaylist?.commentStyle === 'TICKER' && (
          <MetadataDisplay 
            dateTaken={currentPhoto?.dateTaken || null}
            location={currentPhoto?.location || null}
          />
        )}
      </div>
      )}

      {compactUI && currentPlaylist?.commentStyle === 'TICKER' && (
        <div className="absolute top-1 right-1 z-20 max-w-[55vw]">
          <MetadataDisplay 
            dateTaken={currentPhoto?.dateTaken || null}
            location={currentPhoto?.location || null}
            compact
          />
        </div>
      )}

      {/* Mobile action bar */}
      {currentPhoto?.photoUrl && activeEventId && (
        <MobileSlideshowBar
          onUpload={() => setShowUpload(true)}
          onComment={() => setShowPhotoComment(true)}
          onFlagNotOk={handleFlagNotOk}
          onHelp={() => {
            setWelcomePersistDismiss(false)
            setShowWelcome(true)
          }}
          showComment={currentPlaylist?.enablePhotoComments !== false}
          flagging={flagging}
        />
      )}

      {showUpload && activeEventId && (
        <UploadPhotoPopup
          eventId={activeEventId}
          eventName={welcomeEvent?.name}
          accessCode={slideshowAccessCode}
          onClose={() => setShowUpload(false)}
        />
      )}
      {showPhotoComment && activeEventId && currentPhoto?.photoId && (
        <CommentPopup
          eventId={activeEventId}
          photoId={currentPhoto.photoId}
          type="photo"
          accessCode={slideshowAccessCode}
          onClose={() => setShowPhotoComment(false)}
        />
      )}

      {/* Ticker or ComicBook Comments - Bottom */}
      {currentPlaylist?.commentStyle === 'TICKER' ? (
        <Ticker 
          eventId={activeEventId || undefined}
          photoId={currentPhoto?.photoId}
          photoComments={photoComments}
          eventComments={eventComments}
          scrollSpeedPct={currentPlaylist?.scrollSpeedPct ?? 50}
          enablePhotoComments={currentPlaylist?.enablePhotoComments ?? true}
          enableEventComments={currentPlaylist?.enableEventComments ?? false}
        />
      ) : (
        <>
          {/* Comic book style: location/date at top in yellow box */}
          {((currentPhoto?.location && currentPhoto.location.trim()) || currentPhoto?.dateTaken) && (
            <PhotoCommentBox
              comment={[
                currentPhoto?.location?.trim() || '',
                currentPhoto?.dateTaken || ''
              ].filter(Boolean).join(' \u2022 ')}
              position="top"
              color="yellow"
              defaultFontSize={32}
            />
          )}
          {/* Comic book style: photo comments at bottom, alternating color */}
          {mappedPhotoComments.length > 0 && (
            <PhotoCommentBox
              comment={(() => {
                // Cycle through comments as before
                const idx = 0 // always show the first for now, or implement cycling if needed
                const c = mappedPhotoComments[idx]
                return c.commenterName ? `${c.comment}\n— ${c.commenterName}` : c.comment
              })()}
              color={(() => {
                // Alternate color by comment index
                const idx = 0 // always show the first for now, or implement cycling if needed
                return idx % 2 === 0 ? 'yellow' : 'blue'
              })()}
              position="bottom"
              defaultFontSize={44}
            />
          )}
          {/* Comic book bubbles: event comments (no tail) */}
          <div className="absolute left-0 top-0 w-full h-full border-2 border-white">
            <EventCommentBubble comments={mappedEventComments} />
          </div>
        </>
      )}
      </>
      )}

      { showPasswordDialog && (
        <PasswordDialog
          onClose={handleClosePasswordDialog}
          onEventSelected={handleEventSelected}
          initialEventId={accessDialogEventId}
          initialCode={accessDialogCode}
        />
      ) }
    </div>
  )
}
