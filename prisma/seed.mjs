import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Seed courses
  const courses = [
    { name: '高等数学', code: 'MATH101', description: '微积分、级数、微分方程等' },
    { name: '线性代数', code: 'MATH102', description: '矩阵、向量空间、特征值等' },
    { name: '程序设计基础', code: 'CS101', description: 'C/C++程序设计入门' },
    { name: '数据结构', code: 'CS201', description: '链表、树、图、排序算法等' },
    { name: '计算机网络', code: 'CS301', description: 'TCP/IP、HTTP、网络协议栈等' },
    { name: '操作系统', code: 'CS302', description: '进程管理、内存管理、文件系统等' },
    { name: '数据库原理', code: 'CS303', description: '关系模型、SQL、事务管理等' },
    { name: '大学英语', code: 'ENGL101', description: '综合英语读写听说训练' },
    { name: '大学物理', code: 'PHYS101', description: '力学、热学、电磁学基础' },
    { name: '马克思主义原理', code: 'POLI101', description: '马克思主义基本理论' },
  ]

  for (const course of courses) {
    await prisma.course.upsert({
      where: { code: course.code },
      update: {},
      create: course,
    })
  }
  console.log(`Seeded ${courses.length} courses`)

  // Seed admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@campus.edu' },
    update: {},
    create: {
      studentId: 'ADMIN001',
      name: '系统管理员',
      email: 'admin@campus.edu',
      password: adminPassword,
      role: 'admin',
      bio: '校园互助答疑平台管理员',
    },
  })
  console.log('Seeded admin user: admin@campus.edu / admin123')

  // Seed demo users
  const demoPassword = await bcrypt.hash('123456', 10)
  const demoUsers = [
    { studentId: '2024001', name: '张三', email: 'zhangsan@campus.edu' },
    { studentId: '2024002', name: '李四', email: 'lisi@campus.edu' },
    { studentId: '2024003', name: '王五', email: 'wangwu@campus.edu' },
  ]
  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: demoPassword, role: 'user' },
    })
  }
  console.log('Seeded 3 demo users (password: 123456)')

  console.log('\nSeed completed!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
