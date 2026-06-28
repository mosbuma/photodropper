'use client'

import { useIsLandscape, useSlideshowCompactUI } from '@/lib/useIsMobile'

interface MobileSlideshowBarProps {
  onUpload: () => void
  onComment: () => void
  onFlagNotOk: () => void
  onHelp: () => void
  showComment?: boolean
  flagDisabled?: boolean
  flagging?: boolean
}

function IconButton({
  onClick,
  disabled,
  ariaLabel,
  className = 'bg-black/70 hover:bg-black/85 text-white',
  children,
}: {
  onClick: () => void
  disabled?: boolean
  ariaLabel: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`flex h-9 w-9 landscape:h-8 landscape:w-8 items-center justify-center rounded-lg border border-white/25 shadow-lg transition-colors disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

export default function MobileSlideshowBar({
  onUpload,
  onComment,
  onFlagNotOk,
  onHelp,
  showComment = true,
  flagDisabled = false,
  flagging = false,
}: MobileSlideshowBarProps) {
  const compactUI = useSlideshowCompactUI()
  const isLandscape = useIsLandscape()

  if (!compactUI) return null

  const layoutClass = isLandscape
    ? 'left-2 top-1/2 -translate-y-1/2 flex-col'
    : 'bottom-2 inset-x-0 flex-row justify-center'

  return (
    <div
      className={`fixed z-30 pointer-events-auto flex gap-1.5 ${layoutClass}`}
      onClick={e => e.stopPropagation()}
    >
      <IconButton onClick={onUpload} ariaLabel="Uploaden">
        <svg className="h-4 w-4 landscape:h-3.5 landscape:w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </IconButton>

      {showComment && (
        <IconButton onClick={onComment} ariaLabel="Foto-reactie">
          <svg className="h-4 w-4 landscape:h-3.5 landscape:w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </IconButton>
      )}

      <IconButton
        onClick={onFlagNotOk}
        disabled={flagDisabled || flagging}
        ariaLabel="Niet oké"
        className="bg-red-950/90 hover:bg-red-900 text-white"
      >
        <svg className="h-4 w-4 landscape:h-3.5 landscape:w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h.01M15 10h.01" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 15q4 4 8 0" />
        </svg>
      </IconButton>

      <IconButton onClick={onHelp} ariaLabel="Hulp">
        <span className="flex h-4 w-4 landscape:h-3.5 landscape:w-3.5 items-center justify-center rounded-full border-2 border-current text-[10px] font-bold leading-none">
          ?
        </span>
      </IconButton>
    </div>
  )
}
