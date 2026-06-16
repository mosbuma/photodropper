export async function getResponseErrorMessage(
  response: Response,
  fallback = 'Upload failed'
): Promise<string> {
  if (response.status === 413) {
    return 'Photo is too large to upload. Try a smaller image or reduce camera quality.'
  }

  const text = await response.text()
  if (!text) {
    return `${fallback} (${response.status})`
  }

  try {
    const data = JSON.parse(text) as { error?: string }
    return data.error || `${fallback} (${response.status})`
  } catch {
    return `${fallback} (${response.status}). Please try again or use a smaller photo.`
  }
}

export function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp|tiff)$/i.test(file.name)
}

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

export function getFileSizeError(file: File): string | null {
  if (!isImageFile(file)) {
    return 'Please choose a photo (JPEG, PNG, HEIC, etc.).'
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'Photo is too large (max 20 MB). Try a smaller image or reduce camera quality.'
  }
  return null
}
