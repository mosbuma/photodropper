'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { setActiveEvent } from '@/lib/slices/appSlice'
import WelcomePopup, { HelpButton } from '@/components/action/WelcomePopup'
import { shouldShowWelcome } from '@/lib/welcomeStorage'
import { verifyAndGrantEventAccess } from '@/lib/eventAccessClient'
import { getEventAccessCode, grantEventAccess, hasEventAccess } from '@/lib/eventAccessStorage'
import { buildActionPath } from '@/lib/eventAccess'

interface PasswordDialogProps {
  onClose: () => void
  onEventSelected?: (eventId: string, code: string) => void
  initialEventId?: string | null
  initialCode?: string | null
}

export default function PasswordDialog({
  onClose,
  onEventSelected,
  initialEventId = null,
  initialCode = null,
}: PasswordDialogProps) {
  const { activeEventId } = useAppSelector(state => state.app)
  const searchParams = useSearchParams()

  const [slug, setSlug] = useState(searchParams.get('slug') || '')
  const [accessCode, setAccessCode] = useState(initialCode || searchParams.get('code') || '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomePersistDismiss, setWelcomePersistDismiss] = useState(true)
  const [welcomeEventName, setWelcomeEventName] = useState<string | undefined>()
  const [pendingSuccess, setPendingSuccess] = useState<{ eventId: string; code: string } | null>(null)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const dialogRef = useRef<HTMLDivElement>(null)
  const autoAttemptedRef = useRef(false)

  const completeAccess = (eventId: string, code: string, eventName?: string) => {
    grantEventAccess(eventId, code)
    dispatch(setActiveEvent(eventId))

    if (shouldShowWelcome()) {
      setWelcomeEventName(eventName)
      setWelcomePersistDismiss(true)
      setPendingSuccess({ eventId, code })
      setShowWelcome(true)
      return
    }

    onEventSelected?.(eventId, code)
    onClose()
  }

  const handleVerify = async (input?: { eventId?: string; slug?: string; code?: string }) => {
    const code = (input?.code ?? accessCode).trim()
    const eventId = input?.eventId ?? initialEventId ?? undefined
    const eventSlug = input?.slug ?? slug.trim()

    if (!code) {
      setError('Voer een toegangscode in.')
      return
    }
    if (!eventId && !eventSlug) {
      setError('Voer de feestlink of feestnaam in.')
      return
    }

    setSubmitting(true)
    setError(null)

    const result = await verifyAndGrantEventAccess({
      eventId: eventId || undefined,
      slug: eventSlug || undefined,
      code,
    })

    setSubmitting(false)

    if (!result.ok || !result.eventId) {
      setError(result.error || 'Ongeldige feestlink of toegangscode.')
      return
    }

    completeAccess(result.eventId, code, result.eventName)
  }

  const handleKijken = async () => {
    const code = accessCode.trim()
    const eventId = initialEventId || undefined
    const eventSlug = slug.trim()

    if (!code) {
      setError('Voer een toegangscode in.')
      return
    }
    if (!eventId && !eventSlug) {
      setError('Voer de feestnaam uit de link in.')
      return
    }

    setSubmitting(true)
    setError(null)

    const result = await verifyAndGrantEventAccess({
      eventId,
      slug: eventSlug || undefined,
      code,
    })

    setSubmitting(false)

    if (!result.ok || !result.eventId) {
      setError(result.error || 'Ongeldige feestlink of toegangscode.')
      return
    }

    grantEventAccess(result.eventId, code)
    onClose()
    router.push(buildActionPath(result.eventId, code))
  }

  const handleWelcomeClose = () => {
    setShowWelcome(false)
    if (pendingSuccess) {
      onEventSelected?.(pendingSuccess.eventId, pendingSuccess.code)
      setPendingSuccess(null)
      onClose()
    }
  }

  const handleAdminLogin = () => {
    onClose()
    router.push('/auth/signin')
  }

  useEffect(() => {
    if (autoAttemptedRef.current) return

    const eventId = initialEventId || activeEventId
    const code = initialCode || searchParams.get('code') || (eventId ? getEventAccessCode(eventId) : null)

    if (eventId && code && (initialCode || searchParams.get('code') || hasEventAccess(eventId))) {
      autoAttemptedRef.current = true
      if (hasEventAccess(eventId) && accessCodesMatchStored(eventId, code)) {
        completeAccess(eventId, code)
        return
      }
      void handleVerify({ eventId, code })
      return
    }

    if (shouldShowWelcome()) {
      setWelcomePersistDismiss(true)
      setShowWelcome(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEventId, initialCode, activeEventId])

  function accessCodesMatchStored(eventId: string, code: string): boolean {
    const stored = getEventAccessCode(eventId)
    return stored?.toUpperCase() === code.trim().toUpperCase()
  }

  const handleClose = () => {
    onClose()
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleOverlayClick}>
      {showWelcome && (
        <WelcomePopup
          eventName={welcomeEventName}
          persistDismiss={welcomePersistDismiss}
          onClose={handleWelcomeClose}
        />
      )}
      <div
        ref={dialogRef}
        className="bg-white text-gray-900 rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Photodropper</h2>
          <HelpButton
            onClick={() => {
              setWelcomePersistDismiss(false)
              setShowWelcome(true)
            }}
            className="text-gray-600 hover:bg-gray-100"
          />
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Deelnemen aan een feest</h3>
          <p className="text-sm text-gray-600 mb-4">
            Gebruik de uitnodigingslink van het feest, of vul hier de feestnaam uit de link en de toegangscode in.
          </p>

          <label className="block text-sm font-medium mb-2">Feest (uit de link)</label>
          <input
            type="text"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            placeholder="bijv. party-auke-2026"
            className="w-full px-3 py-2 bg-white border border-gray-400 rounded text-gray-900 focus:outline-none focus:border-blue-500 mb-4"
          />

          <label className="block text-sm font-medium mb-2">Toegangscode</label>
          <input
            type="text"
            value={accessCode}
            onChange={e => setAccessCode(e.target.value.toUpperCase())}
            placeholder="Bijv. AB12CD34"
            className="w-full px-3 py-2 bg-white border border-gray-400 rounded text-gray-900 focus:outline-none focus:border-blue-500 mb-4 uppercase tracking-widest"
            autoComplete="off"
          />

          {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => void handleVerify()}
              disabled={submitting || !accessCode.trim() || !slug.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded font-medium transition"
            >
              {submitting ? 'Bezig...' : 'INLOGGEN'}
            </button>
            <button
              type="button"
              onClick={() => void handleKijken()}
              disabled={submitting || !accessCode.trim() || (!slug.trim() && !initialEventId)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded font-medium transition"
            >
              Kijken
            </button>
          </div>
        </div>

        <hr className="my-6 border-gray-300" />

        <div>
          <h3 className="text-lg font-semibold mb-2">Beheer</h3>
          <p className="text-sm text-gray-600 mb-4">
            Beheerders loggen in om feesten te beheren en de slideshow te bedienen.
          </p>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleAdminLogin}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-medium transition"
            >
              ADMIN INLOGGEN
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 py-2 px-4 rounded font-medium transition"
            >
              SLUITEN
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
