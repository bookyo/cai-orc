# 财务 CRM 系统

智能文档识别与管理系统，基于 Next.js + MongoDB + GLM AI 构建。

[![GitHub Stars](https://img.shields.io/github/stars/bookyo/cai-orc?style=social)](https://github.com/bookyo/cai-orc)
[![GitHub Issues](https://img.shields.io/github/issues/bookyo/cai-orc)](https://github.com/bookyo/cai-orc/issues)

## 功能特性

- 📄 **多格式支持**：支持 PDF、JPG、PNG 图片上传
- 🔍 **智能识别**：集成 GLM-OCR 进行文档文字识别
- 🤖 **AI 解析**：使用 GLM-4.7 将 OCR 结果转换为结构化数据
- 👥 **用户管理**：支持多角色权限管理（管理员、运营、访客）
- 🔐 **权限控制**：基于角色的细粒度权限管理
- 📊 **报表分析**：可视化图表展示数据统计
- 🔎 **高级搜索**：支持全文搜索和多条件筛选
- 💾 **数据导出**：支持导出为 JSON/CSV 格式
- 🖼️ **原图预览**：文档详情页支持原图预览和下载

## 支持的文档类型

| 类型 | 说明 | 识别字段 |
|------|------|----------|
| **发票** | 增值税发票、普通发票 | 发票号、金额、税额、买卖方、明细 |
| **证书** | 各种资质证书 | 证书名称、编号、颁发机构、有效期 |
| **简历** | 个人简历文档 | 姓名、联系方式、教育经历、工作经历 |
| **手写笔记** | 手写内容识别 | 文字内容、置信度 |
| **财务报表** | 资产负债表、利润表 | 报表类型、期间、各项财务指标 |

## 技术栈

- **前端**：Next.js 15 + React 19 + TypeScript
- **样式**：Tailwind CSS + shadcn/ui
- **数据库**：MongoDB + Mongoose
- **AI 服务**：GLM-OCR + GLM-4.7
- **图表**：Recharts
- **认证**：JWT + bcrypt

## 快速开始

### 前置要求

- Node.js 18+
- MongoDB 5.0+
- GLM API Key（从 https://open.bigmodel.cn/ 获取）

### 安装

```bash
# 克隆项目
git clone https://github.com/bookyo/cai-orc.git
cd cai-orc

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local

# 编辑 .env.local，填入您的 API 密钥
```

### 环境变量配置

```env
# MongoDB 配置
MONGODB_URI=mongodb://localhost:27017/cai-orc

# GLM API 配置
GLM_API_KEY=your_glm_api_key_here

# JWT 配置
JWT_SECRET=your-secret-key-change-in-production

# 管理员账号配置
ADMIN_PHONE=13800138000
ADMIN_PASSWORD=admin123456
ADMIN_NAME=系统管理员
```

### 初始化系统

```bash
# 运行初始化脚本，创建默认管理员账号
npm run init
```

### 启动服务

```bash
# 启动 MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

默认管理员账号：
- 手机号：`13800138000`
- 密码：`admin123456`

### 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
cai-orc/
├── app/                        # Next.js App Router
│   ├── page.tsx             # 主仪表盘
│   ├── login/               # 登录页面
│   ├── upload/              # 文档上传
│   ├── documents/           # 文档列表和详情
│   │   ├── page.tsx         # 文档列表
│   │   └── [id]/           # 文档详情
│   ├── reports/             # 报表分析
│   ├── settings/            # 系统设置
│   ├── users/               # 用户管理
│   ├── api/                 # API 路由
│   │   ├── auth/           # 认证接口
│   │   ├── documents/      # 文档接口
│   │   ├── export/         # 导出接口
│   │   ├── reports/        # 报表接口
│   │   └── users/         # 用户接口
│   └── layout.tsx         # 根布局
│
├── lib/                        # 工具库
│   ├── services/            # GLM API 服务
│   │   ├── glmOcr.ts      # OCR 识别
│   │   └── glmParser.ts   # AI 解析
│   ├── storage/             # 文件存储
│   ├── mongodb.ts           # 数据库连接
│   ├── env.ts               # 环境变量
│   ├── auth.ts              # JWT 认证
│   └── permission.ts        # 权限检查
│
├── models/                    # Mongoose 模型
│   ├── Document.ts          # 文档模型
│   ├── User.ts              # 用户模型
│   └── AuditLog.ts          # 审计日志
│
├── types/                    # TypeScript 类型
│   ├── document.ts          # 文档类型
│   └── user.ts              # 用户类型
│
├── components/               # React 组件
│   └── ui/                  # UI 基础组件
│
├── scripts/                   # 脚本
│   └── init.ts              # 系统初始化
│
├── public/                   # 静态资源
│   └── uploads/             # 上传文件
│
├── middleware.ts             # Next.js 中间件
├── next.config.ts            # Next.js 配置
├── tailwind.config.ts        # Tailwind 配置
└── package.json              # 项目配置
```

## API 接口

### 文档上传

```http
POST /api/documents/upload
Content-Type: multipart/form-data

file: <文件>
documentType: <类型>
```

### 文档列表

```http
GET /api/documents?page=1&limit=20&documentType=invoice&status=completed
```

### 文档处理

```http
POST /api/documents/process
Content-Type: application/json

{
  "documentId": "文档ID"
}
```

### 统计报表

```http
GET /api/reports?range=month
```

### 数据导出

```http
POST /api/export
Content-Type: application/json

{
  "format": "json",
  "ids": ["id1", "id2"]
}
```

## 开发指南

### 添加新的文档类型

1. 在 `types/document.ts` 中添加类型定义
2. 在 `lib/services/glmParser.ts` 中添加 Prompt 模板
3. 在 `models/Document.ts` 中添加数据结构
4. 更新前端页面以支持新类型

### 自定义 UI 组件

```tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 使用 Tailwind CSS 自定义样式
<div className="custom-class">...</div>
```

## 常见问题

### Q: OCR 识别失败怎么办？

A: 检查以下几点：
- GLM API Key 是否正确配置
- 图片清晰度是否足够
- 文件格式是否支持
- API 余额是否充足

### Q: 如何提高识别准确率？

A:
- 使用高分辨率扫描件
- 确保图片清晰、无倾斜
- 避免光线过强或过弱
- 选择正确的文档类型

### Q: 数据存储在哪里？

A:
- 文件存储在 `public/uploads/` 目录
- 元数据存储在 MongoDB 数据库
- 可配置云存储（如 OSS、S3）

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 仓库地址

- **GitHub**：https://github.com/bookyo/cai-orc
- **问题反馈**：https://github.com/bookyo/cai-orc/issues

## 推荐

**[Elysia Tools](https://elysiatools.com)** - 工具、可视化与样例的一站式平台

- 🛠️ 丰富的开发工具集合
- 📊 可视化组件与示例
- 📚 完整的技术文档和教程
- 🚀 高效的开发体验
