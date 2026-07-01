"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface ProfileData {
  userId: number
  name: string
  bio: string | null
}

export default function EditProfilePage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [userId, setUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUserId(d.user.userId)
          // Fetch current profile
          return fetch(`/api/users/${d.user.userId}`)
        }
        return null
      })
      .then((res) => res?.json())
      .then((data) => {
        if (data) {
          setName(data.name || "")
          setBio(data.bio || "")
        }
      })
      .catch(() => toast.error("加载信息失败"))
      .finally(() => setFetching(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("姓名不能为空")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      })
      if (res.ok) {
        toast.success("资料更新成功")
        router.push(`/profile/${userId}`)
      } else {
        const d = await res.json()
        toast.error(d.error || "更新失败")
      }
    } catch {
      toast.error("网络错误")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>编辑个人资料</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">个人简介</Label>
              <Textarea
                id="bio"
                placeholder="介绍一下自己..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "保存中..." : "保存修改"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
