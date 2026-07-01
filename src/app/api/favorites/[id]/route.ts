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
    const favoriteId = parseInt(id, 10)

    const favorite = await prisma.favorite.findUnique({ where: { id: favoriteId } })
    if (!favorite) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 })
    }

    if (favorite.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.favorite.delete({ where: { id: favoriteId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/favorites/[id] error:', error)
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
  }
}
