'use client'

import { useEffect, useRef, useState } from 'react'
import type { CommentStreamItem } from '@/lib/slices/appSlice'

interface TickerRowProps {
  comments: CommentStreamItem[]
  scrollSpeed?: number
  className?: string
  extraStyle?: React.CSSProperties
}

export default function TickerRow({ comments, scrollSpeed = 50, className = '', extraStyle = undefined }: TickerRowProps) {
  const [position, setPosition] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return

    const container = containerRef.current
    const content = contentRef.current
    const containerWidth = container.offsetWidth
    const contentWidth = content.offsetWidth

    // Don't animate if content fits in container
    if (contentWidth <= containerWidth) {
      setPosition(0)
      return
    }

    // Calculate animation duration based on scroll speed (0-100)
    // Higher speed = faster scroll = shorter duration
    const baseDuration = 30 // seconds for full scroll at 50% speed
    const duration = baseDuration * (100 / scrollSpeed)

    // Calculate total distance to scroll
    const totalDistance = contentWidth - containerWidth

    // Animate from right to left
    const startTime = Date.now()
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000
      const progress = (elapsed % duration) / duration
      
      // Use ease-in-out for smooth start/stop
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
      
      const newPosition = -totalDistance * easeProgress
      setPosition(newPosition)

      requestAnimationFrame(animate)
    }

    animate()
  }, [scrollSpeed])

  return (
    <div 
      ref={containerRef}
      className={`overflow-hidden whitespace-nowrap ${className}`}
      style={extraStyle}
    >
      <div
        ref={contentRef}
        className="inline-block"
        style={{
          transform: `translateX(${position}px)`,
          transition: 'transform 0.1s linear'
        }}
      >
        {comments.map((comment) => (
          <span key={comment.index} className="inline-block mr-8">
            {comment.comment}{comment.commenterName && (
              <span> — {comment.commenterName}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
} 