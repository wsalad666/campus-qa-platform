'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BookOpen, FileText, User, LogOut, Menu, X, Shield } from 'lucide-react'

interface SessionUser {
  userId: number
  email: string
  role: string
  name?: string
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => { if (data.user) setUser(data.user) })
      .catch(() => {})
  }, [pathname])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/login')
  }

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-blue-700">
            <BookOpen className="h-5 w-5" />
            校园互助答疑
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/" className={`text-sm ${pathname === '/' ? 'text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900'}`}>
              首页
            </Link>
            {user && (
              <Link href="/resources" className={`text-sm ${pathname.startsWith('/resources') ? 'text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900'}`}>
                资源库
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link href="/admin" className={`text-sm ${pathname.startsWith('/admin') ? 'text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900'}`}>
                管理后台
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="outline" size="sm" onClick={() => router.push('/questions/new')} className="hidden md:flex gap-1">
                <FileText className="h-4 w-4" /> 提问
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                      {user.name?.[0] || user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => router.push(`/profile/${user.userId}`)}>
                    <User className="h-4 w-4 mr-2" /> 个人主页
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem onClick={() => router.push('/admin')}>
                      <Shield className="h-4 w-4 mr-2" /> 管理后台
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" /> 退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>登录</Button>
              <Button size="sm" onClick={() => router.push('/register')}>注册</Button>
            </div>
          )}
        </div>
      </div>

      {menuOpen && user && (
        <div className="md:hidden border-t bg-white px-4 py-3 flex flex-col gap-2">
          <Link href="/" className="text-sm py-1" onClick={() => setMenuOpen(false)}>首页</Link>
          <Link href="/resources" className="text-sm py-1" onClick={() => setMenuOpen(false)}>资源库</Link>
          <Link href="/questions/new" className="text-sm py-1" onClick={() => setMenuOpen(false)}>提问</Link>
          {user.role === 'admin' && (
            <Link href="/admin" className="text-sm py-1" onClick={() => setMenuOpen(false)}>管理后台</Link>
          )}
        </div>
      )}
    </nav>
  )
}