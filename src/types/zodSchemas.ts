import { z } from 'zod'

export const socialEventSchema = z.object({
  name: z.string().min(1),
  photoDurationMs: z.number().int().min(1000).max(60000).default(5000),
  scrollSpeedPct: z.number().int().min(0).max(100).default(50),
  commentStyle: z.enum(['TICKER', 'COMICBOOK']).default('TICKER'),
  enablePhotoComments: z.boolean().default(true),
  enableEventComments: z.boolean().default(false),
})

export const photoSchema = z.object({
  eventId: z.string().uuid(),
  index: z.number().int(),
  photoUrl: z.string().url(),
  uploaderName: z.string().max(100).optional(),
  dateTaken: z.string().optional(),
  coordinates: z.string().optional(),
  location: z.string().optional(),
  visible: z.boolean().optional(),
  showFrom: z.string().optional(),
  showTo: z.string().optional(),
})

export const commentSchema = z.object({
  eventId: z.string().uuid(),
  photoId: z.string().uuid().nullable().optional(),
  index: z.number().int(),
  comment: z.string().min(1).max(100),
  commenterName: z.string().max(10).optional().nullable(),
  visible: z.boolean().optional(),
  showFrom: z.string().optional(),
  showTo: z.string().optional(),
}) 