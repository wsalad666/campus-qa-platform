import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status") || "all"
    const search = searchParams.get("search")

    const where: any = {}
    if (status !== "all") {
      where.status = status
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ]
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, studentId: true } },
          course: { select: { id: true, name: true, code: true } },
          _count: { select: { answers: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.question.count({ where }),
    ])

    return NextResponse.json({
      questions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Admin questions GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
