import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import path from 'path'
import { promises as fs } from 'fs'
import { getPhotoUploadPath, getThumbnailFilename } from '@/lib/photoStorage'
import { getMediaKind } from '@/lib/mediaUtils'
import { readAccessCodeFromForm, requireGuestEventAccess } from '@/lib/eventAccessGuard'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const MAX_VIDEO_BYTES = 500 * 1024 * 1024

async function saveFileToLocal(file: File, eventId: string) {
  const uploadPath = getPhotoUploadPath()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileExtension = file.name.split('.').pop()
  const fileName = `${eventId}_${timestamp}_${Date.now()}.${fileExtension}`
  const filePath = path.join(uploadPath, fileName)
  await fs.mkdir(uploadPath, { recursive: true })
  const arrayBuffer = await file.arrayBuffer()
  await fs.writeFile(filePath, Buffer.from(arrayBuffer))
  const photoUrl = `/api/photos/view/${fileName}`
  return { photoUrl, fileName }
}

async function saveThumbnail(thumbnail: File, mainFileName: string) {
  const uploadPath = getPhotoUploadPath()
  const thumbName = getThumbnailFilename(mainFileName)
  const thumbPath = path.join(uploadPath, thumbName)
  const arrayBuffer = await thumbnail.arrayBuffer()
  await fs.writeFile(thumbPath, Buffer.from(arrayBuffer))
  return `/api/photos/view/${thumbName}`
}

async function savePhotoMetadata({
  eventId,
  photoUrl,
  mediaType,
  durationMs,
  thumbnailUrl,
  mimeType,
  uploaderName,
  dateTaken,
  location,
  comment,
}: {
  eventId: string
  photoUrl: string
  mediaType: 'image' | 'video'
  durationMs?: number | null
  thumbnailUrl?: string | null
  mimeType?: string | null
  uploaderName?: string
  dateTaken?: string
  location?: string
  comment?: string
}) {
  const existingPhotos = await prisma.photo.findMany({
    where: { eventId },
    orderBy: { index: 'desc' },
    take: 1,
  })
  const nextIndex = existingPhotos?.[0]?.index + 1 || 0
  const photoRecord = await prisma.photo.create({
    data: {
      eventId,
      index: nextIndex,
      photoUrl,
      mediaType,
      durationMs: durationMs ?? null,
      thumbnailUrl: thumbnailUrl ?? null,
      mimeType: mimeType ?? null,
      uploaderName: uploaderName || null,
      dateTaken: dateTaken || null,
      location: location || null,
      visible: true,
    },
  })
  if (comment) {
    await prisma.comment.create({
      data: {
        eventId,
        photoId: photoRecord.id,
        index: 0,
        comment,
        commenterName: uploaderName || null,
        visible: true,
      },
    })
  }
  return photoRecord
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const eventId = formData.get('eventId') as string
    const uploaderName = formData.get('uploaderName') as string
    const comment = formData.get('comment') as string
    const location = formData.get('location') as string
    const dateTaken = formData.get('dateTaken') as string
    const thumbnail = formData.get('thumbnail') as File | null
    const durationMsRaw = formData.get('durationMs') as string | null

    if (!file || !eventId) {
      return NextResponse.json({ error: 'Bestand of eventId ontbreekt' }, { status: 400 })
    }

    const accessDenied = await requireGuestEventAccess(eventId, readAccessCodeFromForm(formData))
    if (accessDenied) return accessDenied

    const mediaKind = getMediaKind(file)
    if (!mediaKind) {
      return NextResponse.json({ error: 'Bestand moet een foto of video zijn' }, { status: 400 })
    }

    const maxBytes = mediaKind === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
    if (file.size > maxBytes) {
      const msg =
        mediaKind === 'video'
          ? 'Video is too large (max 500 MB)'
          : 'Photo is too large (max 20 MB)'
      return NextResponse.json({ error: msg }, { status: 413 })
    }

    const { photoUrl, fileName } = await saveFileToLocal(file, eventId)

    let thumbnailUrl: string | null = null
    if (thumbnail && thumbnail.size > 0) {
      thumbnailUrl = await saveThumbnail(thumbnail, fileName)
    }

    const durationMs = durationMsRaw ? parseInt(durationMsRaw, 10) : null

    const photoRecord = await savePhotoMetadata({
      eventId,
      photoUrl,
      mediaType: mediaKind,
      durationMs: Number.isFinite(durationMs) ? durationMs : null,
      thumbnailUrl,
      mimeType: file.type || null,
      uploaderName,
      dateTaken,
      location,
      comment,
    })

    return NextResponse.json({
      success: true,
      photo: photoRecord,
      photoUrl,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}
