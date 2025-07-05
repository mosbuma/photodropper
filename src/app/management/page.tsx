'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setActiveEvent } from '@/lib/slices/appSlice'
import { playlistManager } from '@/lib/playlistManager'
import type { SocialEvent } from '@prisma/client'
import type { CommentStreamItem, PhotoStreamItem } from '@/lib/slices/appSlice'

export default function ManagementPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { activeEventId, currentPlaylist } = useAppSelector(state => state.app)
  
  const [activeTab, setActiveTab] = useState('events')
  const [events, setEvents] = useState<SocialEvent[]>([])
  const [photos, setPhotos] = useState<PhotoStreamItem[]>([])
  const [comments, setComments] = useState<CommentStreamItem[]>([])
  const [loading, setLoading] = useState(false)
  const [editPhoto, setEditPhoto] = useState<PhotoStreamItem | null>(null)
  const [deletePhoto, setDeletePhoto] = useState<PhotoStreamItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const tabs = [
    { id: 'events', label: 'Events' },
    { id: 'photos', label: 'Photos' },
    { id: 'comments', label: 'Comments' },
    { id: 'playlist', label: 'Playlist' },
    { id: 'settings', label: 'Settings' }
  ]

  const handleClose = () => {
    router.push('/')
  }

  const handleNewEvent = async () => {
    const eventName = prompt('Enter event name:')
    if (!eventName) return

    try {
      setLoading(true)
      const response = await fetch('/api/social_events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: eventName })
      })

      if (response.ok) {
        const newEvent = await response.json()
        setEvents(prev => [...prev, newEvent])
        alert('Event created successfully!')
      } else {
        alert('Failed to create event')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Error creating event')
    } finally {
      setLoading(false)
    }
  }

  const handleSetActiveEvent = (eventId: string) => {
    dispatch(setActiveEvent(eventId))
    alert(`Event ${eventId} set as active`)
  }

  const loadEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/social_events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPhotos = async () => {
    if (!activeEventId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/photos?eventId=${activeEventId}`)
      if (response.ok) {
        const data = await response.json()
        setPhotos(data)
        console.log('Loaded photos:', JSON.stringify(data, null, 2))
      }
    } catch (error) {
      console.error('Error loading photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    if (!activeEventId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/comments?eventId=${activeEventId}`)
      if (response.ok) {
        const data = await response.json() as CommentStreamItem[]
        console.log('Loaded comments:', data.map((c) => ({ id: c.id, comment: c.comment, photoId: c.photoId, eventId: c.eventId })))
        setComments(data)
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load data when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    if (tabId === 'events') {
      loadEvents()
    } else if (tabId === 'photos') {
      loadPhotos()
    } else if (tabId === 'comments') {
      loadComments()
    }
  }

  // Load events on mount
  useEffect(() => {
    loadEvents()
  }, [])

  // Start playlist polling when event is set as active
  useEffect(() => {
    if (activeEventId) {
      playlistManager.startPolling(activeEventId, '')
    } else {
      playlistManager.stopPolling()
    }
  }, [activeEventId])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Photodropper Management</h1>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleNewEvent}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
              >
                New Event
              </button>
              
              <select 
                value={activeEventId || ''} 
                onChange={(e) => dispatch(setActiveEvent(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
              >
                <option value="">Select Event</option>
                {events.map((event: SocialEvent) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleClose}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="mt-2">Loading...</p>
          </div>
        )}

        {!loading && activeTab === 'events' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Events</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event: SocialEvent) => (
                <div key={event.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{event.name}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSetActiveEvent(event.id)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Set Active
                      </button>
                      <button className="text-gray-400 hover:text-gray-300 text-sm">
                        Edit
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Created: {new Date(event.createdAt).toLocaleDateString()}
                  </p>
                  {activeEventId === event.id && (
                    <span className="inline-block bg-green-600 text-white text-xs px-2 py-1 rounded mt-2">
                      Active
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && activeTab === 'photos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Photos</h2>
              <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                Upload Photos
              </button>
            </div>
            {activeEventId ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {photos.map((photo) => {
                  // Filter comments for this specific photo
                  const photoComments = comments.filter(
                    (comment) => comment.photoId && String(comment.photoId) === String(photo.id)
                  );
                  
                  // Debug logging
                  console.log(`Photo ${photo.id}:`, photoComments.length, 'comments')
                  if (photoComments.length > 0) {
                    console.log('Photo comments:', photoComments.map(c => ({ id: c.id, comment: c.comment, photoId: c.photoId })))
                  }
                  
                  return (
                    <div key={photo.id} className="bg-gray-800 rounded-lg overflow-hidden relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={photo.photoUrl} 
                        alt="Photo"
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-3">
                        <p className="text-sm text-gray-400 truncate">
                          {photo.uploaderName || 'Anonymous'}
                        </p>
                        {/* Photo comments */}
                        {photoComments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {photoComments.map((comment) => (
                              <p key={comment.id} className="text-xs text-gray-500">
                                {comment.comment}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Edit/Delete icons */}
                      <div className="absolute bottom-2 right-2 flex gap-2 opacity-80 group-hover:opacity-100">
                        <button onClick={() => setEditPhoto(photo)} className="bg-white rounded-full p-1 shadow hover:bg-blue-100">
                          {/* Edit icon (pencil) */}
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-blue-600"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z" /></svg>
                        </button>
                        <button onClick={() => setDeletePhoto(photo)} className="bg-white rounded-full p-1 shadow hover:bg-red-100">
                          {/* Trash icon */}
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-600"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-400">Select an event to view photos</p>
            )}
            {/* Edit popup */}
            {editPhoto && (
              <PhotoEditPopup 
                photo={editPhoto} 
                onClose={() => setEditPhoto(null)}
                onSave={updated => {
                  setPhotos(photos => photos.map(p => p.id === updated.id ? updated : p))
                }}
              />
            )}
            {/* Delete confirm popup */}
            {deletePhoto && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-white text-black rounded-lg p-6 w-full max-w-xs relative">
                  <button className="absolute top-2 right-2 text-gray-500" onClick={() => setDeletePhoto(null)}>&times;</button>
                  <h2 className="text-xl font-bold mb-4">Delete Photo?</h2>
                  <p className="mb-4">Are you sure you want to delete this photo?</p>
                  <div className="flex gap-2">
                    <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded" disabled={deleting} onClick={async () => {
                      setDeleting(true)
                      try {
                        await fetch(`/api/photos?id=${deletePhoto.id}`, { method: 'DELETE' })
                        setPhotos(photos => photos.filter(p => p.id !== deletePhoto.id))
                        setDeletePhoto(null)
                      } finally {
                        setDeleting(false)
                      }
                    }}>Delete</button>
                    <button className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded" onClick={() => setDeletePhoto(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'comments' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Event Comments</h2>
            {activeEventId ? (
              <div className="space-y-2">
                {comments
                  .filter((comment) => !comment.photoId) // Only show event comments (no photoId)
                  .map((comment) => (
                    <div key={comment.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{comment.comment}</p>
                          <p className="text-sm text-gray-400">
                            {comment.commenterName || 'Anonymous'} • {comment.createdAt!==null ? new Date(comment.createdAt).toLocaleString() : ''}
                          </p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-300 text-sm">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-400">Select an event to view comments</p>
            )}
          </div>
        )}

        {!loading && activeTab === 'playlist' && currentPlaylist && (
          <div className="flex gap-8">
            {/* Photos Table */}
            <div className="w-1/2 overflow-x-auto">
              <h2 className="text-lg font-semibold mb-2">Photos</h2>
              <table className="min-w-full bg-gray-800 rounded-lg">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Photo</th>
                    <th className="px-4 py-2 text-left">Uploader</th>
                    <th className="px-4 py-2 text-left">Comments</th>
                    <th className="px-4 py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPlaylist.photoStream
                    .slice()
                    .sort((a, b) => a.index - b.index)
                    .map(photo => {
                      // Format date: hide date if today
                      const created = photo.dateTaken;
                      let createdDisplay = '';
                      if (created) {
                        const d = new Date(created);
                        const now = new Date();
                        const isToday = d.toDateString() === now.toDateString();
                        createdDisplay = isToday
                          ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : d.toLocaleString();
                      }
                      return (
                        <tr key={photo.photoId} className="border-b border-gray-700">
                          <td className="px-4 py-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo.photoUrl} alt="Photo" className="w-24 h-16 object-cover rounded" />
                          </td>
                          <td className="px-4 py-2">{photo.uploaderName || 'Anonymous'}</td>
                          <td className="px-4 py-2 whitespace-pre-line text-xs text-gray-300">
                            {photo.comments.length > 0
                              ? photo.comments.map((c) => `${c.commenterName || 'Anonymous'}: ${c.comment}`).join('\n')
                              : <span className="text-gray-500">No comments</span>}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-400">{createdDisplay}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            {/* Event Comments Table */}
            <div className="w-1/2 overflow-x-auto">
              <h2 className="text-lg font-semibold mb-2">Event Comments</h2>
              <table className="min-w-full bg-gray-800 rounded-lg">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Comment</th>
                    <th className="px-4 py-2 text-left">By</th>
                    <th className="px-4 py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPlaylist.eventCommentStream.length > 0 ? (
                    currentPlaylist.eventCommentStream
                      .slice()
                      .sort((a, b) => a.index - b.index)
                      .map((comment, idx) => {
                        // Assume comment has a createdAt field (if not, fallback to index)
                        const created = comment.createdAt;
                        let createdDisplay = '';
                        if (created) {
                          const d = new Date(created);
                          const now = new Date();
                          const isToday = d.toDateString() === now.toDateString();
                          createdDisplay = isToday
                            ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : d.toLocaleString();
                        }
                        return (
                          <tr key={idx} className="border-b border-gray-700">
                            <td className="px-4 py-2">{comment.comment}</td>
                            <td className="px-4 py-2">{comment.commenterName || 'Anonymous'}</td>
                            <td className="px-4 py-2 text-xs text-gray-400">{createdDisplay}</td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr><td colSpan={3} className="px-4 py-2 text-gray-500">No event comments</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && activeTab === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Settings</h2>
            <p className="text-gray-400">Settings configuration coming soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Add PhotoEditPopup component inline for now
function PhotoEditPopup({ photo, onClose, onSave }: { photo: PhotoStreamItem, onClose: () => void, onSave: (updated: PhotoStreamItem) => void }) {
  const [meta, setMeta] = useState({
                uploaderName: photo.uploaderName || '',
    location: photo.location || '',
          dateTaken: photo.dateTaken ? photo.dateTaken.slice(0, 10) : '',
    visible: photo.visible,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      // Call backend API to update photo
      const res = await fetch(`/api/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: photo.id,
          eventId: photo.eventId,
          uploaderName: meta.uploaderName,
          location: meta.location,
          dateTaken: meta.dateTaken ? meta.dateTaken : null,
          visible: meta.visible,
        })
      })
      if (!res.ok) throw new Error('Failed to update photo')
      onSave({ ...photo, ...meta })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update photo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white text-black rounded-lg p-6 w-full max-w-sm relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">Edit Photo</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-sm font-medium">Name</label>
          <input type="text" maxLength={10} className="w-full mb-3 px-3 py-2 border rounded" value={meta.uploaderName} onChange={e => setMeta(m => ({ ...m, uploaderName: e.target.value }))} />
          <label className="block mb-2 text-sm font-medium">Location</label>
          <input type="text" className="w-full mb-3 px-3 py-2 border rounded" value={meta.location} onChange={e => setMeta(m => ({ ...m, location: e.target.value }))} />
          <label className="block mb-2 text-sm font-medium">Date</label>
          <input type="date" className="w-full mb-3 px-3 py-2 border rounded" value={meta.dateTaken} onChange={e => setMeta(m => ({ ...m, dateTaken: e.target.value }))} />
          <label className="flex items-center mb-4">
            <input type="checkbox" className="mr-2" checked={meta.visible} onChange={e => setMeta(m => ({ ...m, visible: e.target.checked }))} />
            Visible
          </label>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" disabled={saving}>Save</button>
            <button type="button" className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
} 