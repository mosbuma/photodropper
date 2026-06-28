import { z } from 'zod'

export const socialEventSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  accessCode: z.string().min(4).max(32).regex(/^[A-Za-z0-9]+$/).optional(),
  regenerateAccessCode: z.boolean().optional(),
  photoDurationMs: z.number().int().min(1000).max(60000).default(5000),
  scrollSpeedPct: z.number().int().min(0).max(100).default(50),
  commentStyle: z.enum(['TICKER', 'COMICBOOK']).default('TICKER'),
  enablePhotoComments: z.boolean().default(true),
  enableEventComments: z.boolean().default(false),
})

export const photoSchema = z.object({
  eventId: z.string().uuid(),
  index: z.number().int(),
  photoUrl: z
    .string()
    .min(1)
    .refine(
      (value) => value.startsWith('/api/photos/view/') || z.string().url().safeParse(value).success,
      { message: 'photoUrl must be a local view path or absolute URL' }
    ),
  mediaType: z.enum(['image', 'video']).optional(),
  durationMs: z.number().int().positive().nullable().optional(),
  thumbnailUrl: z
    .string()
    .nullable()
    .optional()
    .refine(
      (value) =>
        !value ||
        value.startsWith('/api/photos/view/') ||
        z.string().url().safeParse(value).success,
      { message: 'thumbnailUrl must be a local view path or absolute URL' }
    ),
  mimeType: z.string().max(64).nullable().optional(),
  uploaderName: z.string().max(100).optional(),
  dateTaken: z.string().optional(),
  coordinates: z.string().optional(),
  location: z.string().optional(),
  visible: z.boolean().optional(),
  flaggedNotOk: z.boolean().optional(),
  showFrom: z.string().optional(),
  showTo: z.string().optional(),
})

export const commentSchema = z.object({
  eventId: z.string().uuid(),
  accessCode: z.string().min(4).max(32).optional(),
  photoId: z.string().uuid().nullable().optional(),
  index: z.number().int(),
  comment: z.string().min(1).max(100),
  commenterName: z.string().max(10).optional().nullable(),
  visible: z.boolean().optional(),
  showFrom: z.string().optional(),
  showTo: z.string().optional(),
}) 