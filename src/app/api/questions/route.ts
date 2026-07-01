import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
    const courseId = searchParams.get('courseId') ? parseInt(searchParams.get('courseId')!, 10) : undefined
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined

    const where: Record<string, unknown> = {}

    if (session?.role !== 'admin') {
      where.status = 'active'
    } else if (status) {
      where.status = status
    }

    if (courseId) where.courseId = courseId
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ]
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where: where as any,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          course: { select: { id: true, name: true, code: true } },
          _count: { select: { answers: true, likes: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.question.count({ where: where as any }),
    ])

    return NextResponse.json({
      questions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('GET /api/questions error:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, images, courseId } = body

    if (!title || !content || !courseId) {
      return NextResponse.json({ error: 'title, content, and courseId are required' }, { status: 400 })
    }

    const question = await prisma.question.create({
      data: {
        title,
        content,
        images: images ? JSON.stringify(images) : null,
        courseId,
        userId: session.userId,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        course: { select: { id: true, name: true, code: true } },
        _count: { select: { answers: true, likes: true } },
      },
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    console.error('POST /api/questions error:', error)
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
  }
}
