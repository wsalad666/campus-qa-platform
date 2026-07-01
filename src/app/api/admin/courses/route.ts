import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        _count: { select: { questions: true, resources: true } },
      },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(courses)
  } catch (error) {
    console.error("Admin courses GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, code, description } = await request.json()

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
    }

    const existing = await prisma.course.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ error: "Course code already exists" }, { status: 409 })
    }

    const course = await prisma.course.create({
      data: { name, code, description: description || "" },
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error("Admin courses POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
