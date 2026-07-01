"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { UserPlus, UserMinus, Edit } from "lucide-react"
import { toast } from "sonner"

interface UserProfile {
  id: number
  studentId: string
  name: string
  email: string
  avatar: string | null
  bio: string | null
  role: string
  _count: { followers: number; following: number }
}
interface SessionUser {
  userId: number
  role: string
}
interface Question {
  id: number
  title: string
  createdAt: string
  course: { name: string }
  _count: { answers: number }
}
interface Answer {
  id: number
  content: string
  createdAt: string
  question: { id: number; title: string }
}
interface Resource {
  id: number
  title: string
  fileName: string
  downloadCount: number
  createdAt: string
}
interface Favorite {
  id: number
  question: { id: number; title: string } | null
  resource: { id: number; title: string } | null
  createdAt: string
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [activeTab, setActiveTab] = useState("questions")

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user) })
      .catch(() => {})
  }, [])

  const fetchProfile = useCallback(async () => {
    try {
      const [profileRes, followRes] = await Promise.all([
        fetch(`/api/users/${id}`),
        user ? fetch(`/api/users/${id}/follow`) : Promise.resolve(null),
      ])
      const pData = await profileRes.json()
      setProfile(pData)
      if (followRes) {
        const fData = await followRes.json()
        setIsFollowing(fData.isFollowing || false)
      }
    } catch { toast.error("加载用户信息失败") }
  }, [id, user])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const fetchTabData = useCallback(async (tab: string) => {
    switch (tab) {
      case "questions":
        try {
          const res = await fetch(`/api/questions?userId=${id}`)
          const data = await res.json()
          setQuestions(data.questions || [])
        } catch {}
        break
      case "answers":
        try {
          const res = await fetch(`/api/users/${id}?include=answers`)
          const data = await res.json()
          setAnswers(data.answers || [])
        } catch {}
        break
      case "resources":
        try {
          const res = await fetch(`/api/resources?userId=${id}`)
          const data = await res.json()
          setResources(data.resources || [])
        } catch {}
        break
      case "favorites":
        try {
          const res = await fetch(`/api/favorites?userId=${id}`)
          const data = await res.json()
          setFavorites(data.favorites || [])
        } catch {}
        break
    }
  }, [id])

  useEffect(() => { fetchTabData(activeTab) }, [activeTab, fetchTabData])

  const handleFollow = async () => {
    if (!user) { toast.error("请先登录"); return }
    try {
      const res = await fetch(`/api/users/${id}/follow`, { method: "POST" })
      if (res.ok) {
        setIsFollowing(!isFollowing)
        toast.success(isFollowing ? "已取消关注" : "已关注")
        fetchProfile()
      } else {
        const d = await res.json()
        toast.error(d.error || "操作失败")
      }
    } catch { toast.error("网络错误") }
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

  if (!profile) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>
  }

  const isSelf = user?.userId === profile.id

  return (
    <div>
      {/* Profile card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl bg-blue-100 text-blue-700">
                {profile.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{profile.name}</h1>
                {profile.role === "admin" && <Badge className="bg-purple-600">管理员</Badge>}
              </div>
              <p className="text-sm text-gray-500">学号: {profile.studentId}</p>
              {profile.bio && <p className="text-sm text-gray-600 mt-1">{profile.bio}</p>}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>关注 {profile._count.following}</span>
                <span>粉丝 {profile._count.followers}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {isSelf ? (
                <Button variant="outline" size="sm" className="gap-1" onClick={() => router.push("/profile/edit")}>
                  <Edit className="h-4 w-4" /> 编辑资料
                </Button>
              ) : user ? (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  className="gap-1"
                  onClick={handleFollow}
                >
                  {isFollowing ? (
                    <><UserMinus className="h-4 w-4" /> 已关注</>
                  ) : (
                    <><UserPlus className="h-4 w-4" /> 关注</>
                  )}
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="questions">提问</TabsTrigger>
          <TabsTrigger value="answers">回答</TabsTrigger>
          <TabsTrigger value="resources">资源</TabsTrigger>
          <TabsTrigger value="favorites">收藏</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-3">
          {questions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">暂无提问</p>
          ) : (
            questions.map((q) => (
              <Link key={q.id} href={`/questions/${q.id}`}>
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{q.title}</p>
                      <div className="flex gap-3 text-xs text-gray-400 mt-1">
                        <Badge variant="secondary" className="text-xs">{q.course.name}</Badge>
                        <span>{q._count.answers} 回答</span>
                        <span>{timeAgo(q.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="answers" className="space-y-3">
          {answers.length === 0 ? (
            <p className="text-gray-400 text-center py-8">暂无回答</p>
          ) : (
            answers.map((a) => (
              <Link key={a.id} href={`/questions/${a.question.id}`}>
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-3">
                    <p className="text-xs text-gray-400 mb-1">回答了: {a.question.title}</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{a.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(a.createdAt)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-3">
          {resources.length === 0 ? (
            <p className="text-gray-400 text-center py-8">暂无上传资源</p>
          ) : (
            resources.map((r) => (
              <Card key={r.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{r.title}</p>
                    <p className="text-xs text-gray-400">{r.fileName} · 下载 {r.downloadCount} 次</p>
                  </div>
                  <a href={`/api/resources/${r.id}/download`}>
                    <Button variant="outline" size="sm">下载</Button>
                  </a>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-3">
          {favorites.length === 0 ? (
            <p className="text-gray-400 text-center py-8">暂无收藏</p>
          ) : (
            favorites.map((f, i) => (
              <Link
                key={f.id}
                href={f.question ? `/questions/${f.question.id}` : `#`}
              >
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-3">
                    <p className="font-medium text-gray-900">
                      {f.question?.title || f.resource?.title || "已删除"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {f.question ? "问题" : "资源"} · {timeAgo(f.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
