'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setActiveEvent, resetApp, setCurrentPhotoIndex } from '@/lib/slices/appSlice'
import { playlistManager } from '@/lib/playlistManager'
import PasswordDialog from '@/components/PasswordDialog'
import ImageDisplay from '@/components/display/ImageDisplay'
import QRCode from '@/components/display/QRCode'
import MetadataDisplay from '@/components/display/MetadataDisplay'
import Ticker from '@/components/display/Ticker'
import PhotoCommentBox from '@/components/display/PhotoCommentBox'
import EventCommentBubble from '@/components/display/EventCommentBubble'

export default function Home() {
  const dispatch = useAppDispatch()
  const { 
    activeEventId, 
    currentPhotoIndex, 
    currentPlaylist,
    currentPlaylistHash
  } = useAppSelector(state => state.app)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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

  // Show dialog automatically when no active event AND there are photos
  useEffect(() => {
    if (!activeEventId && hasPhotos) {
      setShowPasswordDialog(true)
    } else {
      setShowPasswordDialog(false)
    }
  }, [activeEventId, hasPhotos])

  // Start playlist polling when event is set as active
  useEffect(() => {
    console.log(`[Home] useEffect activeEventId: ${activeEventId}`)
    if (activeEventId) {
      console.log(`[Home] Starting playlist polling for event ${activeEventId} with hash ${currentPlaylistHash}`) 
      setIsLoading(true)
      playlistManager.startPolling(activeEventId, currentPlaylistHash)
    } else {
      console.log(`[Home] Stopping playlist polling`)
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

  // Check if active event still exists
  useEffect(() => {
    console.log(`[Home] useEffect activeEventId: ${activeEventId}`)
    if (!activeEventId) return
    // Check if event exists
    fetch(`/api/social_events?id=${activeEventId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data || (Array.isArray(data) && data.length === 0)) {
          dispatch(setActiveEvent(null))
        }
      })
      .catch(() => {
        dispatch(setActiveEvent(null))
      })
  }, [activeEventId, dispatch])

  // Slideshow timer: auto-advance photo index
  useEffect(() => {
    if (!currentPlaylist?.photoStream || currentPlaylist.photoStream.length === 0) {
      return
    }
    const interval = setInterval(() => {
      const nextIndex = (currentPhotoIndex + 1) % currentPlaylist.photoStream.length
      dispatch(setCurrentPhotoIndex(nextIndex))
    }, 5000) // Default 5 seconds per photo
    return () => clearInterval(interval)
  }, [currentPhotoIndex, currentPlaylist, dispatch])

  // Click handler to open admin dialog when event is active
  const handlePageClick = () => {
    const show = !activeEventId || !showPasswordDialog;

    setShowPasswordDialog(show)
  }

  const handleClosePasswordDialog = () => {
    console.log(`[Home] handleClosePasswordDialog`)
    setShowPasswordDialog(false)
  }

  // Get current photo and comments
  const currentPhoto = currentPlaylist?.photoStream?.[currentPhotoIndex]
  const photoComments = currentPhoto?.comments || []
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

  // console.log(`[Home] currentPlaylist: ${JSON.stringify(currentPlaylist, null, 2)}`)
  // console.log(`[Home] currentPhotoIndex: ${JSON.stringify(currentPhotoIndex, null, 2)}`)
  console.log(`[Home] showPasswordDialog: ${showPasswordDialog}`)

  return (
    <div className="min-h-screen bg-black relative overflow-hidden" onClick={handlePageClick}>
      {/* Loading indicator */}
      {isLoading && activeEventId && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Loading photos...</p>
          </div>
        </div>
      )}

      {/* Main Photo Display or Placeholder */}
      {currentPhoto?.photoUrl ? (
        <ImageDisplay />
      ) : (
        <div className="h-screen bg-black flex items-center justify-center">
          <div className="text-white text-center">
            <h2 className="text-2xl font-bold mb-2">No Photos</h2>
            <p className="text-gray-400">Upload some photos to get started!</p>
          </div>
        </div>
      )}

      {/* QR Code - Top Left (always visible) */}
      <div className="absolute top-4 left-4 z-10">
        <QRCode 
          photoId={currentPhoto?.photoId || ''}
          eventId={activeEventId || ''}
          large={true}
        />
      </div>

      {/* Metadata - Top Right (only if photo) */}
      {currentPlaylist?.commentStyle === 'TICKER' && (
        <div className="absolute top-4 right-4 z-10">
          <MetadataDisplay 
            dateTaken={currentPhoto?.dateTaken || null}
            location={currentPhoto?.location || null}
          />
        </div>
      )}

      {/* Ticker or ComicBook Comments - Bottom */}
      {currentPlaylist?.commentStyle === 'TICKER' ? (
        <Ticker 
          photoComments={photoComments}
          eventComments={eventComments}
        />
      ) : (
        <>
          {/* Comic book style: location/date at top in yellow box */}
          {((currentPhoto?.location && currentPhoto.location.trim()) || currentPhoto?.dateTaken) && (
            <PhotoCommentBox
              comment={[
                currentPhoto?.location?.trim() || '',
                currentPhoto?.dateTaken ? new Date(currentPhoto.dateTaken).toLocaleDateString() : ''
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

      { showPasswordDialog && <PasswordDialog onClose={handleClosePasswordDialog} /> }
    </div>
  )
}
