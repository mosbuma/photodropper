import path from 'path'
import { promises as fs } from 'fs'

export function getPhotoUploadPath(): string {
  return process.env.PHOTO_UPLOAD_PATH || path.join(process.cwd(), 'photos')
}

export function isSafeFilename(filename: string): boolean {
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false
  }
  return true
}

export function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.gif':
      return 'image/gif'
    case '.webp':
      return 'image/webp'
    case '.heic':
    case '.heif':
      return 'image/heic'
    case '.bmp':
      return 'image/bmp'
    case '.tiff':
    case '.tif':
      return 'image/tiff'
    case '.mp4':
      return 'video/mp4'
    case '.webm':
      return 'video/webm'
    case '.mov':
      return 'video/quicktime'
    case '.m4v':
      return 'video/x-m4v'
    case '.mkv':
      return 'video/x-matroska'
    case '.avi':
      return 'video/x-msvideo'
    default:
      return 'application/octet-stream'
  }
}

export function getThumbnailFilename(fileName: string): string {
  const ext = path.extname(fileName)
  const base = fileName.slice(0, -ext.length)
  return `${base}_thumb.jpg`
}

export async function deletePhotoFiles(photoUrl: string, thumbnailUrl?: string | null) {
  const uploadPath = getPhotoUploadPath()
  const results: { file: string; success: boolean; message: string }[] = []

  const urls = [photoUrl, thumbnailUrl].filter(Boolean) as string[]
  for (const url of urls) {
    if (!url.startsWith('/api/photos/view/')) {
      results.push({ file: url, success: false, message: 'Unsupported URL' })
      continue
    }
    const fileName = url.split('/').pop()
    if (!fileName || !isSafeFilename(fileName)) {
      results.push({ file: url, success: false, message: 'Invalid filename' })
      continue
    }
    const filePath = path.join(uploadPath, fileName)
    try {
      await fs.unlink(filePath)
      results.push({ file: fileName, success: true, message: 'Deleted' })
    } catch {
      results.push({ file: fileName, success: false, message: 'Not found' })
    }
  }

  return results
}
