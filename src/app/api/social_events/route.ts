import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { socialEventSchema } from '@/types/zodSchemas'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import path from 'path'
import { promises as fs } from 'fs'

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
    
    // Get all photos for this event before deleting
    const photos = await prisma.photo.findMany({
      where: { eventId: id },
      select: { photoUrl: true }
    })
    
    // Delete the event (this will cascade delete photos and comments due to Prisma schema)
    await prisma.socialEvent.delete({
      where: { id }
    })
    
    // Clean up photo files on disk
    const PHOTO_UPLOAD_PATH = process.env.PHOTO_UPLOAD_PATH || path.join(process.cwd(), 'photos')
    const deletedFiles = []
    const fileErrors = []
    
    for (const photo of photos) {
      try {
        // Extract filename from photoUrl (e.g., "/api/photos/view/filename.jpg" -> "filename.jpg")
        const fileName = photo.photoUrl.split('/').pop()
        if (fileName) {
          const filePath = path.join(PHOTO_UPLOAD_PATH, fileName)
          
          // Check if file exists and delete it
          try {
            await fs.access(filePath)
            await fs.unlink(filePath)
            deletedFiles.push(fileName)
          } catch (fileError) {
            // File doesn't exist or can't be deleted
            console.warn(`Could not delete file ${filePath}:`, fileError)
            fileErrors.push({ file: fileName, error: 'File not found or not accessible' })
          }
        }
      } catch (error) {
        console.error(`Error processing photo file ${photo.photoUrl}:`, error)
        fileErrors.push({ file: photo.photoUrl, error: 'Processing error' })
      }
    }
    
    // Clean up orphaned files (files not linked to any event)
    try {
      const allFiles = await fs.readdir(PHOTO_UPLOAD_PATH)
      const allPhotos = await prisma.photo.findMany({
        select: { photoUrl: true }
      })
      
      const linkedFiles = new Set(
        allPhotos.map(photo => photo.photoUrl.split('/').pop()).filter(Boolean)
      )
      
      for (const file of allFiles) {
        if (!linkedFiles.has(file)) {
          try {
            const filePath = path.join(PHOTO_UPLOAD_PATH, file)
            await fs.unlink(filePath)
            console.log(`Deleted orphaned file: ${file}`)
          } catch (error) {
            console.warn(`Could not delete orphaned file ${file}:`, error)
          }
        }
      }
    } catch (error) {
      console.warn('Error cleaning up orphaned files:', error)
    }
    
    return NextResponse.json({ 
      success: true,
      deletedFiles,
      fileErrors,
      message: `Event deleted successfully. Deleted ${deletedFiles.length} photo files.`
    })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
} 