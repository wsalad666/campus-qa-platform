"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { MessageCircle, Heart, Bookmark, ThumbsUp, CheckCircle2, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: number
  name: string
  avatar: string | null
  studentId?: string
}
interface Course {
  id: number
  name: string
  code: string
}
interface Comment {
  id: number
  content: string
  createdAt: string
  user: User
}
interface Answer {
  id: number
  content: string
  isAdopted: boolean
  createdAt: string
  user: User
  _count: { likes: number; comments: number }
  comments?: Comment[]
}
interface Question {
  id: number
  title: string
  content: string
  images: string | null
  status: string
  createdAt: string
  userId: number
  user: User
  course: Course
  _count: { likes: number; answers: number }
}
interface SessionUser {
  userId: number
  role: string
}

export default function QuestionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [question, setQuestion] = useState<Question | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [user, setUser] = useState<SessionUser | null>(null)
  const [answerContent, setAnswerContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({})
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({})
  const [submittingComment, setSubmittingComment] = useState<Record<number, boolean>>({})

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user) })
      .catch(() => {})
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [qRes, aRes] = await Promise.all([
        fetch(`/api/questions/${id}`),
        fetch(`/api/questions/${id}/answers`),
      ])
      const qData = await qRes.json()
      const aData = await aRes.json()
      setQuestion(qData)
      setAnswers(aData.answers || [])
    } catch {
      toast.error("加载失败")
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleLikeQuestion = async () => {
    if (!user) { toast.error("请先登录"); return }
    try {
      const res = await fetch(`/api/questions/${id}/like`, { method: "POST" })
      if (res.ok) fetchData()
      else {
        const d = await res.json()
        toast.error(d.error || "操作失败")
      }
    } catch { toast.error("网络错误") }
  }

    const handleFavorite = async () => {
    if (!user) { toast.error("请先登录"); return }
    try {
      if (!question) return
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id }),
      })
      if (res.ok) toast.success("已收藏")
      else {
        const d = await res.json()
        toast.error(d.error || "操作失败")
      }
    } catch { toast.error("网络错误") }
  }

const handleLikeAnswer = async (answerId: number) => {
    if (!user) { toast.error("请先登录"); return }
    try {
      const res = await fetch(`/api/answers/${answerId}/like`, { method: "POST" })
      if (res.ok) fetchData()
      else {
        const d = await res.json()
        toast.error(d.error || "操作失败")
      }
    } catch { toast.error("网络错误") }
  }

  const handleAdopt = async (answerId: number) => {
    try {
      const res = await fetch(`/api/answers/${answerId}/adopt`, { method: "POST" })
      if (res.ok) fetchData()
      else {
        const d = await res.json()
        toast.error(d.error || "操作失败")
      }
    } catch { toast.error("网络错误") }
  }

  const handleSubmitAnswer = async () => {
    if (!answerContent.trim()) { toast.error("请输入回答内容"); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/questions/${id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: answerContent }),
      })
      if (res.ok) {
        toast.success("回答成功")
        setAnswerContent("")
        fetchData()
      } else {
        const d = await res.json()
        toast.error(d.error || "提交失败")
      }
    } catch { toast.error("网络错误") }
    finally { setSubmitting(false) }
  }

  const toggleComments = async (answerId: number) => {
    if (expandedComments[answerId]) {
      setExpandedComments((p) => ({ ...p, [answerId]: false }))
      return
    }
    try {
      const res = await fetch(`/api/answers/${answerId}/comments`)
      const data = await res.json()
      setAnswers((prev) =>
        prev.map((a) => (a.id === answerId ? { ...a, comments: data.comments || [] } : a))
      )
      setExpandedComments((p) => ({ ...p, [answerId]: true }))
    } catch { toast.error("加载评论失败") }
  }

  const handleSubmitComment = async (answerId: number) => {
    const content = commentInputs[answerId]
    if (!content?.trim()) return
    setSubmittingComment((p) => ({ ...p, [answerId]: true }))
    try {
      const res = await fetch(`/api/answers/${answerId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        toast.success("评论成功")
        setCommentInputs((p) => ({ ...p, [answerId]: "" }))
        toggleComments(answerId)
      } else {
        const d = await res.json()
        toast.error(d.error || "评论失败")
      }
    } catch { toast.error("网络错误") }
    finally { setSubmittingComment((p) => ({ ...p, [answerId]: false })) }
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

  if (!question) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>
  }

  const adoptedAnswer = answers.find((a) => a.isAdopted)
  const otherAnswers = answers.filter((a) => !a.isAdopted)

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4 gap-1">
        <ArrowLeft className="h-4 w-4" /> 返回
      </Button>

      {/* Question */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{question.title}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                <Badge variant="secondary">{question.course.name}</Badge>
                <Link href={`/profile/${question.user.id}`} className="hover:text-blue-600 hover:underline">{question.user.name}</Link>
                <span>{timeAgo(question.createdAt)}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLikeQuestion} className="gap-1">
              <Heart className={`h-4 w-4 ${user ? "text-red-400" : ""}`} />
              {question._count.likes}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleFavorite} className="gap-1">
              <Bookmark className="h-4 w-4" />
              收藏
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{question.content}</div>
          {question.images && (
            <div className="mt-4 flex gap-2 flex-wrap">
              {JSON.parse(question.images).map((img: string, i: number) => (
                <img key={i} src={img} alt="" className="max-w-xs rounded border" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Answers */}
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold">回答 ({answers.length})</h2>
      </div>

      {/* Adopted answer */}
      {adoptedAnswer && (
        <Card className="mb-4 border-green-300 bg-green-50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600">已采纳</Badge>
              <span className="font-medium">{adoptedAnswer.user.name}</span>
              <span className="text-xs text-gray-400">{timeAgo(adoptedAnswer.createdAt)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{adoptedAnswer.content}</p>
            <div className="flex items-center gap-2 mt-3">
              <Button variant="ghost" size="sm" onClick={() => handleLikeAnswer(adoptedAnswer.id)} className="gap-1 text-xs">
                <ThumbsUp className="h-3 w-3" /> {adoptedAnswer._count.likes}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toggleComments(adoptedAnswer.id)} className="gap-1 text-xs">
                <MessageCircle className="h-3 w-3" /> {adoptedAnswer._count.comments}
                {expandedComments[adoptedAnswer.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </div>
            {/* Comments */}
            {expandedComments[adoptedAnswer.id] && (
              <div className="mt-3 border-t pt-3">
                {(adoptedAnswer.comments || []).map((c) => (
                  <div key={c.id} className="text-sm py-1">
                    <span className="font-medium text-gray-700">{c.user.name}:</span>{" "}
                    <span className="text-gray-600">{c.content}</span>
                  </div>
                ))}
                {user && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="添加评论..."
                      value={commentInputs[adoptedAnswer.id] || ""}
                      onChange={(e) => setCommentInputs((p) => ({ ...p, [adoptedAnswer.id]: e.target.value }))}
                      className="h-8 text-sm"
                      onKeyDown={(e) => { if (e.key === "Enter") handleSubmitComment(adoptedAnswer.id) }}
                    />
                    <Button size="sm" disabled={submittingComment[adoptedAnswer.id]} onClick={() => handleSubmitComment(adoptedAnswer.id)}>
                      发送
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Other answers */}
      <div className="space-y-4">
        {otherAnswers.map((a) => (
          <Card key={a.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">{a.user.name[0]}</AvatarFallback>
                  </Avatar>
                  <Link href={`/profile/${a.user.id}`} className="font-medium text-sm hover:text-blue-600 hover:underline">{a.user.name}</Link>
                  <span className="text-xs text-gray-400">{timeAgo(a.createdAt)}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{a.content}</p>
              <div className="flex items-center gap-2 mt-3">
                <Button variant="ghost" size="sm" onClick={() => handleLikeAnswer(a.id)} className="gap-1 text-xs">
                  <ThumbsUp className="h-3 w-3" /> {a._count.likes}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleComments(a.id)} className="gap-1 text-xs">
                  <MessageCircle className="h-3 w-3" /> {a._count.comments}
                  {expandedComments[a.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
                {user && user.userId === question.userId && (
                  <Button variant="ghost" size="sm" onClick={() => handleAdopt(a.id)} className="gap-1 text-xs text-green-600">
                    <CheckCircle2 className="h-3 w-3" /> 采纳
                  </Button>
                )}
              </div>
              {/* Comments */}
              {expandedComments[a.id] && (
                <div className="mt-3 border-t pt-3">
                  {(a.comments || []).map((c) => (
                    <div key={c.id} className="text-sm py-1">
                      <span className="font-medium text-gray-700">{c.user.name}:</span>{" "}
                      <span className="text-gray-600">{c.content}</span>
                    </div>
                  ))}
                  {user && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="添加评论..."
                        value={commentInputs[a.id] || ""}
                        onChange={(e) => setCommentInputs((p) => ({ ...p, [a.id]: e.target.value }))}
                        className="h-8 text-sm"
                        onKeyDown={(e) => { if (e.key === "Enter") handleSubmitComment(a.id) }}
                      />
                      <Button size="sm" disabled={submittingComment[a.id]} onClick={() => handleSubmitComment(a.id)}>
                        发送
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Answer form */}
      {user && (
        <Card className="mt-6">
          <CardHeader><h3 className="font-semibold">撰写回答</h3></CardHeader>
          <CardContent>
            <Textarea
              placeholder="写下你的回答..."
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
              rows={4}
              className="mb-3"
            />
            <Button onClick={handleSubmitAnswer} disabled={submitting}>
              {submitting ? "提交中..." : "提交回答"}
            </Button>
          </CardContent>
        </Card>
      )}

      {!user && (
        <p className="text-center text-gray-400 mt-6">
          <Link href="/login" className="text-blue-600 hover:underline">登录</Link> 后可以回答问题
        </p>
      )}
    </div>
  )
}
