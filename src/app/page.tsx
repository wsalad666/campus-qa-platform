"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MessageCircle, Heart, Clock, Plus } from "lucide-react"
import { toast } from "sonner"

interface Question {
  id: number
  title: string
  content: string
  courseId: number
  status: string
  createdAt: string
  user: { id: number; name: string; avatar: string | null }
  course: { id: number; name: string; code: string }
  _count: { answers: number; likes: number }
}

interface Course {
  id: number
  name: string
  code: string
}

interface SessionUser {
  userId: number
  role: string
}

export default function HomePage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [user, setUser] = useState<SessionUser | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [courseId, setCourseId] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then(setCourses)
      .catch(() => {})
  }, [])

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      if (courseId) params.set("courseId", courseId)
      if (search) params.set("search", search)
      const res = await fetch(`/api/questions?${params}`)
      const data = await res.json()
      setQuestions(data.questions || [])
      setTotalPages(data.totalPages || 1)
    } catch {
      toast.error("加载问题失败")
    } finally {
      setLoading(false)
    }
  }, [page, courseId, search])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchQuestions()
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "刚刚"
    if (mins < 60) return `${mins}分钟前`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}天前`
    return new Date(date).toLocaleDateString("zh-CN")
  }

  return (
    <div>
      {/* Hero */}
      <div className="text-center py-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">校园互助答疑平台</h1>
        <p className="text-gray-500 mb-4">聚焦专业课疑难，互助学习，共同进步</p>
        {user && (
          <Button onClick={() => router.push("/questions/new")} className="gap-2">
            <Plus className="h-4 w-4" /> 提问
          </Button>
        )}
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索问题..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={courseId} onValueChange={(v) => { setCourseId(v || ""); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="全部课程" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部课程</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">搜索</Button>
      </form>

      {/* Questions list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无问题</div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <Link key={q.id} href={`/questions/${q.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-2 justify-between">
                    <h2 className="font-semibold text-lg text-gray-900 flex-1">{q.title}</h2>
                    <Badge variant="secondary">{q.course.name}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {q.content.length > 100 ? q.content.slice(0, 100) + "..." : q.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{q.user.name}</span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> {q._count.answers}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" /> {q._count.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {timeAgo(q.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            上一页
          </Button>
          <span className="flex items-center px-3 text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            下一页
          </Button>
        </div>
      )}
    </div>
  )
}
