import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

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
    const commentId = parseInt(id, 10)

    const comment = await prisma.comment.findUnique({ where: { id: commentId } })
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (comment.userId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.comment.delete({ where: { id: commentId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/comments/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
