import React, { useRef, useLayoutEffect, useState } from 'react'

interface BaseBubbleProps {
  text?: string
  image: string // path to PNG/SVG
  fadeIn?: boolean
  fadeOut?: boolean
  className?: string
  children?: React.ReactNode
}

export default function BaseBubble({ text, image, fadeIn, fadeOut, className = '', children }: BaseBubbleProps) {
  // Fade in/out classes
  const fadeClass = fadeIn
    ? 'opacity-100 transition-opacity duration-700'
    : fadeOut
      ? 'opacity-0 transition-opacity duration-700'
      : 'opacity-100'

  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(32)

  // Auto-fit font size logic
  useLayoutEffect(() => {
    if (!textRef.current || !containerRef.current) return
    const container = containerRef.current
    const textEl = textRef.current
    let size = 32
    const minSize = 8
    const maxSize = 40
    textEl.style.fontSize = `${size}px`
    textEl.style.lineHeight = '1.1'
    textEl.style.wordBreak = 'break-word'
    // Shrink font size until it fits or hits minSize
    while ((textEl.scrollWidth > container.clientWidth - 16 || textEl.scrollHeight > container.clientHeight - 16) && size > minSize) {
      size -= 1
      textEl.style.fontSize = `${size}px`
    }
    // Grow font size if there's extra space (but not above maxSize)
    while ((textEl.scrollWidth < container.clientWidth - 64 && textEl.scrollHeight < container.clientHeight - 64) && size < maxSize) {
      size += 1
      textEl.style.fontSize = `${size}px`
      // If growing causes overflow, step back
      if (textEl.scrollWidth > container.clientWidth - 16 || textEl.scrollHeight > container.clientHeight - 16) {
        size -= 1
        textEl.style.fontSize = `${size}px`
        break
      }
    }
    setFontSize(size)
  }, [text, children])

  return (
    <div
      className={`relative flex items-center justify-center select-none ${fadeClass} ${className}`}
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        width: 500,
        height: 300,
        minWidth: 200,
        minHeight: 100,
        maxWidth: '90vw',
        maxHeight: '40vh',
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <div
      ref={containerRef}
        className="bubble-content absolute inset-0 pl-24 pr-36 pt-10 pb-16 flex items-center justify-center"
        style={{ pointerEvents: 'none' }}
      >
        <div
          ref={textRef}
          className="w-full h-full flex items-center justify-center text-center text-black font-comic whitespace-pre-line"
          style={{ fontSize, lineHeight: 1.1, wordBreak: 'break-word', padding: '0 1.5rem' }}
        >
          {children || text}
        </div>
      </div>
    </div>
  )
} 