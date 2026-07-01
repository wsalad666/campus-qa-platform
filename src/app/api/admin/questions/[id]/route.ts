import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status } = await request.json()

    if (!status || !["active", "removed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const question = await prisma.question.update({
      where: { id: parseInt(id) },
      data: { status },
    })

    return NextResponse.json(question)
  } catch (error) {
    console.error("Admin question PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
