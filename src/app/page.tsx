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

export default function Home() {
  const dispatch = useAppDispatch()
  const { 
    activeEventId, 
    currentPhotoIndex, 
    currentPlaylist,
    currentPlaylistHash
  } = useAppSelector(state => state.app)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  // Reset app state when switching events
  const prevEventIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (prevEventIdRef.current !== null && prevEventIdRef.current !== activeEventId) {
      dispatch(resetApp())
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

  // console.log(`[Home] currentPlaylist: ${JSON.stringify(currentPlaylist, null, 2)}`)
  // console.log(`[Home] currentPhotoIndex: ${JSON.stringify(currentPhotoIndex, null, 2)}`)
  console.log(`[Home] showPasswordDialog: ${showPasswordDialog}`)

  return (
    <div className="min-h-screen bg-black relative overflow-hidden" onClick={handlePageClick}>
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
        />
      </div>

      {/* Metadata - Top Right (only if photo) */}
      <div className="absolute top-4 right-4 z-10">
        <MetadataDisplay 
          dateTaken={currentPhoto?.dateTaken || null}
          location={currentPhoto?.location || null}
        />
      </div>

      {/* Ticker - Bottom */}
      <Ticker 
        photoComments={photoComments}
        eventComments={eventComments}
      />

      { showPasswordDialog && <PasswordDialog onClose={handleClosePasswordDialog} /> }
    </div>
  )
}
