import {
  getUploadValidationError,
  getMediaKind,
  getVideoCompatibilityWarning,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
} from '@/lib/mediaUtils'

export async function getResponseErrorMessage(
  response: Response,
  fallback = 'Upload failed'
): Promise<string> {
  if (response.status === 413) {
    return 'File is too large to upload. Try a smaller file or reduce camera quality.'
  }

  const text = await response.text()
  if (!text) {
    return `${fallback} (${response.status})`
  }

  try {
    const data = JSON.parse(text) as { error?: string }
    return data.error || `${fallback} (${response.status})`
  } catch {
    return `${fallback} (${response.status}). Please try again.`
  }
}

export {
  getMediaKind,
  getUploadValidationError,
  getVideoCompatibilityWarning,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
}

/** @deprecated use getUploadValidationError */
export function getFileSizeError(file: File): string | null {
  return getUploadValidationError(file)
}

/** @deprecated use MAX_IMAGE_BYTES */
export const MAX_UPLOAD_BYTES = MAX_IMAGE_BYTES
