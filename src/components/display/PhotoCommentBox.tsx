import React, { useRef, useLayoutEffect, useState } from 'react'

interface PhotoCommentBoxProps {
  comment: string
  position?: 'top' | 'bottom'
  color?: 'yellow' | 'blue'
  defaultFontSize?: number
}

export default function PhotoCommentBox({ comment, position = 'bottom', color = 'yellow', defaultFontSize = 40 }: PhotoCommentBoxProps) {
  const textRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(defaultFontSize)

  // Auto-fit font size logic
  useLayoutEffect(() => {
    if (!textRef.current) return
    const container = textRef.current.parentElement as HTMLDivElement
    const textEl = textRef.current
    let size = defaultFontSize
    const minSize = 10
    textEl.style.fontSize = `${size}px`
    textEl.style.lineHeight = '1.1'
    textEl.style.wordBreak = 'break-word'
    // Shrink font size until it fits or hits minSize
    while ((textEl.scrollWidth > container.clientWidth - 32 || textEl.scrollHeight > container.clientHeight - 8) && size > minSize) {
      size -= 1
      textEl.style.fontSize = `${size}px`
    }
    setFontSize(size)
  }, [comment, defaultFontSize])

  const bgColor = color === 'yellow' ? 'bg-yellow-200' : 'bg-blue-200'
  const borderColor = 'border-black'
  const boxShadow = 'shadow-lg'

  return (
    <div
      className={`absolute left-0 w-full px-2 ${position === 'top' ? 'top-0' : 'bottom-0'} z-30 flex justify-center pointer-events-none`}
      style={{}}
    >
      <div
        className={`relative w-full max-w-5xl ${bgColor} ${borderColor} border-4 ${boxShadow} py-2 px-6`}
        style={{ minHeight: 56, margin: '0.5rem 0', fontFamily: 'Comic Neue, cursive' }}
      >
        <div
          ref={textRef}
          className="w-full h-full flex items-center justify-center text-center font-comic text-black whitespace-pre-line"
          style={{ fontSize, lineHeight: 1.1, wordBreak: 'break-word' }}
        >
          {comment}
        </div>
      </div>
    </div>
  )
} 