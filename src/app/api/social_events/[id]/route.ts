import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripAccessCode } from '@/lib/eventAccess'

// GET: Fetch a single social event by ID (public metadata only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const event = await prisma.socialEvent.findUnique({
      where: { id },
    })

    if (!event) {
      return NextResponse.json({ error: 'Feest niet gevonden' }, { status: 404 })
    }

    return NextResponse.json(stripAccessCode(event))
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Kon feest niet laden' }, { status: 500 })
  }
}
