import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { commentSchema } from '@/types/zodSchemas'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET: List comments for an event
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId')
    const photoId = searchParams.get('photoId')

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
    }

    const where: { eventId: string; photoId?: string } = { eventId }
    if (photoId) {
      where.photoId = photoId
    }

    const comments = await prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// POST: Create a new comment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parse = commentSchema.safeParse(body)
    
    if (!parse.success) {
      console.log(`[POST] parse error: ${JSON.stringify(parse.error.flatten())}`)
      console.log(`[POST] body: ${JSON.stringify(body)}`)
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 })
    }

    const comment = await prisma.comment.create({
      data: parse.data
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}

// PUT: Update a comment (requires authentication)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) {
      console.log(`[PUT] id is missing`)
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    
    const parse = commentSchema.partial().safeParse(rest)
    if (!parse.success) {
      console.log(`[PUT] parse error: ${JSON.stringify(parse.error.flatten())}`)
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 })
    }
    
    const comment = await prisma.comment.update({
      where: { id },
      data: parse.data
    })
    
    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}

// DELETE: Delete a comment (requires authentication)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    
    await prisma.comment.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
} 