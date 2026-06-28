import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Fetch a single photo by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`GET /api/photos/${id} called`)
    
    const photo = await prisma.photo.findUnique({
      where: { id },
      include: {
        comments: {
          where: { visible: true },
          orderBy: { index: 'asc' }
        }
      }
    })
    
    if (!photo) {
      return NextResponse.json({ error: 'Foto niet gevonden' }, { status: 404 })
    }
    
    console.log(`Found photo: ${photo.photoUrl}`)
    return NextResponse.json(photo)
  } catch (error) {
    console.error('Error fetching photo:', error)
    return NextResponse.json({ error: 'Kon foto niet laden' }, { status: 500 })
  }
} 