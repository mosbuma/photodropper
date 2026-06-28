import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readAccessCodeFromBody, requireGuestEventAccess } from '@/lib/eventAccessGuard'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const accessCode = readAccessCodeFromBody(body)

    const photo = await prisma.photo.findUnique({ where: { id } })
    if (!photo) {
      return NextResponse.json({ error: 'Foto niet gevonden' }, { status: 404 })
    }

    const accessDenied = await requireGuestEventAccess(photo.eventId, accessCode)
    if (accessDenied) return accessDenied

    if (photo.flaggedNotOk) {
      return NextResponse.json(photo)
    }

    const updated = await prisma.photo.update({
      where: { id },
      data: { flaggedNotOk: true, visible: false },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error flagging photo:', error)
    return NextResponse.json({ error: 'Kon foto niet markeren' }, { status: 500 })
  }
}
