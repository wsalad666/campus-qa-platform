import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      totalUsers,
      totalQuestions,
      totalAnswers,
      totalResources,
      downloadSum,
      activeUsers,
      recentQuestions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.question.count(),
      prisma.answer.count(),
      prisma.resource.count(),
      prisma.resource.aggregate({ _sum: { downloadCount: true } }),
      prisma.user.count({
        where: { questions: { some: {} } },
      }),
      prisma.question.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ])

    return NextResponse.json({
      totalUsers,
      totalQuestions,
      totalAnswers,
      totalResources,
      totalDownloads: downloadSum._sum.downloadCount || 0,
      activeUsers,
      recentQuestions,
    })
  } catch (error) {
    console.error("Admin stats GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
