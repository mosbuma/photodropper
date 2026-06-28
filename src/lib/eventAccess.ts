import { timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'

const ACCESS_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateAccessCode(length = 8): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += ACCESS_CODE_CHARS[Math.floor(Math.random() * ACCESS_CODE_CHARS.length)]
  }
  return code
}

export function slugifyEventName(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

  return slug || 'event'
}

export async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug
  let suffix = 0

  while (true) {
    const existing = await prisma.socialEvent.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    })
    if (!existing) return slug
    suffix += 1
    slug = `${baseSlug}-${suffix}`.slice(0, 64)
  }
}

export function normalizeAccessCode(code: string): string {
  return code.trim().toUpperCase()
}

export function accessCodesMatch(stored: string, provided: string): boolean {
  const a = Buffer.from(normalizeAccessCode(stored))
  const b = Buffer.from(normalizeAccessCode(provided))
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function verifyEventAccess(
  eventId: string,
  code: string
): Promise<boolean> {
  const event = await prisma.socialEvent.findUnique({
    where: { id: eventId },
    select: { accessCode: true },
  })
  if (!event) return false
  return accessCodesMatch(event.accessCode, code)
}

export async function verifyEventAccessBySlug(
  slug: string,
  code: string
): Promise<{ eventId: string; name: string } | null> {
  const event = await prisma.socialEvent.findUnique({
    where: { slug },
    select: { id: true, name: true, accessCode: true },
  })
  if (!event || !accessCodesMatch(event.accessCode, code)) return null
  return { eventId: event.id, name: event.name }
}

export function buildJoinPath(slug: string, code: string): string {
  return `/join/${encodeURIComponent(slug)}?code=${encodeURIComponent(code)}`
}

export function buildActionPath(eventId: string, code: string, photoId?: string): string {
  const params = new URLSearchParams({
    event: eventId,
    code,
  })
  if (photoId) params.set('photo', photoId)
  return `/action?${params.toString()}`
}

export function buildSlideshowPath(eventId: string, code: string): string {
  const params = new URLSearchParams({
    event: eventId,
    code,
  })
  return `/?${params.toString()}`
}

export function stripAccessCode<T extends { accessCode?: string }>(
  event: T
): Omit<T, 'accessCode'> {
  const { accessCode: _removed, ...rest } = event
  return rest
}
