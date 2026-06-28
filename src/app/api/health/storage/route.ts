import { NextResponse } from 'next/server'
import { constants as fsConstants } from 'fs'
import { access } from 'fs/promises'
import { getPhotoUploadPath } from '@/lib/photoStorage'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const uploadPath = getPhotoUploadPath()
  try {
    await access(uploadPath, fsConstants.R_OK | fsConstants.W_OK)
    return NextResponse.json({ ok: true, path: uploadPath })
  } catch {
    return NextResponse.json({ ok: false, path: uploadPath }, { status: 503 })
  }
}
