import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(
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

    if (answer.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const updated = await prisma.answer.update({
      where: { id: answerId },
      data: { content },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        _count: { select: { likes: true, comments: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/answers/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update answer' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
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

    if (answer.userId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.answer.delete({ where: { id: answerId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/answers/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete answer' }, { status: 500 })
  }
}
