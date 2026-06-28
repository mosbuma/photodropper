import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const event = await prisma.socialEvent.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        enablePhotoComments: true,
        enableEventComments: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error fetching event by slug:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}
