'use client'

import { dismissWelcome } from '@/lib/welcomeStorage'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

interface WelcomePopupProps {
  eventName?: string
  enablePhotoComments?: boolean
  enableEventComments?: boolean
  persistDismiss?: boolean
  onClose: () => void
}

export default function WelcomePopup({
  eventName,
  enablePhotoComments = true,
  enableEventComments = false,
  persistDismiss = true,
  onClose,
}: WelcomePopupProps) {
  const handleDismiss = () => {
    if (persistDismiss) {
      dismissWelcome()
    }
    onClose()
  }

  const showPhotoComments = enablePhotoComments
  const showEventComments = enableEventComments

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const popup = (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4">
      <div className="bg-white text-gray-900 rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-3">Welkom op Photodropper!</h2>

        <p className="mb-4 text-gray-800 leading-relaxed">
          {eventName ? (
            <>
              Alle foto&apos;s en video&apos;s die je hier deelt, worden op het scherm van{' '}
              <strong>&ldquo;{eventName}&rdquo;</strong> getoond — live, voor iedereen in de ruimte.
            </>
          ) : (
            <>
              Alle foto&apos;s en video&apos;s die je hier deelt, worden op het scherm getoond — live,
              voor iedereen in de ruimte.
            </>
          )}
        </p>

        <div className="mb-4 space-y-2 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">Zo werkt het:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-1">
            <li>
              <strong>Uploaden</strong> — deel een foto of video vanaf je telefoon.
            </li>
            <li>
              <strong>QR-code</strong> — op het TV-scherm staat een QR-code. Scan die om
              terug te komen naar deze pagina en te reageren op wat er net getoond werd.
            </li>
            {showPhotoComments && (
              <li>
                <strong>Foto-reactie</strong> — reageer op de foto of video die op het scherm staat.
              </li>
            )}
            {showEventComments && (
              <li>
                <strong>Feest-reactie</strong> — stuur een bericht over het hele feest.
              </li>
            )}
            <li>
              <strong>Niet oké</strong> — staat er iets op het scherm dat niet hoort? Scan de QR-code
              op het scherm en tik op Niet oké. De foto of video verdwijnt meteen van het live scherm;
              de organisator kan het later bekijken.
            </li>
          </ul>
        </div>

        <p className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-950 leading-relaxed">
          <strong>Even sociaal verantwoord:</strong> zou jij het oké vinden als iemand dit over
          jou zou plaatsen? Zo niet? Niet droppen! Bedankt!
        </p>

        <button
          type="button"
          onClick={handleDismiss}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Oké, duidelijk!
        </button>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(popup, document.body)
}

export function HelpButton({
  onClick,
  className = '',
  disabled = false,
}: {
  onClick: () => void
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Hulp"
      title={disabled ? 'Kies eerst een feest' : 'Hulp'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-current text-xs font-bold leading-none">
        ?
      </span>
      Hulp
    </button>
  )
}
