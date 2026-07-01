import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { readFile } from "fs/promises"
import path from "path"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const resource = await prisma.resource.findUnique({ where: { id: parseInt(id) } })

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    await prisma.resource.update({
      where: { id: parseInt(id) },
      data: { downloadCount: { increment: 1 } },
    })

    const filePath = path.join(process.cwd(), "public", resource.filePath)
    const fileBuffer = await readFile(filePath)

    const encodedFileName = encodeURIComponent(resource.fileName)

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedFileName}`,
        "Content-Length": resource.fileSize.toString(),
      },
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "File not found or internal error" }, { status: 500 })
  }
}
