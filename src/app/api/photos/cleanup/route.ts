import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import path from 'path'
import { promises as fs } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const PHOTO_UPLOAD_PATH = process.env.PHOTO_UPLOAD_PATH || path.join(process.cwd(), 'photos')

    try {
      await fs.access(PHOTO_UPLOAD_PATH)
    } catch {
      return NextResponse.json({
        error: 'Uploadmap bestaat niet',
        path: PHOTO_UPLOAD_PATH
      }, { status: 404 })
    }

    const allFiles = await fs.readdir(PHOTO_UPLOAD_PATH)
    const allPhotos = await prisma.photo.findMany({
      select: { photoUrl: true, thumbnailUrl: true }
    })

    const linkedFiles = new Set<string>()
    for (const photo of allPhotos) {
      const main = photo.photoUrl.split('/').pop()
      if (main) linkedFiles.add(main)
      const thumb = photo.thumbnailUrl?.split('/').pop()
      if (thumb) linkedFiles.add(thumb)
    }

    const deletedFiles: string[] = []
    const fileErrors: { file: string; error: string }[] = []

    for (const file of allFiles) {
      if (linkedFiles.has(file)) continue
      try {
        const filePath = path.join(PHOTO_UPLOAD_PATH, file)
        const stats = await fs.stat(filePath)
        if (!stats.isFile()) continue

        await fs.unlink(filePath)
        deletedFiles.push(file)
      } catch (error) {
        fileErrors.push({
          file,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const orphanedCount = allFiles.length - linkedFiles.size

    return NextResponse.json({
      success: true,
      summary: {
        totalFilesOnDisk: allFiles.length,
        linkedFilesInDatabase: linkedFiles.size,
        orphanedFilesFound: orphanedCount,
        filesDeleted: deletedFiles.length,
        filesWithErrors: fileErrors.length
      },
      deletedFiles,
      fileErrors,
      message: `Cleanup completed. Deleted ${deletedFiles.length} orphaned files.`
    })
  } catch (error) {
    console.error('Error in cleanup API:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}
