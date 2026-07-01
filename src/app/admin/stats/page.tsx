"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageCircle, MessageSquare, FileText, Download, UserCheck, Calendar } from "lucide-react"
import { toast } from "sonner"

interface Stats {
  totalUsers: number
  totalQuestions: number
  totalAnswers: number
  totalResources: number
  totalDownloads: number
  activeUsers: number
  recentQuestions: number
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => toast.error("加载统计数据失败"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>
  }

  if (!stats) {
    return <div className="text-center py-12 text-gray-400">暂无数据</div>
  }

  const cards = [
    { label: "总用户数", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "总问题数", value: stats.totalQuestions, icon: MessageCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "总回答数", value: stats.totalAnswers, icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "总资源数", value: stats.totalResources, icon: FileText, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "总下载量", value: stats.totalDownloads, icon: Download, color: "text-pink-600", bg: "bg-pink-50" },
    { label: "活跃用户", value: stats.activeUsers, icon: UserCheck, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "近30天问题", value: stats.recentQuestions, icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-50" },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">数据统计</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <CardTitle className="text-sm font-medium text-gray-500">{card.label}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
