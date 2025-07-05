'use client'

import { useState, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setActiveEvent } from '@/lib/slices/appSlice'
import { playlistManager } from '@/lib/playlistManager'
import Link from 'next/link'
import PasswordDialog from '@/components/PasswordDialog'

export default function Home() {
  const dispatch = useAppDispatch()
  const { activeEventId, isLoading, error } = useAppSelector(state => state.app)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  // Show password dialog if no active event
  useEffect(() => {
    if (!activeEventId) {
      setShowPasswordDialog(true)
    }
  }, [activeEventId])

  // Start playlist polling when event is set as active
  useEffect(() => {
    if (activeEventId) {
      playlistManager.startPolling(activeEventId, '')
    } else {
      playlistManager.stopPolling()
    }
  }, [activeEventId])

  const handleSetTestEvent = () => {
    // Set a test event ID (you'll need to create this in your database)
    dispatch(setActiveEvent('test-event-id'))
  }

  const handleAddDemo = async () => {
    try {
      console.log('Starting demo creation...')
      
      // Create demo event
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const eventName = `DEMO ${timestamp}`
      
      console.log('Creating event:', eventName)
      
      const eventResponse = await fetch('/api/social_events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: eventName })
      })
      
      console.log('Event response status:', eventResponse.status)
      
      if (!eventResponse.ok) {
        const errorText = await eventResponse.text()
        console.error('Event creation failed:', errorText)
        throw new Error(`Failed to create event: ${errorText}`)
      }
      
      const event = await eventResponse.json()
      console.log('Event created:', event)
      
      // Upload demo photos
      const demoPhotos = ['demo/DEMO-1.JPG', 'demo/DEMO-2.JPG', 'demo/DEMO-3.JPG', 'demo/DEMO-4.JPG', 'demo/DEMO-5.JPG']
      const uploadedPhotos = []
      
      for (let i = 0; i < demoPhotos.length; i++) {
        const photoName = demoPhotos[i]
        console.log(`Uploading ${photoName}...`)
        
        try {
          // Fetch the image from public folder
          const imageResponse = await fetch(`/${photoName}`)
          if (!imageResponse.ok) {
            console.error(`Failed to fetch ${photoName}:`, imageResponse.status)
            continue
          }
          
          const imageBlob = await imageResponse.blob()
          
          // Create a file object
          const file = new File([imageBlob], photoName, { type: 'image/jpeg' })
          
          // Upload using FormData
          const formData = new FormData()
          formData.append('file', file)
          formData.append('eventId', event.id)
          formData.append('uploaderName', 'Demo User')
          formData.append('comment', `Demo photo ${i + 1}`)
          formData.append('location', 'Demo Location')
          formData.append('dateTaken', new Date().toISOString().split('T')[0])
          
          const photoResponse = await fetch('/api/photos/upload', {
            method: 'POST',
            body: formData
          })
          
          console.log(`Photo upload response for ${photoName}:`, photoResponse.status)
          
          if (photoResponse.ok) {
            const photo = await photoResponse.json()
            console.log(`Photo uploaded:`, photo)
            uploadedPhotos.push(photo.photo)
          } else {
            const errorText = await photoResponse.text()
            console.error(`Photo upload failed for ${photoName}:`, errorText)
          }
        } catch (photoError) {
          console.error(`Error uploading ${photoName}:`, photoError)
        }
      }
      
      console.log(`Successfully uploaded ${uploadedPhotos.length} photos`)
      
      // Add random comments to photos
      const photoComments = [
        "This is amazing! 📸",
        "Love this moment! ❤️",
        "Perfect shot! 👌",
        "Memories forever! 🌟",
        "What a great time! 🎉",
        "This is so fun! 😄",
        "Best photo ever! 🏆",
        "Can't stop laughing! 😂",
        "This is epic! 🔥",
        "Pure joy! ✨"
      ]
      
      for (const photo of uploadedPhotos) {
        const numComments = Math.floor(Math.random() * 4) // 0-3 comments
        console.log(`Adding ${numComments} comments to photo ${photo.id}`)
        
        for (let i = 0; i < numComments; i++) {
          const randomComment = photoComments[Math.floor(Math.random() * photoComments.length)]
          const commentData = {
            eventId: event.id,
            photoId: photo.id,
            index: i,
            comment: randomComment,
            commenterName: `Guest${Math.floor(Math.random() * 100)}`,
            visible: true
          }
          
          try {
            const commentResponse = await fetch('/api/comments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(commentData)
            })
            
            if (!commentResponse.ok) {
              const errorText = await commentResponse.text()
              console.error('Comment creation failed:', errorText)
            }
          } catch (commentError) {
            console.error('Error creating comment:', commentError)
          }
        }
      }
      
      // Add random event comments
      const eventComments = [
        "This party is incredible! 🎊",
        "Best event ever! 🏆",
        "Having so much fun! 😄",
        "This is the place to be! 🌟",
        "Amazing vibes here! ✨",
        "Can't believe how awesome this is! 🔥",
        "Everyone is so friendly! 🤗",
        "This is what memories are made of! 💫",
        "Absolutely loving this! ❤️",
        "What a fantastic time! 🎉"
      ]
      
      const numEventComments = Math.floor(Math.random() * 4) // 0-3 comments
      console.log(`Adding ${numEventComments} event comments`)
      
      for (let i = 0; i < numEventComments; i++) {
        const randomComment = eventComments[Math.floor(Math.random() * eventComments.length)]
        const commentData = {
          eventId: event.id,
          index: i,
          comment: randomComment,
          commenterName: `EventGuest${Math.floor(Math.random() * 100)}`,
          visible: true
        }
        
        try {
          const commentResponse = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(commentData)
          })
          
          if (!commentResponse.ok) {
            const errorText = await commentResponse.text()
            console.error('Event comment creation failed:', errorText)
          }
        } catch (commentError) {
          console.error('Error creating event comment:', commentError)
        }
      }
      
      // Set as active event
      dispatch(setActiveEvent(event.id))
      
      alert(`Demo created successfully! Event ID: ${event.id}`)
      
    } catch (error) {
      console.error('Demo creation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to create demo: ${errorMessage}`)
    }
  }

  const handlePageClick = () => {
    setShowPasswordDialog(true)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white" onClick={handlePageClick}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Photodropper
        </h1>
        
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          
          <div className="space-y-2 mb-6">
            <p><span className="font-medium">Active Event:</span> {activeEventId || 'None'}</p>
            <p><span className="font-medium">Loading:</span> {isLoading ? 'Yes' : 'No'}</p>
            {error && (
              <p><span className="font-medium text-red-400">Error:</span> {error}</p>
            )}
          </div>

          <div className="space-y-3">
            <Link 
              href="/display"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-center"
            >
              Go to Display
            </Link>
            
            <button
              onClick={handleSetTestEvent}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
            >
              Set Test Event
            </button>

            <button
              onClick={handleAddDemo}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded"
            >
              ADD DEMO
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Click anywhere to access admin panel
            </p>
          </div>
        </div>
      </div>

      <PasswordDialog 
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        showOnNoEvent={!activeEventId}
      />
    </div>
  )
}
