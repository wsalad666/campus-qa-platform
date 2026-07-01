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
    const answerId = parseInt(id, 10)

    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: { question: true },
    })
    if (!answer) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
    }

    // Only the question owner can adopt an answer
    if (answer.question.userId !== session.userId) {
      return NextResponse.json({ error: 'Only the question owner can adopt an answer' }, { status: 403 })
    }

    // Un-adopt any previously adopted answer for this question
    await prisma.answer.updateMany({
      where: { questionId: answer.questionId, isAdopted: true },
      data: { isAdopted: false },
    })

    // Adopt this answer
    const adopted = await prisma.answer.update({
      where: { id: answerId },
      data: { isAdopted: true },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        _count: { select: { likes: true, comments: true } },
      },
    })

    return NextResponse.json(adopted)
  } catch (error) {
    console.error('POST /api/answers/[id]/adopt error:', error)
    return NextResponse.json({ error: 'Failed to adopt answer' }, { status: 500 })
  }
}
