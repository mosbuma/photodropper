import React, { useEffect, useState } from 'react'
import BaseBubble from './BaseBubble'

const TAIL_IMAGES = [
  '/balloons/BUBBLE-TAIL-ROUND.png',
  '/balloons/BUBBLE-TAIL-SQUARE.png',
]

interface Comment {
  id?: string | number
  comment: string
  commenterName?: string
}

interface PhotoCommentBubbleProps {
  comments: Comment[]
  photoId: string
  intervalMs?: number
}

export default function PhotoCommentBubble({ comments, photoId, intervalMs = 4000 }: PhotoCommentBubbleProps) {
  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState<'in' | 'out'>('in')
  const [bubbleStyle, setBubbleStyle] = useState(TAIL_IMAGES[0])

  // Reset on photo change
  useEffect(() => {
    setIndex(0)
    setBubbleStyle(TAIL_IMAGES[Math.floor(Math.random() * TAIL_IMAGES.length)])
  }, [photoId, comments.length])

  // Loop through comments with fade in/out
  useEffect(() => {
    if (!comments.length) return
    setFade('in')
    const showTimer = setTimeout(() => setFade('out'), intervalMs - 700)
    const nextTimer = setTimeout(() => {
      setIndex(i => (i + 1) % comments.length)
      setBubbleStyle(TAIL_IMAGES[Math.floor(Math.random() * TAIL_IMAGES.length)])
      setFade('in')
    }, intervalMs)
    return () => { clearTimeout(showTimer); clearTimeout(nextTimer) }
  }, [index, comments, intervalMs])

  if (!comments.length) return null
  const comment = comments[index]
  const text = comment.commenterName ? `${comment.comment}\n— ${comment.commenterName}` : comment.comment

  return (
    <div className="absolute left-8 bottom-8 z-50">
      <BaseBubble
        text={text}
        image={bubbleStyle}
        fadeIn={fade === 'in'}
        fadeOut={fade === 'out'}
      />
    </div>
  )
} 