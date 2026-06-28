'use client'

interface MediaThumbnailProps {
  photoUrl: string
  thumbnailUrl?: string | null
  mediaType?: 'image' | 'video'
  className?: string
  alt?: string
  videoMuted?: boolean
  videoLoop?: boolean
  videoControls?: boolean
}

export default function MediaThumbnail({
  photoUrl,
  thumbnailUrl,
  mediaType = 'image',
  className = '',
  alt = 'Media preview',
  videoMuted = true,
  videoLoop = false,
  videoControls = false,
}: MediaThumbnailProps) {
  const isVideo = mediaType === 'video'
  const previewSrc = thumbnailUrl || photoUrl

  if (isVideo && !thumbnailUrl) {
    return (
      <video
        src={photoUrl}
        className={className}
        muted={videoMuted}
        loop={videoLoop}
        controls={videoControls}
        playsInline
        preload="metadata"
      />
    )
  }

  if (isVideo && thumbnailUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={thumbnailUrl} alt={alt} className={className} />
    )
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={previewSrc} alt={alt} className={className} />
  )
}
