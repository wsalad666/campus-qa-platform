import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { studentId, name, email, password } = await request.json()

    if (!studentId || !name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const existingStudentId = await prisma.user.findUnique({ where: { studentId } })
    if (existingStudentId) {
      return NextResponse.json({ error: "Student ID already registered" }, { status: 409 })
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: { studentId, name, email, password: hashedPassword },
    })

    return NextResponse.json(
      { success: true, message: "Registration successful" },
      { status: 201 }
    )
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
