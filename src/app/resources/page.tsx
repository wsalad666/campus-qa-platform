"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Upload, Heart, FileText } from "lucide-react"
import { toast } from "sonner"

interface Resource {
  id: number
  title: string
  description: string | null
  fileName: string
  fileType: string
  fileSize: number
  downloadCount: number
  createdAt: string
  user: { id: number; name: string }
  course: { id: number; name: string; code: string }
}

interface Course {
  id: number
  name: string
  code: string
}

interface SessionUser {
  userId: number
}

export default function ResourcesPage() {
  const router = useRouter()
  const [resources, setResources] = useState<Resource[]>([])
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
    fetch("/api/courses")
      .then((r) => r.json())
      .then(setCourses)
      .catch(() => {})
  }, [])

  const fetchResources = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "12")
      if (courseId) params.set("courseId", courseId)
      if (search) params.set("search", search)
      const res = await fetch(`/api/resources?${params}`)
      const data = await res.json()
      setResources(data.resources || [])
      setTotalPages(data.totalPages || 1)
    } catch {
      toast.error("加载资源失败")
    } finally {
      setLoading(false)
    }
  }, [page, courseId, search])

  useEffect(() => { fetchResources() }, [fetchResources])

  const handleFavorite = async (resourceId: number) => {
    if (!user) { toast.error("请先登录"); return }
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId }),
      })
      if (res.ok) toast.success("已收藏")
      else {
        const d = await res.json()
        toast.error(d.error || "操作失败")
      }
    } catch { toast.error("网络错误") }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">资源库</h1>
        {user && (
          <Button onClick={() => router.push("/resources/upload")} className="gap-2">
            <Upload className="h-4 w-4" /> 上传资源
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索资源..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); fetchResources() } }}
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
        <Button variant="outline" onClick={() => { setPage(1); fetchResources() }}>搜索</Button>
      </div>

      {/* Resources grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : resources.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无资源</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{r.title}</h3>
                  </div>
                  <Badge variant="outline" className="text-xs uppercase ml-2 shrink-0">
                    {r.fileType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                  {r.description || "暂无描述"}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <Badge variant="secondary" className="text-xs">{r.course.name}</Badge>
                  <span>{formatSize(r.fileSize)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>{r.user.name}</span>
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3" /> {r.downloadCount}
                  </span>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/api/resources/${r.id}/download`}
                    className="flex-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="w-full gap-1">
                      <Download className="h-3 w-3" /> 下载
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleFavorite(r.id)}
                  >
                    <Heart className="h-4 w-4 text-gray-400 hover:text-red-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            上一页
          </Button>
          <span className="flex items-center px-3 text-sm text-gray-500">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            下一页
          </Button>
        </div>
      )}
    </div>
  )
}
