'use client'

import { useEffect, useState } from 'react'

/** Portrait phones + landscape phones (short viewport height). Excludes desktop/TV. */
export const SLIDESHOW_COMPACT_QUERY =
  '(max-width: 767px), (orientation: landscape) and (max-height: 500px)'

export function useSlideshowCompactUI(): boolean {
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(SLIDESHOW_COMPACT_QUERY)
    const update = () => setCompact(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return compact
}

/** @deprecated use useSlideshowCompactUI */
export function useIsMobile(): boolean {
  return useSlideshowCompactUI()
}

export function useIsLandscape(): boolean {
  const [landscape, setLandscape] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)')
    const update = () => setLandscape(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return landscape
}

/** Short viewports in landscape (phones held sideways). */
export const MOBILE_LANDSCAPE_QUERY = '(orientation: landscape) and (max-height: 500px)'

export function useMobileLandscape(): boolean {
  const [mobileLandscape, setMobileLandscape] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_LANDSCAPE_QUERY)
    const update = () => setMobileLandscape(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return mobileLandscape
}
