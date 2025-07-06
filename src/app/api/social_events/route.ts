import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { socialEventSchema } from '@/types/zodSchemas'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET: List all social events
export async function GET() {
  try {
    console.log('GET /api/social_events called')
    
    const events = await prisma.socialEvent.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`Found ${events.length} events`)
    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

// POST: Create a new social event
export async function POST(req: NextRequest) {
  try {
    console.log('POST /api/social_events called')
    
    const body = await req.json()
    console.log('Request body:', body)
    
    const parse = socialEventSchema.safeParse(body)
    if (!parse.success) {
      console.error('Validation error:', parse.error.flatten())
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 })
    }
    
    console.log('Parsed data:', parse.data)
    
    const event = await prisma.socialEvent.create({
      data: parse.data
    })
    
    console.log('Created event:', event)
    return NextResponse.json(event)
    
  } catch (error) {
    console.error('Unexpected error in POST /api/social_events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update an event (requires authentication)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    
    const parse = socialEventSchema.partial().safeParse(rest)
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 })
    }
    
    const event = await prisma.socialEvent.update({
      where: { id },
      data: parse.data
    })
    
    return NextResponse.json(event)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

// DELETE: Delete an event (requires authentication)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    // Get event ID from URL parameters
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    
    // Get all photos for this event first
    const photos = await prisma.photo.findMany({
      where: { eventId: id },
      select: { id: true }
    })
    
    // Delete each photo individually (this will handle storage cleanup)
    const photoDeletionResults = []
    for (const photo of photos) {
      try {
        const response = await fetch('/api/photos', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: photo.id })
        })
        
        if (response.ok) {
          const result = await response.json()
          photoDeletionResults.push({ photoId: photo.id, success: true, cleanup: result.cleanup })
        } else {
          photoDeletionResults.push({ photoId: photo.id, success: false, error: 'Failed to delete photo' })
        }
      } catch (error) {
        photoDeletionResults.push({ photoId: photo.id, success: false, error: `Error: ${error}` })
      }
    }
    
    // Delete the event (this will cascade delete any remaining comments)
    await prisma.socialEvent.delete({
      where: { id }
    })
    
    const successfulDeletions = photoDeletionResults.filter(r => r.success).length
    const failedDeletions = photoDeletionResults.filter(r => !r.success).length
    
    return NextResponse.json({ 
      success: true,
      photoDeletionResults,
      message: `Event deleted successfully. Deleted ${successfulDeletions} photos${failedDeletions > 0 ? `, ${failedDeletions} failed` : ''}.`
    })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
} 