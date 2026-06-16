'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { setActiveEvent } from '@/lib/slices/appSlice'
import type { SocialEvent } from '@prisma/client'

interface PasswordDialogProps {
  onClose: () => void
}

export default function PasswordDialog({ onClose }: PasswordDialogProps) {
  const { activeEventId } = useAppSelector(state => state.app)

  const [events, setEvents] = useState<SocialEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState(activeEventId || '')
  const [loadingEvents, setLoadingEvents] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const dialogRef = useRef<HTMLDivElement>(null)

  const loadEvents = async () => {
    try {
      setLoadingEvents(true)
      const response = await fetch('/api/social_events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoadingEvents(false)
    }
  }

  const handleEventSelect = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedEventId) {
      dispatch(setActiveEvent(selectedEventId))
      onClose()
    }
  }

  const handleAdminLogin = () => {
    onClose()
    router.push('/auth/signin')
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const handleClose = () => {
    setSelectedEventId('')
    onClose()
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleOverlayClick}>
      <div
        ref={dialogRef}
        className="bg-white text-gray-900 rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Photodropper</h2>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Select Event</h3>
          <select
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
            disabled={loadingEvents}
            className="w-full px-3 py-2 bg-white border border-gray-400 rounded text-gray-900 focus:outline-none focus:border-blue-500 mb-4"
          >
            <option value="">Choose an event...</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleEventSelect}
            disabled={!selectedEventId}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded font-medium transition"
          >
            SELECT EVENT
          </button>
        </div>

        <hr className="my-6 border-gray-300" />

        <div>
          <h3 className="text-lg font-semibold mb-2">Admin Access</h3>
          <p className="text-sm text-gray-600 mb-4">
            Sign in with the server admin password to open the management panel.
          </p>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleAdminLogin}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-medium transition"
            >
              SIGN IN
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 py-2 px-4 rounded font-medium transition"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
