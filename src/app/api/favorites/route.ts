import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { questionId, resourceId } = body

    if (!questionId && !resourceId) {
      return NextResponse.json({ error: 'questionId or resourceId is required' }, { status: 400 })
    }

    const existing = await prisma.favorite.findFirst({
      where: {
        userId: session.userId,
        ...(questionId ? { questionId } : {}),
        ...(resourceId ? { resourceId } : {}),
      },
    })

    if (existing) {
      return NextResponse.json(existing)
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: session.userId,
        questionId: questionId || null,
        resourceId: resourceId || null,
      },
    })

    return NextResponse.json(favorite, { status: 201 })
  } catch (error) {
    // Handle unique constraint violation gracefully
    if ((error as any)?.code === 'P2002') {
      return NextResponse.json({ success: true, message: 'Already favorited' })
    }
    console.error('POST /api/favorites error:', error)
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
  }
}
