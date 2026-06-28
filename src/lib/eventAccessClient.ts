'use client'

import { grantEventAccess } from '@/lib/eventAccessStorage'

export async function verifyAndGrantEventAccess(input: {
  eventId?: string
  slug?: string
  code: string
}): Promise<{
  ok: boolean
  eventId?: string
  eventName?: string
  slug?: string
  error?: string
}> {
  const response = await fetch('/api/social_events/access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    return {
      ok: false,
      error: typeof data.error === 'string' ? data.error : 'Invalid event or access code',
    }
  }

  if (data.eventId && input.code) {
    grantEventAccess(data.eventId, input.code)
  }

  return {
    ok: true,
    eventId: data.eventId,
    eventName: data.eventName,
    slug: data.slug,
  }
}
