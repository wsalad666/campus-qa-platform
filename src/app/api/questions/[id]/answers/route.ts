import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const questionId = parseInt(id, 10)

    const answers = await prisma.answer.findMany({
      where: { questionId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: [{ isAdopted: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ answers })
  } catch (error) {
    console.error('GET /api/questions/[id]/answers error:', error)
    return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 })
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
    const questionId = parseInt(id, 10)

    const question = await prisma.question.findUnique({ where: { id: questionId } })
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }
    if (question.status === 'removed') {
      return NextResponse.json({ error: 'Cannot answer a removed question' }, { status: 400 })
    }

    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const answer = await prisma.answer.create({
      data: {
        content,
        questionId,
        userId: session.userId,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json(answer, { status: 201 })
  } catch (error) {
    console.error('POST /api/questions/[id]/answers error:', error)
    return NextResponse.json({ error: 'Failed to create answer' }, { status: 500 })
  }
}