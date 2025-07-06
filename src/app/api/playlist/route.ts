import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

import type { CommentStreamItem, PhotoStreamItem, Playlist } from '@/lib/slices/appSlice'

export type PlaylistResponse = {
  unchanged: boolean
  playlist: (Playlist & { commentStyle: 'TICKER' | 'COMICBOOK' }) | null
  hash: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('eventId')
  const clientHash = searchParams.get('hash')

  if (!eventId) {
    return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })
  }

  try {
    // Get photos for the event
    const photos = await prisma.photo.findMany({
      where: {
        eventId,
        visible: true
      },
      orderBy: { index: 'asc' }
    })

    // Get comments for the event
    const comments = await prisma.comment.findMany({
      where: {
        eventId,
        visible: true
      },
      orderBy: { index: 'asc' }
    })

    // Build playlist structure
    const photoStream: PhotoStreamItem[] = photos.map(photo => ({
      id: photo.id,
      photoId: photo.id,
      eventId: photo.eventId,
      index: photo.index,
      photoUrl: photo.photoUrl,
      uploaderName: photo.uploaderName,
      dateTaken: photo.dateTaken ? (photo.dateTaken instanceof Date ? photo.dateTaken.toISOString() : photo.dateTaken) : null,
      coordinates: photo.coordinates,
      location: photo.location,
      visible: photo.visible,
      createdAt: photo.createdAt ? (photo.createdAt instanceof Date ? photo.createdAt.toISOString() : photo.createdAt) : null,
      updatedAt: photo.updatedAt ? (photo.updatedAt instanceof Date ? photo.updatedAt.toISOString() : photo.updatedAt) : null,
      scheduleCount: photo.scheduleCount,
      showCount: photo.showCount,
      lastShown: photo.lastShown ? (photo.lastShown instanceof Date ? photo.lastShown.toISOString() : photo.lastShown) : null,
      showFrom: photo.showFrom ? (photo.showFrom instanceof Date ? photo.showFrom.toISOString() : photo.showFrom) : null,
      showTo: photo.showTo ? (photo.showTo instanceof Date ? photo.showTo.toISOString() : photo.showTo) : null,
      comments: comments
        .filter(comment => comment.photoId === photo.id)
        .map(comment => ({
          id: comment.id,
          eventId: comment.eventId,
          photoId: comment.photoId,
          index: comment.index,
          comment: comment.comment,
          commenterName: comment.commenterName,
          visible: comment.visible,
          createdAt: comment.createdAt ? (comment.createdAt instanceof Date ? comment.createdAt.toISOString() : comment.createdAt) : null,
          updatedAt: comment.updatedAt ? (comment.updatedAt instanceof Date ? comment.updatedAt.toISOString() : comment.updatedAt) : null,
          scheduleCount: comment.scheduleCount,
          showCount: comment.showCount,
          lastShown: comment.lastShown ? (comment.lastShown instanceof Date ? comment.lastShown.toISOString() : comment.lastShown) : null,
          showFrom: comment.showFrom ? (comment.showFrom instanceof Date ? comment.showFrom.toISOString() : comment.showFrom) : null,
          showTo: comment.showTo ? (comment.showTo instanceof Date ? comment.showTo.toISOString() : comment.showTo) : null
        }))
    }))

    const eventCommentStream: CommentStreamItem[] = comments
      .filter(comment => !comment.photoId)
      .map(comment => ({
        id: comment.id,
        eventId: comment.eventId,
        photoId: comment.photoId,
        index: comment.index,
        comment: comment.comment,
        commenterName: comment.commenterName,
        visible: comment.visible,
        createdAt: comment.createdAt ? (comment.createdAt instanceof Date ? comment.createdAt.toISOString() : comment.createdAt) : null,
        updatedAt: comment.updatedAt ? (comment.updatedAt instanceof Date ? comment.updatedAt.toISOString() : comment.updatedAt) : null,
        scheduleCount: comment.scheduleCount,
        showCount: comment.showCount,
        lastShown: comment.lastShown ? (comment.lastShown instanceof Date ? comment.lastShown.toISOString() : comment.lastShown) : null,
        showFrom: comment.showFrom ? (comment.showFrom instanceof Date ? comment.showFrom.toISOString() : comment.showFrom) : null,
        showTo: comment.showTo ? (comment.showTo instanceof Date ? comment.showTo.toISOString() : comment.showTo) : null
      }))

    // Get the event to fetch commentStyle
    const event = await prisma.socialEvent.findUnique({ where: { id: eventId } })
    const commentStyle = event?.commentStyle || 'TICKER'

    const playlist = {
      hash: '',
      photoStream: photoStream,
      eventCommentStream: eventCommentStream,
      commentStyle
    }

    // Generate MD5 hash of the playlist content
    const playlistString = JSON.stringify(playlist)
    const currentHash = crypto.createHash('md5').update(playlistString).digest('hex')

    // If client hash matches current hash, no changes
    if (clientHash === currentHash) {
      return NextResponse.json({ 
        unchanged: true,
        playlist: null,
        hash: currentHash
      })
    }

    // If hashes don't match, return the full playlist
    return NextResponse.json({ 
      unchanged: false,
      playlist,
      hash: currentHash
    })

  } catch (error) {
    console.error('Error fetching playlist:', error)
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 })
  }
} 