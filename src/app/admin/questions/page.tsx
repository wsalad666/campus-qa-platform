"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ShieldAlert, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

interface Question {
  id: number
  title: string
  status: string
  createdAt: string
  user: { id: number; name: string; studentId: string }
  course: { id: number; name: string; code: string }
  _count: { answers: number }
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [status, setStatus] = useState("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("status", status)
      if (search) params.set("search", search)
      const res = await fetch(`/api/admin/questions?${params}`)
      const data = await res.json()
      setQuestions(data.questions || [])
      setTotalPages(data.totalPages || 1)
    } catch {
      toast.error("加载失败")
    } finally {
      setLoading(false)
    }
  }, [page, status, search])

  useEffect(() => { fetchQuestions() }, [fetchQuestions])

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "removed" : "active"
    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success(newStatus === "active" ? "已恢复" : "已下架")
        fetchQuestions()
      } else {
        const d = await res.json()
        toast.error(d.error || "操作失败")
      }
    } catch {
      toast.error("网络错误")
    }
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
      <h1 className="text-2xl font-bold mb-6">问题管理</h1>

      <div className="flex gap-2 mb-4 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索问题..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); fetchQuestions() } }}
          />
        </div>
        <Select value={status} onValueChange={(v) => { if (v) { setStatus(v); setPage(1) } }}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="active">正常</SelectItem>
            <SelectItem value="removed">已下架</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => { setPage(1); fetchQuestions() }}>搜索</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>作者</TableHead>
                <TableHead>课程</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>时间</TableHead>
                <TableHead className="w-24">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-8">暂无数据</TableCell>
                </TableRow>
              ) : (
                questions.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="text-xs text-gray-400">{q.id}</TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{q.title}</TableCell>
                    <TableCell className="text-sm">{q.user.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{q.course.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={q.status === "active" ? "default" : "destructive"} className="text-xs">
                        {q.status === "active" ? "正常" : "已下架"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">{timeAgo(q.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(q.id, q.status)}
                        className="gap-1 text-xs"
                      >
                        {q.status === "active" ? (
                          <><ShieldAlert className="h-3 w-3" /> 下架</>
                        ) : (
                          <><ShieldCheck className="h-3 w-3" /> 恢复</>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
          <span className="flex items-center px-3 text-sm text-gray-500">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
        </div>
      )}
    </div>
  )
}
