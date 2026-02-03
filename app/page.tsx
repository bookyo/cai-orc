/**
 * 主仪表盘页面
 */

"use client";

import Link from "next/link";
import {
  FileText,
  Upload,
  BarChart3,
  Receipt,
  Award,
  User,
  FileCheck,
  Loader2,
  LogOut,
  Users,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { ROLE_CONFIG } from "@/lib/role-config";

/**
 * 快速导航卡片
 */
function QuickNavCard({
  title,
  description,
  href,
  icon: Icon,
  permission,
}: {
  title: string;
  description: string;
  href: string;
  icon: any;
  permission?: string;
}) {
  const { hasPermission } = useAuth();

  // 如果需要权限检查且用户没有权限，不显示卡片
  if (permission && !hasPermission(permission as any)) {
    return null;
  }

  return (
    <Link href={href}>
      <Card className="transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer h-full">
        <CardHeader>
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold text-lg mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * 统计卡片组件
 */
function StatCard({
  title,
  value,
  icon: Icon,
  color = "blue",
}: {
  title: string;
  value: number | string;
  icon: any;
  color?: "blue" | "green" | "yellow" | "purple" | "red";
}) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-600",
    green: "bg-green-500/10 text-green-600",
    yellow: "bg-yellow-500/10 text-yellow-600",
    purple: "bg-purple-500/10 text-purple-600",
    red: "bg-red-500/10 text-red-600",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

/**
 * 主页面组件
 */
export default function HomePage() {
  const { user, logout, hasPermission } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* 顶部导航栏 */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">财务 CRM 系统</h1>
                <p className="text-sm text-muted-foreground">智能文档识别与管理</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{user.name}</span>
                <Badge className={ROLE_CONFIG[user.role]?.color}>
                  {ROLE_CONFIG[user.role]?.label}
                </Badge>
              </div>

              {/* 用户管理（仅 admin） */}
              {hasPermission("canManageUsers") && (
                <Link href="/users">
                  <Button variant="ghost" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    用户管理
                  </Button>
                </Link>
              )}

              <Link href="/reports">
                <Button variant="ghost">报表分析</Button>
              </Link>

              <Button variant="outline" onClick={logout} size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                退出
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* 欢迎区域 */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            欢迎，{user.name}！
          </h2>
          <p className="text-muted-foreground">
            上传您的财务文档，AI 将自动识别并提取结构化数据
          </p>
        </div>

        {/* 快速操作 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">快速操作</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <QuickNavCard
              title="上传文档"
              description="上传 PDF 或图片进行 OCR 识别"
              href="/upload"
              icon={Upload}
              permission="canUpload"
            />
            <QuickNavCard
              title="文档列表"
              description="查看和管理所有已上传的文档"
              href="/documents"
              icon={FileText}
              permission="canViewDocuments"
            />
            <QuickNavCard
              title="报表分析"
              description="查看发票金额统计和趋势分析"
              href="/reports"
              icon={BarChart3}
              permission="canViewReports"
            />
            {hasPermission("canManageSettings") && (
              <QuickNavCard
                title="系统设置"
                description="配置 API 密钥和系统参数"
                href="/settings"
                icon={Settings}
              />
            )}
          </div>
        </div>

        {/* 文档类型支持 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">支持的文档类型</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Receipt className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium">发票</h4>
                  <p className="text-xs text-muted-foreground">
                    自动识别发票号码、金额、税额等
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-medium">证书</h4>
                  <p className="text-xs text-muted-foreground">
                    识别证书名称、编号、有效期等
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-medium">简历</h4>
                  <p className="text-xs text-muted-foreground">
                    提取个人信息、教育经历等
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <FileCheck className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h4 className="font-medium">手写</h4>
                  <p className="text-xs text-muted-foreground">
                    识别手写笔记和内容
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-red-600" />
                  </div>
                  <h4 className="font-medium">财务报表</h4>
                  <p className="text-xs text-muted-foreground">
                    解析财务报表和统计数据
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
