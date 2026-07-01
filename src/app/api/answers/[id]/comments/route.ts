import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const answerId = parseInt(id, 10)

    const comments = await prisma.comment.findMany({
      where: { answerId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('GET /api/answers/[id]/comments error:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params
    const answerId = parseInt(id, 10)

    const answer = await prisma.answer.findUnique({ where: { id: answerId } })
    if (!answer) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
    }

    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        answerId,
        userId: session.userId,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('POST /api/answers/[id]/comments error:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}