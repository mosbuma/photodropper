import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { socialEventSchema } from '@/types/zodSchemas'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  ensureUniqueSlug,
  generateAccessCode,
  normalizeAccessCode,
  slugifyEventName,
} from '@/lib/eventAccess'

async function requireAdminSession() {
  const session = await getServerSession(authOptions)
  return session ?? null
}

// GET: List all social events (admin only)
export async function GET() {
  try {
    const session = await requireAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const events = await prisma.socialEvent.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Kon feesten niet laden' }, { status: 500 })
  }
}

// POST: Create a new social event (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const body = await req.json()
    const parse = socialEventSchema.safeParse(body)
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 })
    }

    const { slug: requestedSlug, accessCode: requestedAccessCode, regenerateAccessCode: _ignored, ...rest } =
      parse.data

    const baseSlug = slugifyEventName(requestedSlug || rest.name)
    const slug = await ensureUniqueSlug(baseSlug)
    const accessCode = normalizeAccessCode(requestedAccessCode || generateAccessCode())

    const event = await prisma.socialEvent.create({
      data: {
        ...rest,
        slug,
        accessCode,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Unexpected error in POST /api/social_events:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}

// PUT: Update an event (requires authentication)
export async function PUT(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

    const body = await req.json()
    const { id, regenerateAccessCode, ...rest } = body
    if (!id) return NextResponse.json({ error: 'Id ontbreekt' }, { status: 400 })

    const parse = socialEventSchema.partial().safeParse(rest)
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 })
    }

    const existing = await prisma.socialEvent.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Feest niet gevonden' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { ...parse.data }
    delete updateData.regenerateAccessCode

    if (parse.data.name && !parse.data.slug) {
      updateData.slug = await ensureUniqueSlug(slugifyEventName(parse.data.name), id)
    } else if (parse.data.slug) {
      updateData.slug = await ensureUniqueSlug(slugifyEventName(parse.data.slug), id)
    }

    if (regenerateAccessCode) {
      updateData.accessCode = generateAccessCode()
    } else if (parse.data.accessCode) {
      updateData.accessCode = normalizeAccessCode(parse.data.accessCode)
    }

    const event = await prisma.socialEvent.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Kon feest niet bijwerken' }, { status: 500 })
  }
}

// DELETE: Delete an event (requires authentication)
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Id-parameter ontbreekt' }, { status: 400 })

    const photos = await prisma.photo.findMany({
      where: { eventId: id },
      select: { id: true },
    })

    const photoDeletionResults = []
    for (const photo of photos) {
      try {
        const response = await fetch('/api/photos', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: photo.id }),
        })

        if (response.ok) {
          const result = await response.json()
          photoDeletionResults.push({ photoId: photo.id, success: true, cleanup: result.cleanup })
        } else {
          photoDeletionResults.push({ photoId: photo.id, success: false, error: 'Kon foto niet verwijderen' })
        }
      } catch (error) {
        photoDeletionResults.push({ photoId: photo.id, success: false, error: `Error: ${error}` })
      }
    }

    await prisma.socialEvent.delete({
      where: { id },
    })

    const successfulDeletions = photoDeletionResults.filter(r => r.success).length
    const failedDeletions = photoDeletionResults.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      photoDeletionResults,
      message: `Event deleted successfully. Deleted ${successfulDeletions} photos${failedDeletions > 0 ? `, ${failedDeletions} failed` : ''}.`,
    })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Kon feest niet verwijderen' }, { status: 500 })
  }
}
