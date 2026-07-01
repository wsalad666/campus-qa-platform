import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { name: "asc" },
    })
    return NextResponse.json(courses)
  } catch (error) {
    console.error("Courses GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
