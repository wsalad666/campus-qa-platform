"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<"form" | "verify">("form")
  const [studentId, setStudentId] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [devCode, setDevCode] = useState<string | null>(null)

  const handleSendCode = async () => {
    if (!email) {
      toast.error("请先填写邮箱")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("请输入有效的邮箱地址")
      return
    }
    setSendingCode(true)
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        if (data.devCode) {
          setDevCode(data.devCode)
        }
        setStep("verify")
      } else {
        toast.error(data.error || "发送失败")
      }
    } catch {
      toast.error("网络错误")
    } finally {
      setSendingCode(false)
    }
  }

  const handleVerify = async () => {
    if (!code) {
      toast.error("请输入验证码")
      return
    }
    setLoading(true)
    try {
      const verifyRes = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) {
        toast.error(verifyData.error || "验证失败")
        setLoading(false)
        return
      }

      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, name, email, password }),
      })
      const registerData = await registerRes.json()
      if (!registerRes.ok) {
        toast.error(registerData.error || "注册失败")
        setLoading(false)
        return
      }

      toast.success("注册成功，请登录")
      router.push("/login")
    } catch {
      toast.error("网络错误")
    } finally {
      setLoading(false)
    }
  }

  if (step === "verify") {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">验证邮箱</CardTitle>
            <CardDescription>验证码已发送至 {email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-700">
                📧 一封包含6位验证码的邮件已发送至你的邮箱，请查收（检查垃圾邮件箱）。
              </p>
              {devCode && (
                <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-sm text-amber-700 font-medium mb-1">⚠️ SMTP 未配置 — 开发模式</p>
                  <p className="text-2xl font-bold tracking-widest text-amber-800">{devCode}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">验证码</Label>
              <Input
                id="code"
                placeholder="请输入6位验证码"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
              />
            </div>
            <Button onClick={handleVerify} className="w-full" disabled={loading}>
              {loading ? "验证中..." : "验证并注册"}
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep("form")}>
                返回修改信息
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={sendingCode}
                onClick={handleSendCode}
              >
                {sendingCode ? "发送中..." : "重新发送"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">注册</CardTitle>
          <CardDescription>加入校园互助答疑平台</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!studentId || !name || !email || !password || !confirmPassword) {
                toast.error("请填写所有字段")
                return
              }
              if (password.length < 6) {
                toast.error("密码至少6个字符")
                return
              }
              if (password !== confirmPassword) {
                toast.error("两次密码不一致")
                return
              }
              handleSendCode()
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="studentId">学号</Label>
              <Input
                id="studentId"
                placeholder="请输入学号"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                placeholder="请输入姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少6个字符"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={sendingCode}>
              {sendingCode ? "发送中..." : "发送验证码"}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            已有账号？{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              立即登录
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
