"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload } from "lucide-react"
import { toast } from "sonner"

interface Course {
  id: number
  name: string
  code: string
}

export default function UploadResourcePage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [courseId, setCourseId] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then(setCourses)
      .catch(() => toast.error("加载课程失败"))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !courseId || !file) {
      toast.error("请填写所有必填字段")
      return
    }

    setSubmitting(true)
    setProgress(30)

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description)
      formData.append("courseId", courseId)
      formData.append("file", file)

      setProgress(60)
      const res = await fetch("/api/resources", {
        method: "POST",
        body: formData,
      })

      setProgress(90)
      const data = await res.json()

      if (res.ok) {
        setProgress(100)
        toast.success("资源上传成功")
        router.push("/resources")
      } else {
        toast.error(data.error || "上传失败")
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
          <CardTitle>上传资源</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">资源标题 *</Label>
              <Input
                id="title"
                placeholder="例如：操作系统期末复习笔记"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">资源描述</Label>
              <Textarea
                id="description"
                placeholder="简要描述资源内容..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course">所属课程 *</Label>
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
              <Label htmlFor="file">选择文件 *</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {file ? (
                  <div className="text-sm">
                    <Upload className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">
                    <Upload className="h-6 w-6 mx-auto mb-1" />
                    <p>点击选择文件</p>
                  </div>
                )}
              </div>
              <Input
                ref={fileRef}
                id="file"
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            {submitting && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              <Upload className="h-4 w-4" />
              {submitting ? "上传中..." : "上传资源"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
