import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, code, description } = await request.json()

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
    }

    const existing = await prisma.course.findFirst({
      where: { code, NOT: { id: parseInt(id) } },
    })
    if (existing) {
      return NextResponse.json({ error: "Course code already in use" }, { status: 409 })
    }

    const course = await prisma.course.update({
      where: { id: parseInt(id) },
      data: { name, code, description: description || "" },
    })

    return NextResponse.json(course)
  } catch (error) {
    console.error("Admin course PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { questions: true, resources: true } } },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (course._count.questions > 0 || course._count.resources > 0) {
      return NextResponse.json(
        { error: "Cannot delete course with existing questions or resources" },
        { status: 400 }
      )
    }

    await prisma.course.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin course DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
