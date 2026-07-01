import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const courseId = searchParams.get("courseId")
    const search = searchParams.get("search")

    const where: any = { status: "active" }
    if (courseId) where.courseId = parseInt(courseId)
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
          course: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.resource.count({ where }),
    ])

    return NextResponse.json({
      resources,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Resources GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const courseId = parseInt(formData.get("courseId") as string)
    const file = formData.get("file") as File

    if (!title || !courseId || !file) {
      return NextResponse.json({ error: "Title, course, and file are required" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name
    const fileSize = file.size
    const fileType = fileName.split(".").pop()?.toLowerCase() || "unknown"

    const uploadDir = path.join(process.cwd(), "public", "uploads", "files")
    await mkdir(uploadDir, { recursive: true })

    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${fileName}`
    const filePath = path.join(uploadDir, uniqueName)
    await writeFile(filePath, buffer)

    const resource = await prisma.resource.create({
      data: {
        title,
        description: description || "",
        filePath: `/uploads/files/${uniqueName}`,
        fileName,
        fileSize,
        fileType,
        courseId,
        userId: session.userId,
      },
      include: {
        user: { select: { id: true, name: true } },
        course: { select: { id: true, name: true, code: true } },
      },
    })

    return NextResponse.json(resource, { status: 201 })
  } catch (error) {
    console.error("Resources POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
