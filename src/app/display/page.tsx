'use client'

import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { playlistManager } from '@/lib/playlistManager'
import ImageDisplay from '@/components/display/ImageDisplay'
import QRCode from '@/components/display/QRCode'
import MetadataDisplay from '@/components/display/MetadataDisplay'
import Ticker from '@/components/display/Ticker'
import { setActiveEvent } from '@/lib/slices/appSlice'

export default function DisplayPage() {
  const dispatch = useAppDispatch()
  const { 
    activeEventId, 
    currentPhotoIndex, 
    currentPlaylist,
    currentPlaylistHash
  } = useAppSelector(state => state.app)

  // Start/stop polling when activeEventId changes
  useEffect(() => {
    console.log(`[Display] useEffect activeEventId: ${activeEventId}`)
    if (activeEventId) {
      console.log(`[Display] Starting playlist polling for event ${activeEventId} with hash ${currentPlaylistHash}`) 
      playlistManager.startPolling(activeEventId, currentPlaylistHash)
    } else {
      console.log(`[Display] Stopping playlist polling`)
      playlistManager.stopPolling()
    }

    // Cleanup on unmount
    return () => {
      console.log(`[Display] Stopping playlist polling on unmount`)
      playlistManager.stopPolling()
    }
  }, [activeEventId, currentPlaylistHash])

  useEffect(() => {
    console.log(`[Display] useEffect activeEventId: ${activeEventId}`)
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

  // If no active event, show placeholder
  if (!activeEventId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-4xl font-bold mb-4">Photodropper</h1>
          <p className="text-xl">No active event</p>
          <p className="text-gray-400 mt-2">Click anywhere to access admin panel</p>
        </div>
      </div>
    )
  }

  // console.log(`[Display] currentPlaylist: ${JSON.stringify(currentPlaylist, null, 2)}`)
  const currentPhoto = currentPlaylist?.photoStream?.[currentPhotoIndex]
  const photoComments = currentPhoto?.comments || []
  const eventComments = currentPlaylist?.eventCommentStream || []

  console.log(`[Display] currentPhoto: ${JSON.stringify(currentPlaylist?.photoStream)}`)

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Main Photo Display */}
      <ImageDisplay />

      {/* QR Code - Top Left */}
      <div className="absolute top-4 left-4 z-10">
        <QRCode 
          photoId={currentPhoto?.photoId || ''}
          eventId={activeEventId}
        />
      </div>

      {/* Metadata - Top Right */}
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
    </div>
  )
} 