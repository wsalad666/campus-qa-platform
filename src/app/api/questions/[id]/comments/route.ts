import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

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
    const questionId = parseInt(id, 10)

    const question = await prisma.question.findUnique({ where: { id: questionId } })
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }
    if (question.status === 'removed') {
      return NextResponse.json({ error: 'Cannot comment on a removed question' }, { status: 400 })
    }

    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        questionId,
        userId: session.userId,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('POST /api/questions/[id]/comments error:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
