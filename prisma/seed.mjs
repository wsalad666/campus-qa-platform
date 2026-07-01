import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Create default courses
  const course1 = await prisma.course.upsert({
    where: { code: "MATH101" },
    update: {},
    create: { name: "高等数学", code: "MATH101", description: "大学高等数学课程" },
  })
  const course2 = await prisma.course.upsert({
    where: { code: "PHYS101" },
    update: {},
    create: { name: "大学物理", code: "PHYS101", description: "大学物理课程" },
  })
  const course3 = await prisma.course.upsert({
    where: { code: "CS101" },
    update: {},
    create: { name: "程序设计基础", code: "CS101", description: "C语言程序设计" },
  })

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@campus.edu" },
    update: {},
    create: {
      email: "admin@campus.edu",
      password: hashedPassword,
      name: "系统管理员",
      studentId: "ADMIN001",
      role: "admin",
    },
  })

  console.log("Seed completed! Courses: 3, Admin user created")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })