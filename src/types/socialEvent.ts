export interface SocialEvent {
  id: string
  name: string
  slug: string
  accessCode: string
  createdAt: string
  updatedAt: string
  photoDurationMs: number
  scrollSpeedPct: number
  commentStyle: string
  enablePhotoComments?: boolean
  enableEventComments?: boolean
} 