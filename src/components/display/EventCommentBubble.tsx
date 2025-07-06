import React, { useEffect, useState } from 'react'
import BaseBubble from './BaseBubble'

const NO_TAIL_IMAGES = [
  '/balloons/BUBBLE-NO-TAIL.png',
]

interface Comment {
  id?: string | number
  comment: string
  commenterName?: string
}

interface EventCommentBubbleProps {
  comments: Comment[]
  intervalMs?: number
}

export default function EventCommentBubble({ comments, intervalMs = 4000 }: EventCommentBubbleProps) {
  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState<'in' | 'out'>('in')
  const [bubbleStyle, setBubbleStyle] = useState(NO_TAIL_IMAGES[0])
  const [position, setPosition] = useState({ left: 0, bottom: 0 })

  // Generate random position on left or right side
  const generateRandomPosition = () => {
    const isLeftSide = Math.random() < 0.5
    const bubbleWidthPx = 500
    const marginPx = 16
    const viewportWidth = window.innerWidth || 1920 // fallback for SSR
    let left: number
    if (isLeftSide) {
      left = Math.random() * 25 // 0-25% of screen width (left quarter)
    } else {
      // Pick a left% in 75-100%, but clamp so bubble doesn't overflow
      // Convert percent to px, clamp, then convert back to %
      const minLeftPx = 0
      const maxLeftPx = viewportWidth - bubbleWidthPx - marginPx
      const randomPx = maxLeftPx + Math.random() * (viewportWidth - maxLeftPx - bubbleWidthPx)
      left = (randomPx / viewportWidth) * 100
      // But also allow a little randomness in 75-100% range, so:
      left = Math.max(left, 75)
      left = Math.min(left, 100 - (bubbleWidthPx / viewportWidth) * 100)
    }
    const bottom = 20 + Math.random() * 60 // 20-80% from bottom
    return { left, bottom }
  }

  // Loop through comments with fade in/out
  useEffect(() => {
    if (!comments.length) return
    setFade('in')
    const showTimer = setTimeout(() => setFade('out'), intervalMs - 700)
    const nextTimer = setTimeout(() => {
      setIndex(i => (i + 1) % comments.length)
      setBubbleStyle(NO_TAIL_IMAGES[Math.floor(Math.random() * NO_TAIL_IMAGES.length)])
      setPosition(generateRandomPosition())
      setFade('in')
    }, intervalMs)
    return () => { clearTimeout(showTimer); clearTimeout(nextTimer) }
  }, [index, comments, intervalMs])

  // Set initial position
  useEffect(() => {
    if (comments.length > 0) {
      setPosition(generateRandomPosition())
    }
  }, [comments.length])

  if (!comments.length) return null
  const comment = comments[index]
  const text = comment.commenterName ? `${comment.comment}\n— ${comment.commenterName}` : comment.comment

  return (
    <div 
      className="absolute z-50"
      style={{ 
        left: `${position.left}%`, 
        bottom: `${position.bottom}%` 
      }}
    >
      <BaseBubble
        text={text}
        image={bubbleStyle}
        fadeIn={fade === 'in'}
        fadeOut={fade === 'out'}
      />
    </div>
  )
} 