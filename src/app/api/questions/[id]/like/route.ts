import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(
  _request: NextRequest,
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

    await prisma.like.upsert({
      where: {
        userId_questionId: { userId: session.userId, questionId },
      },
      create: { userId: session.userId, questionId },
      update: {},
    })

    const count = await prisma.like.count({ where: { questionId } })

    return NextResponse.json({ liked: true, count })
  } catch (error) {
    console.error('POST /api/questions/[id]/like error:', error)
    return NextResponse.json({ error: 'Failed to like question' }, { status: 500 })
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
    const questionId = parseInt(id, 10)

    await prisma.like.deleteMany({
      where: { userId: session.userId, questionId },
    })

    const count = await prisma.like.count({ where: { questionId } })

    return NextResponse.json({ liked: false, count })
  } catch (error) {
    console.error('DELETE /api/questions/[id]/like error:', error)
    return NextResponse.json({ error: 'Failed to unlike question' }, { status: 500 })
  }
}
