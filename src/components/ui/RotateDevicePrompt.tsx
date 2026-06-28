'use client'

interface RotateDevicePromptProps {
  message?: string
}

export default function RotateDevicePrompt({
  message = 'Draai je telefoon om verder te gaan',
}: RotateDevicePromptProps) {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
      <div className="mb-4 text-gray-600" aria-hidden="true">
        <svg
          className="h-20 w-20 animate-pulse"
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="18" y="8" width="28" height="48" rx="4" />
          <circle cx="32" cy="50" r="2" fill="currentColor" stroke="none" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 32a12 12 0 0 1 12-12"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 32h6M8 32l4-4" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M56 32a12 12 0 0 0-12-12"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M56 32h-6M56 32l-4-4" />
        </svg>
      </div>
      <p className="text-base font-medium text-gray-800">{message}</p>
    </div>
  )
}
