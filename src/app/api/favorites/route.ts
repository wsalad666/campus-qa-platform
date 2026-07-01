import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userIdParam = searchParams.get('userId')

    let userId: number | undefined
    if (userIdParam) {
      userId = parseInt(userIdParam, 10)
    } else {
      const session = await getSession()
      if (!session) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      userId = session.userId
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        question: { select: { id: true, title: true } },
        resource: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('GET /api/favorites error:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}

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
    if ((error as any)?.code === 'P2002') {
      return NextResponse.json({ success: true, message: 'Already favorited' })
    }
    console.error('POST /api/favorites error:', error)
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
  }
}