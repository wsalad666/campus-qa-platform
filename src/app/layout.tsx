import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import Navbar from "@/components/Navbar"

export const metadata: Metadata = {
  title: "校园互助答疑平台",
  description: "聚焦专业课疑难答疑、课程资料分享的校园互助学习平台",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50">
        <TooltipProvider>
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-6">
            {children}
          </main>
          <Toaster position="top-center" />
        </TooltipProvider>
      </body>
    </html>
  )
}
