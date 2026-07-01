"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface Course {
  id: number
  name: string
  code: string
}

export default function NewQuestionPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [courseId, setCourseId] = useState("")
  const [courses, setCourses] = useState<Course[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then(setCourses)
      .catch(() => toast.error("加载课程失败"))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !courseId) {
      toast.error("请填写所有字段")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, courseId: parseInt(courseId) }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("提问成功")
        router.push(`/questions/${data.id}`)
      } else {
        toast.error(data.error || "提交失败")
      }
    } catch {
      toast.error("网络错误")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>提出新问题</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">问题标题</Label>
              <Input
                id="title"
                placeholder="简明扼要地描述你的问题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course">所属课程</Label>
              <Select value={courseId} onValueChange={(v) => setCourseId(v || "")}>
                <SelectTrigger id="course">
                  <SelectValue placeholder="选择课程" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name} ({c.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">问题详情</Label>
              <Textarea
                id="content"
                placeholder="详细描述你的问题，包括你尝试过的方法..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "提交中..." : "发布问题"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
