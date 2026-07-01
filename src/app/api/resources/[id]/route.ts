import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { unlink } from "fs/promises"
import path from "path"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const resource = await prisma.resource.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        course: { select: { id: true, name: true, code: true } },
      },
    })

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    return NextResponse.json(resource)
  } catch (error) {
    console.error("Resource GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const resource = await prisma.resource.findUnique({ where: { id: parseInt(id) } })
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    if (resource.userId !== session.userId && session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    try {
      const filePath = path.join(process.cwd(), "public", resource.filePath)
      await unlink(filePath)
    } catch {}

    await prisma.resource.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Resource DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
