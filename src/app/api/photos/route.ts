import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { photoSchema } from '@/types/zodSchemas'
import { deletePhotoFiles } from '@/lib/photoStorage'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId')
    const id = searchParams.get('id')

    if (id) {
      const photo = await prisma.photo.findUnique({ where: { id } })
      if (!photo) {
        return NextResponse.json({ error: 'Foto niet gevonden' }, { status: 404 })
      }
      return NextResponse.json(photo)
    }

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is verplicht' }, { status: 400 })
    }

    const photos = await prisma.photo.findMany({
      where: { eventId },
      orderBy: { index: 'asc' },
    })

    return NextResponse.json(photos)
  } catch (error) {
    console.error('Error fetching photos:', error)
    return NextResponse.json({ error: "Kon foto's niet laden" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parse = photoSchema.safeParse(body)

    if (!parse.success) {
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 })
    }

    const photo = await prisma.photo.create({ data: parse.data })
    return NextResponse.json(photo)
  } catch (error) {
    console.error('Error creating photo:', error)
    return NextResponse.json({ error: 'Kon foto niet aanmaken' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...rest } = body
    if (!id) {
      return NextResponse.json({ error: 'Id ontbreekt' }, { status: 400 })
    }

    const updateSchema = photoSchema.partial()
    const parse = updateSchema.safeParse(rest)
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 })
    }

    const photo = await prisma.photo.update({
      where: { id },
      data: parse.data,
    })

    return NextResponse.json(photo)
  } catch (error) {
    console.error('Error updating photo:', error)
    return NextResponse.json({ error: 'Kon foto niet bijwerken' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Id ontbreekt' }, { status: 400 })

    const photo = await prisma.photo.findUnique({
      where: { id },
      select: { photoUrl: true, thumbnailUrl: true },
    })

    if (!photo) {
      return NextResponse.json({ error: 'Foto niet gevonden' }, { status: 404 })
    }

    await prisma.photo.delete({ where: { id } })
    const cleanupResults = await deletePhotoFiles(photo.photoUrl, photo.thumbnailUrl)

    return NextResponse.json({
      success: true,
      cleanup: cleanupResults,
      message: 'Photo deleted successfully.',
    })
  } catch (error) {
    console.error('Error deleting photo:', error)
    return NextResponse.json({ error: 'Kon foto niet verwijderen' }, { status: 500 })
  }
}
