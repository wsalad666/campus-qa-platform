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

    const answer = await prisma.answer.findUnique({ where: { id: answerId } })
    if (!answer) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
    }

    await prisma.like.upsert({
      where: {
        userId_answerId: { userId: session.userId, answerId },
      },
      create: { userId: session.userId, answerId },
      update: {},
    })

    const count = await prisma.like.count({ where: { answerId } })

    return NextResponse.json({ liked: true, count })
  } catch (error) {
    console.error('POST /api/answers/[id]/like error:', error)
    return NextResponse.json({ error: 'Failed to like answer' }, { status: 500 })
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

    await prisma.like.deleteMany({
      where: { userId: session.userId, answerId },
    })

    const count = await prisma.like.count({ where: { answerId } })

    return NextResponse.json({ liked: false, count })
  } catch (error) {
    console.error('DELETE /api/answers/[id]/like error:', error)
    return NextResponse.json({ error: 'Failed to unlike answer' }, { status: 500 })
  }
}
