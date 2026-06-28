export const MAX_IMAGE_BYTES = 20 * 1024 * 1024
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024

export type MediaKind = 'image' | 'video'

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif|bmp|tiff)$/i
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|mkv|avi)$/i

const RISKY_VIDEO_EXT = /\.(mov|mkv|avi|hevc|h265)$/i
const RISKY_VIDEO_MIME = /video\/(quicktime|x-matroska|hevc|h265)/i

export function getMediaKind(file: File): MediaKind | null {
  if (file.type.startsWith('image/') || IMAGE_EXT.test(file.name)) return 'image'
  if (file.type.startsWith('video/') || VIDEO_EXT.test(file.name)) return 'video'
  return null
}

export function getUploadValidationError(file: File): string | null {
  const kind = getMediaKind(file)
  if (!kind) {
    return 'Kies een foto of video (JPEG, PNG, MP4, MOV, enz.).'
  }
  const maxBytes = kind === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (file.size > maxBytes) {
    if (kind === 'video') {
      return 'Video is te groot (max. 500 MB).'
    }
    return 'Foto is te groot (max. 20 MB). Probeer een kleinere afbeelding of lagere camerakwaliteit.'
  }
  return null
}

export function getVideoCompatibilityWarning(file: File): string | null {
  if (getMediaKind(file) !== 'video') return null
  if (RISKY_VIDEO_EXT.test(file.name) || RISKY_VIDEO_MIME.test(file.type)) {
    return 'Dit formaat werkt mogelijk niet in je TV-browser. MP4 (H.264) is het meest betrouwbaar.'
  }
  return null
}

export function formatFileDate(file: File): string {
  return new Date(file.lastModified).toISOString().slice(0, 19).replace('T', ' ')
}

export async function getVideoDurationMs(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(video.duration) ? Math.round(video.duration * 1000) : null)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    video.src = url
  })
}

export async function captureVideoThumbnail(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    const cleanup = () => URL.revokeObjectURL(url)

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration > 0 ? video.duration * 0.1 : 1)
    }

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 360
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          cleanup()
          resolve(null)
          return
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            cleanup()
            resolve(blob)
          },
          'image/jpeg',
          0.85
        )
      } catch {
        cleanup()
        resolve(null)
      }
    }

    video.onerror = () => {
      cleanup()
      resolve(null)
    }

    video.src = url
  })
}
