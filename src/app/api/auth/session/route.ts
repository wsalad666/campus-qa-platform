import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const payload = await getSession(request)
    if (!payload) {
      return NextResponse.json({ user: null })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, studentId: true, name: true, email: true, avatar: true, bio: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: { userId: user.id, studentId: user.studentId, name: user.name, email: user.email, avatar: user.avatar, bio: user.bio, role: user.role },
    })
  } catch {
    return NextResponse.json({ user: null })
  }
}
