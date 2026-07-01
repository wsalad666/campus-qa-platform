import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const questionId = parseInt(id, 10)

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        course: { select: { id: true, name: true, code: true } },
        _count: { select: { answers: true, likes: true } },
        answers: {
          orderBy: [{ isAdopted: 'desc' }, { createdAt: 'desc' }],
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    return NextResponse.json(question)
  } catch (error) {
    console.error('GET /api/questions/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
  }
}

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
    const questionId = parseInt(id, 10)

    const question = await prisma.question.findUnique({ where: { id: questionId } })
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    if (question.userId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, images } = body

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(images !== undefined && { images: images ? JSON.stringify(images) : null }),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        course: { select: { id: true, name: true, code: true } },
        _count: { select: { answers: true, likes: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/questions/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
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

    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const questionId = parseInt(id, 10)

    const question = await prisma.question.findUnique({ where: { id: questionId } })
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    await prisma.question.update({
      where: { id: questionId },
      data: { status: 'removed' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/questions/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }
}
