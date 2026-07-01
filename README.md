# 校园互助答疑平台

轻量化知乎校园版 — 聚焦专业课疑难答疑、课程资料分享，打通同校学生互助学习场景。

## 技术栈

- **前端**: Next.js 16 (App Router) + React 19 + TypeScript
- **UI**: Tailwind CSS v4 + shadcn/ui
- **后端**: Next.js API Routes
- **ORM**: Prisma 5 + SQLite
- **认证**: JWT (jose) + Cookie
- **Icons**: lucide-react

## 快速启动

```bash
# 安装依赖
npm install

# 初始化数据库（已预建，如有问题重新创建）
npx prisma generate
node prisma/seed.mjs

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 预置账号

| 角色 | 邮箱 | 密码 | 学号 |
|------|------|------|------|
| 管理员 | admin@campus.edu | admin123 | ADMIN001 |
| 学生 | zhangsan@campus.edu | 123456 | 2024001 |
| 学生 | lisi@campus.edu | 123456 | 2024002 |
| 学生 | wangwu@campus.edu | 123456 | 2024003 |

## 功能模块

### 用户模块
- 学号注册 + 邮箱验证码（开发阶段控制台输出验证码）
- JWT 登录 / 登出
- 个人主页（提问、回答、资源、收藏）
- 修改资料
- 关注 / 取关好友

### 问答板块
- 发布课程问题
- 回答问题 + 采纳优质答案
- 评论回复（问题下评论 + 回答下评论）
- 点赞问题 / 回答
- 按课程筛选 + 关键词搜索

### 资源板块
- 上传课件 / 习题资料
- 按课程分类检索
- 下载资料（计数）
- 收藏资源

### 管理后台 (/admin)
- 违规问答下架 / 恢复
- 课程分类维护（增删改）
- 活跃用户数据统计

## 项目结构

```
src/
├── app/
│   ├── api/           # API 路由
│   │   ├── auth/      # 认证相关
│   │   ├── users/     # 用户相关
│   │   ├── questions/ # 问答相关
│   │   ├── answers/   # 回答相关
│   │   ├── comments/  # 评论相关
│   │   ├── resources/ # 资源相关
│   │   ├── favorites/ # 收藏相关
│   │   └── admin/     # 管理后台
│   ├── login/         # 登录页
│   ├── register/      # 注册页
│   ├── questions/     # 问题相关页面
│   ├── resources/     # 资源相关页面
│   ├── profile/       # 个人主页
│   └── admin/         # 管理后台页面
├── components/
│   ├── ui/            # shadcn/ui 组件
│   └── Navbar.tsx     # 导航栏
└── lib/
    ├── prisma.ts      # Prisma 客户端单例
    └── auth.ts        # JWT 认证工具
prisma/
├── schema.prisma      # 数据模型
├── seed.mjs           # 种子数据
└── dev.db             # SQLite 数据库
```

## API 端点

### 认证
- `POST /api/auth/register` — 注册
- `POST /api/auth/send-code` — 发送验证码
- `POST /api/auth/verify-code` — 验证验证码
- `POST /api/auth/login` — 登录
- `GET /api/auth/session` — 获取会话
- `POST /api/auth/logout` — 登出

### 用户
- `GET /api/users/[id]` — 用户详情
- `PUT /api/users/[id]` — 修改资料
- `GET/POST/DELETE /api/users/[id]/follow` — 关注管理

### 问题
- `GET/POST /api/questions` — 问题列表 / 创建
- `GET/PUT/DELETE /api/questions/[id]` — 问题详情 / 修改 / 删除
- `POST/DELETE /api/questions/[id]/like` — 点赞
- `POST /api/questions/[id]/answers` — 创建回答
- `POST /api/questions/[id]/comments` — 问题评论

### 回答
- `PUT/DELETE /api/answers/[id]` — 修改 / 删除
- `POST /api/answers/[id]/adopt` — 采纳
- `POST/DELETE /api/answers/[id]/like` — 点赞
- `POST /api/answers/[id]/comments` — 回答评论

### 资源
- `GET/POST /api/resources` — 列表 / 上传
- `GET/DELETE /api/resources/[id]` — 详情 / 删除
- `GET /api/resources/[id]/download` — 下载

### 收藏
- `POST /api/favorites` — 添加收藏
- `DELETE /api/favorites/[id]` — 取消收藏

### 管理
- `GET/PUT /api/admin/questions/[id]` — 问答管理
- `GET/POST/PUT/DELETE /api/admin/courses/[id]` — 课程维护
- `GET /api/admin/stats` — 数据统计