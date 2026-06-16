'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CommentStreamItem } from '@/lib/slices/appSlice'

type BeltItem =
  | { key: string; type: 'gap'; width: number }
  | { key: string; type: 'separator' }
  | { key: string; type: 'comment'; comment: CommentStreamItem; photoId: string; commentId: string }

interface TickerRowProps {
  comments?: CommentStreamItem[]
  photoComments?: CommentStreamItem[]
  photoId?: string
  resetKey?: string
  scrollSpeed?: number
  className?: string
  extraStyle?: React.CSSProperties
  variant?: 'feed' | 'loop'
  alwaysVisible?: boolean
}

function TickerTextSeparator() {
  return (
    <span className="inline-block px-8 text-current opacity-75" aria-hidden="true">
      ■
    </span>
  )
}

function CommentSegment({
  comments,
  keySuffix = '',
}: {
  comments: CommentStreamItem[]
  keySuffix?: string
}) {
  return (
    <>
      {comments.map((comment, index) => (
        <span key={`${comment.id}${keySuffix}`} className="inline-flex items-center">
          {index > 0 && <TickerTextSeparator />}
          <span className="inline-block">
            {comment.comment}
            {comment.commenterName && <span> — {comment.commenterName}</span>}
          </span>
        </span>
      ))}
    </>
  )
}

function BeltTrack({ items }: { items: BeltItem[] }) {
  return (
    <>
      {items.map((item) => {
        if (item.type === 'gap') {
          return (
            <span
              key={item.key}
              data-belt-key={item.key}
              data-belt-type="gap"
              className="inline-block shrink-0"
              style={{ width: item.width }}
              aria-hidden="true"
            />
          )
        }

        if (item.type === 'separator') {
        return (
          <span
            key={item.key}
            data-belt-key={item.key}
            data-belt-type="separator"
            className="inline-flex items-center"
          >
            <TickerTextSeparator />
          </span>
        )
      }

        return (
          <span
            key={item.key}
            data-belt-key={item.key}
            data-belt-type="comment"
            data-photo-id={item.photoId}
            data-comment-id={item.commentId}
            className="inline-flex items-center"
          >
            {item.comment.comment}
            {item.comment.commenterName && <span> — {item.comment.commenterName}</span>}
          </span>
        )
      })}
    </>
  )
}

function pixelsPerSecond(scrollSpeed: number): number {
  if (scrollSpeed <= 0) return 0
  return scrollSpeed * 2.5
}

function computeOffscreenGap(
  containerWidth: number,
  translateX: number,
  beltWidth: number
): number {
  if (beltWidth <= 0) return 0
  return Math.max(0, containerWidth - translateX - beltWidth)
}

function applyTrackTransform(track: HTMLElement, translateX: number) {
  track.style.transform = `translate3d(${translateX}px, 0, 0)`
}

const TICKER_ROW_HEIGHT_PX = 104

function FeedTickerRow({
  photoComments = [],
  photoId,
  resetKey,
  scrollSpeed = 50,
  className = '',
  extraStyle,
  alwaysVisible = false,
}: Omit<TickerRowProps, 'variant' | 'comments'>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const translateRef = useRef(0)
  const initializedRef = useRef(false)
  const itemKeyRef = useRef(0)
  const lastPhotoIdRef = useRef<string | null>(null)
  const seenForCurrentPhotoRef = useRef(new Set<string>())
  const photoIdRef = useRef<string | undefined>(photoId)
  const commentsLookupRef = useRef(new Map<string, CommentStreamItem>())
  const beltItemsRef = useRef<BeltItem[]>([])
  const pendingAppendsRef = useRef<CommentStreamItem[]>([])
  const pendingAppendPhotoIdRef = useRef<string | null>(null)
  const pendingAnchorFixRef = useRef<number | null>(null)

  const [beltItems, setBeltItems] = useState<BeltItem[]>([])

  photoIdRef.current = photoId
  beltItemsRef.current = beltItems

  const hasContent = beltItems.length > 0
  const showBar = alwaysVisible || hasContent

  const buildBeltItemsRef = useRef<(targetPhotoId: string, comments: CommentStreamItem[]) => BeltItem[]>(() => [])

  buildBeltItemsRef.current = (targetPhotoId: string, comments: CommentStreamItem[]) => {
    const items: BeltItem[] = []
    for (const comment of comments) {
      commentsLookupRef.current.set(comment.id, comment)
      items.push({ key: `sep-${itemKeyRef.current++}`, type: 'separator' })
      items.push({
        key: `cmt-${itemKeyRef.current++}`,
        type: 'comment',
        comment,
        photoId: targetPhotoId,
        commentId: comment.id,
      })
    }
    return items
  }

  const queueComments = (targetPhotoId: string, comments: CommentStreamItem[]) => {
    if (comments.length === 0) return
    pendingAppendPhotoIdRef.current = targetPhotoId
    pendingAppendsRef.current.push(...comments)
  }

  const flushPendingAppends = () => {
    const comments = pendingAppendsRef.current
    const targetPhotoId = pendingAppendPhotoIdRef.current
    if (comments.length === 0 || !targetPhotoId) return

    pendingAppendsRef.current = []
    pendingAppendPhotoIdRef.current = null

    const container = containerRef.current
    const track = trackRef.current
    const beltWidth = track?.scrollWidth ?? 0
    const translateX = translateRef.current
    const containerWidth = container?.offsetWidth ?? 0
    const gapWidth = computeOffscreenGap(containerWidth, translateX, beltWidth)

    const newItems: BeltItem[] = []
    if (gapWidth > 0) {
      newItems.push({ key: `gap-${itemKeyRef.current++}`, type: 'gap', width: gapWidth })
    }
    newItems.push(...buildBeltItemsRef.current(targetPhotoId, comments))
    setBeltItems((prev) => [...prev, ...newItems])
  }

  useEffect(() => {
    lastPhotoIdRef.current = null
    seenForCurrentPhotoRef.current.clear()
    commentsLookupRef.current.clear()
    itemKeyRef.current = 0
    initializedRef.current = false
    translateRef.current = 0
    pendingAppendsRef.current = []
    pendingAppendPhotoIdRef.current = null
    pendingAnchorFixRef.current = null
    setBeltItems([])
    if (trackRef.current) {
      applyTrackTransform(trackRef.current, 0)
    }
  }, [resetKey])

  useLayoutEffect(() => {
    if (!photoId) return

    if (photoId !== lastPhotoIdRef.current) {
      lastPhotoIdRef.current = photoId
      seenForCurrentPhotoRef.current = new Set()
      queueComments(photoId, photoComments)
      photoComments.forEach((c) => seenForCurrentPhotoRef.current.add(c.id))
    } else {
      const newComments = photoComments.filter((c) => !seenForCurrentPhotoRef.current.has(c.id))
      if (newComments.length > 0) {
        newComments.forEach((c) => seenForCurrentPhotoRef.current.add(c.id))
        queueComments(photoId, newComments)
      }
    }
  }, [photoComments, photoId])

  useLayoutEffect(() => {
    const track = trackRef.current
    const container = containerRef.current
    if (!track || !container) return

    flushPendingAppends()

    if (pendingAnchorFixRef.current !== null && track.children.length > 0) {
      const anchor = track.children[0] as HTMLElement
      const delta = pendingAnchorFixRef.current - anchor.getBoundingClientRect().left
      if (Math.abs(delta) > 0.5) {
        translateRef.current += delta
      }
      pendingAnchorFixRef.current = null
    }

    if (
      !initializedRef.current &&
      beltItemsRef.current.length > 0 &&
      container.offsetWidth > 0 &&
      translateRef.current === 0
    ) {
      translateRef.current = container.offsetWidth
      initializedRef.current = true
    }

    if (initializedRef.current && beltItemsRef.current.length > 0) {
      applyTrackTransform(track, translateRef.current)
    }
  })

  useEffect(() => {
    const speed = pixelsPerSecond(scrollSpeed)
    if (speed <= 0) return

    let rafId = 0
    let lastTime = performance.now()

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000
      lastTime = now

      const container = containerRef.current
      const track = trackRef.current
      const currentPhotoId = photoIdRef.current

      if (track && beltItemsRef.current.length > 0) {
        translateRef.current -= speed * dt
        applyTrackTransform(track, translateRef.current)

        if (container && pendingAnchorFixRef.current === null) {
          const containerLeft = container.getBoundingClientRect().left
          const keysToRemove: string[] = []
          const recycleComments: CommentStreamItem[] = []
          let prunedWidth = 0

          for (const child of Array.from(track.children)) {
            const element = child as HTMLElement
            const rect = element.getBoundingClientRect()
            if (rect.right >= containerLeft) break

            const key = element.dataset.beltKey
            if (!key) break

            if (element.dataset.beltType === 'comment') {
              const commentPhotoId = element.dataset.photoId
              const commentId = element.dataset.commentId
              if (
                currentPhotoId &&
                commentPhotoId === currentPhotoId &&
                commentId
              ) {
                const comment = commentsLookupRef.current.get(commentId)
                if (comment) recycleComments.push(comment)
              }
            }

            prunedWidth += element.offsetWidth
            keysToRemove.push(key)
          }

          if (keysToRemove.length > 0) {
            const anchorEl = track.children[keysToRemove.length] as HTMLElement | undefined
            if (anchorEl) {
              pendingAnchorFixRef.current = anchorEl.getBoundingClientRect().left
            }

            const beltWidthAfterPrune = track.scrollWidth - prunedWidth
            const gapWidth = computeOffscreenGap(
              container.offsetWidth,
              translateRef.current,
              beltWidthAfterPrune
            )

            setBeltItems((prev) => {
              const remaining = prev.filter((item) => !keysToRemove.includes(item.key))
              if (recycleComments.length === 0 || !currentPhotoId) {
                return remaining
              }

              const appended: BeltItem[] = []
              if (gapWidth > 0) {
                appended.push({ key: `gap-${itemKeyRef.current++}`, type: 'gap', width: gapWidth })
              }
              appended.push(...buildBeltItemsRef.current(currentPhotoId, recycleComments))
              return [...remaining, ...appended]
            })
          }
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [scrollSpeed])

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden whitespace-nowrap flex items-center ${className}${showBar ? '' : ' invisible'}`}
      style={{ height: TICKER_ROW_HEIGHT_PX, ...extraStyle }}
      aria-hidden={!hasContent}
    >
      <div
        ref={trackRef}
        className="inline-flex items-center whitespace-nowrap will-change-transform"
        style={{ backfaceVisibility: 'hidden' }}
      >
        <BeltTrack items={beltItems} />
      </div>
    </div>
  )
}

function LoopTickerRow({
  comments = [],
  scrollSpeed = 50,
  className = '',
  extraStyle,
  alwaysVisible = false,
}: Omit<TickerRowProps, 'variant' | 'photoComments' | 'resetKey'>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const segmentRef = useRef<HTMLSpanElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [segmentWidth, setSegmentWidth] = useState(0)

  const hasComments = comments.length > 0

  useEffect(() => {
    const container = containerRef.current
    const segment = segmentRef.current
    if (!container || !segment) return

    const update = () => {
      setContainerWidth(container.offsetWidth)
      setSegmentWidth(segment.offsetWidth)
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(container)
    ro.observe(segment)
    return () => ro.disconnect()
  }, [comments, scrollSpeed])

  if (!hasComments && !alwaysVisible) return null

  const speed = pixelsPerSecond(scrollSpeed)
  const loopDistance = containerWidth + segmentWidth
  const duration = speed > 0 && loopDistance > 0 ? loopDistance / speed : 0
  const isScrolling = hasComments && duration > 0 && containerWidth > 0 && segmentWidth > 0

  return (
    <>
      <style>{`
        @keyframes ticker-from-right {
          from { transform: translateX(var(--ticker-start, 0px)); }
          to { transform: translateX(var(--ticker-end, 0px)); }
        }
      `}</style>
      <div
        ref={containerRef}
        className={`overflow-hidden whitespace-nowrap flex items-center ${className}`}
        style={{ height: TICKER_ROW_HEIGHT_PX, ...extraStyle }}
        aria-hidden={!hasComments}
      >
        {hasComments ? (
          <div
            className="inline-flex items-center whitespace-nowrap will-change-transform"
            style={
              isScrolling
                ? {
                    ['--ticker-start' as string]: `${containerWidth}px`,
                    ['--ticker-end' as string]: `${-segmentWidth}px`,
                    animation: `ticker-from-right ${duration}s linear infinite`,
                  }
                : undefined
            }
          >
            <span ref={segmentRef} className="inline-flex items-center whitespace-nowrap">
              <CommentSegment comments={comments} />
            </span>
            <span
              className="inline-block shrink-0"
              style={{ width: containerWidth > 0 ? containerWidth : undefined }}
              aria-hidden="true"
            />
            <span className="inline-flex items-center whitespace-nowrap" aria-hidden="true">
              <CommentSegment comments={comments} keySuffix="-loop" />
            </span>
          </div>
        ) : (
          <span ref={segmentRef} className="inline-block opacity-0 pointer-events-none select-none" aria-hidden="true">
            ■
          </span>
        )}
      </div>
    </>
  )
}

export default function TickerRow({
  variant = 'loop',
  comments,
  photoComments,
  photoId,
  resetKey,
  ...props
}: TickerRowProps) {
  if (variant === 'feed') {
    return <FeedTickerRow photoComments={photoComments} photoId={photoId} resetKey={resetKey} {...props} />
  }
  return <LoopTickerRow comments={comments} {...props} />
}
