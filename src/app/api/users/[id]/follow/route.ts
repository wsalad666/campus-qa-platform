import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const followingId = parseInt(id, 10)

    if (isNaN(followingId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.userId === followingId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({ where: { id: followingId } })
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.userId,
          followingId,
        },
      },
    })

    if (existingFollow) {
      return NextResponse.json({ error: "Already following this user" }, { status: 409 })
    }

    await prisma.follow.create({
      data: {
        followerId: session.userId,
        followingId,
      },
    })

    return NextResponse.json({ success: true, message: "Followed" }, { status: 201 })
  } catch (error) {
    console.error("Follow error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const followingId = parseInt(id, 10)

    if (isNaN(followingId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.userId,
          followingId,
        },
      },
    })

    if (!existingFollow) {
      return NextResponse.json({ error: "Not following this user" }, { status: 404 })
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: session.userId,
          followingId,
        },
      },
    })

    return NextResponse.json({ success: true, message: "Unfollowed" })
  } catch (error) {
    console.error("Unfollow error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    const type = searchParams.get("type")

    // If no type specified, check if current user follows this user
    if (!type) {
      const session = await getSession()
      let isFollowing = false
      if (session) {
        const follow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: session.userId,
              followingId: userId,
            },
          },
        })
        isFollowing = !!follow
      }
      return NextResponse.json({ isFollowing })
    }

    if (type !== "followers" && type !== "following") {
      return NextResponse.json({ error: 'Type must be "followers" or "following"' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (type === "followers") {
      const follows = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              avatar: true,
              studentId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      return NextResponse.json({
        users: follows.map((f) => f.follower),
        total: follows.length,
      })
    } else {
      const follows = await prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              avatar: true,
              studentId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      return NextResponse.json({
        users: follows.map((f) => f.following),
        total: follows.length,
      })
    }
  } catch (error) {
    console.error("Get follows error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
