import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyEventAccess, verifyEventAccessBySlug } from '@/lib/eventAccess'

const accessSchema = z.object({
  eventId: z.string().uuid().optional(),
  slug: z.string().min(1).max(64).optional(),
  code: z.string().min(4).max(32),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parse = accessSchema.safeParse(body)
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 })
    }

    const { eventId, slug, code } = parse.data

    if (eventId) {
      const ok = await verifyEventAccess(eventId, code)
      if (!ok) {
        return NextResponse.json({ error: 'Ongeldige feestlink of toegangscode' }, { status: 403 })
      }

      const { prisma } = await import('@/lib/prisma')
      const event = await prisma.socialEvent.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          name: true,
          slug: true,
          enablePhotoComments: true,
          enableEventComments: true,
        },
      })
      if (!event) {
        return NextResponse.json({ error: 'Ongeldige feestlink of toegangscode' }, { status: 403 })
      }

      return NextResponse.json({
        ok: true,
        eventId: event.id,
        eventName: event.name,
        slug: event.slug,
      })
    }

    if (slug) {
      const verified = await verifyEventAccessBySlug(slug, code)
      if (!verified) {
        return NextResponse.json({ error: 'Ongeldige feestlink of toegangscode' }, { status: 403 })
      }
      return NextResponse.json({
        ok: true,
        eventId: verified.eventId,
        eventName: verified.name,
        slug,
      })
    }

    return NextResponse.json({ error: 'eventId of slug is verplicht' }, { status: 400 })
  } catch (error) {
    console.error('Error verifying event access:', error)
    return NextResponse.json({ error: 'Kon toegang niet verifiëren' }, { status: 500 })
  }
}
