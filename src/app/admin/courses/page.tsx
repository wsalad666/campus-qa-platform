"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Course {
  id: number
  name: string
  code: string
  description: string | null
  _count: { questions: number; resources: number }
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  // Add form
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")

  // Edit form
  const [editName, setEditName] = useState("")
  const [editCode, setEditCode] = useState("")
  const [editDescription, setEditDescription] = useState("")

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/courses")
      const data = await res.json()
      setCourses(Array.isArray(data) ? data : [])
    } catch {
      toast.error("加载课程失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCourses() }, [fetchCourses])

  const handleAdd = async () => {
    if (!name.trim() || !code.trim()) {
      toast.error("课程名称和代码不能为空")
      return
    }
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, description }),
      })
      if (res.ok) {
        toast.success("课程已添加")
        setName("")
        setCode("")
        setDescription("")
        setDialogOpen(false)
        fetchCourses()
      } else {
        const d = await res.json()
        toast.error(d.error || "添加失败")
      }
    } catch {
      toast.error("网络错误")
    }
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setEditName(course.name)
    setEditCode(course.code)
    setEditDescription(course.description || "")
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingCourse || !editName.trim() || !editCode.trim()) {
      toast.error("课程名称和代码不能为空")
      return
    }
    try {
      const res = await fetch(`/api/admin/courses/${editingCourse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, code: editCode, description: editDescription }),
      })
      if (res.ok) {
        toast.success("课程已更新")
        setEditDialogOpen(false)
        fetchCourses()
      } else {
        const d = await res.json()
        toast.error(d.error || "更新失败")
      }
    } catch {
      toast.error("网络错误")
    }
  }

  const handleDelete = async (course: Course) => {
    if (!confirm(`确定要删除「${course.name}」吗？`)) return
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("课程已删除")
        fetchCourses()
      } else {
        const d = await res.json()
        toast.error(d.error || "删除失败")
      }
    } catch {
      toast.error("网络错误")
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">课程管理</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button className="gap-2"><Plus className="h-4 w-4" /> 添加课程</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>添加课程</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label htmlFor="name">课程名称</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：操作系统" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="code">课程代码</Label>
                <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="例如：CS301" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="desc">课程描述</Label>
                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="简要描述..." rows={3} />
              </div>
              <Button onClick={handleAdd} className="w-full">添加</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>编辑课程</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label>课程名称</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>课程代码</Label>
              <Input value={editCode} onChange={(e) => setEditCode(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>课程描述</Label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
            </div>
            <Button onClick={handleSaveEdit} className="w-full">保存</Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>课程名称</TableHead>
                <TableHead>代码</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>问题数</TableHead>
                <TableHead>资源数</TableHead>
                <TableHead className="w-24">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">暂无课程</TableCell>
                </TableRow>
              ) : (
                courses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.code}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                      {c.description || "-"}
                    </TableCell>
                    <TableCell>{c._count.questions}</TableCell>
                    <TableCell>{c._count.resources}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(c)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(c)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
