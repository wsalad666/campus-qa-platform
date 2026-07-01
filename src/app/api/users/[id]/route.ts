import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id, 10)

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const include = searchParams.get("include")

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        studentId: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            questions: true,
            answers: true,
            resources: true,
            followers: true,
            following: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let extra: Record<string, unknown> = {}

    if (include === "answers") {
      const answers = await prisma.answer.findMany({
        where: { userId: userId },
        include: {
          question: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
      })
      extra.answers = answers
    }

    return NextResponse.json({ user, ...extra })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id, 10)

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name, bio, avatar } = await request.json()

    const updateData: { name?: string; bio?: string; avatar?: string } = {}
    if (name !== undefined) updateData.name = name
    if (bio !== undefined) updateData.bio = bio
    if (avatar !== undefined) updateData.avatar = avatar

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        studentId: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
