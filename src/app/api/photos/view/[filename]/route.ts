import { NextRequest, NextResponse } from 'next/server'
import { createReadStream } from 'fs'
import { promises as fs } from 'fs'
import path from 'path'
import { getContentType, getPhotoUploadPath, isSafeFilename } from '@/lib/photoStorage'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  if (!isSafeFilename(filename)) {
    return NextResponse.json({ error: 'Ongeldige bestandsnaam' }, { status: 400 })
  }

  const uploadPath = getPhotoUploadPath()
  const filePath = path.join(uploadPath, filename)
  const contentType = getContentType(filename)

  try {
    const stats = await fs.stat(filePath)
    if (!stats.isFile()) {
      return NextResponse.json({ error: 'Bestand niet gevonden' }, { status: 404 })
    }

    const range = req.headers.get('range')
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range)
      if (!match) {
        return new NextResponse(null, { status: 416 })
      }

      const size = stats.size
      let start = match[1] ? parseInt(match[1], 10) : 0
      let end = match[2] ? parseInt(match[2], 10) : size - 1

      if (Number.isNaN(start) || Number.isNaN(end) || start >= size) {
        return new NextResponse(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${size}` },
        })
      }

      end = Math.min(end, size - 1)
      const chunkSize = end - start + 1
      const stream = createReadStream(filePath, { start, end })

      return new NextResponse(stream as unknown as BodyInit, {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(chunkSize),
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    }

    const stream = createReadStream(filePath)
    return new NextResponse(stream as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(stats.size),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error reading photo file:', error)
    return NextResponse.json({ error: 'Bestand niet gevonden' }, { status: 404 })
  }
}
