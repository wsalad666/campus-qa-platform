"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Shield, MessageCircle, BookOpen, BarChart3 } from "lucide-react"

export default function AdminPage() {
  const links = [
    {
      href: "/admin/stats",
      icon: BarChart3,
      title: "数据统计",
      description: "查看平台总体数据概览",
    },
    {
      href: "/admin/questions",
      icon: MessageCircle,
      title: "问题管理",
      description: "管理所有问题，上下架操作",
    },
    {
      href: "/admin/courses",
      icon: BookOpen,
      title: "课程管理",
      description: "添加、编辑、删除课程",
    },
  ]

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-purple-600" />
        <h1 className="text-2xl font-bold">管理后台</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <link.icon className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>{link.title}</CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
