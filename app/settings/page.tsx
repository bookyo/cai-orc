/**
 * 系统设置页面
 */

"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/**
 * 设置项组件
 */
function SettingItem({
  label,
  description,
  value,
  type = "text",
  placeholder,
  onChange,
  secret = false,
}: {
  label: string;
  description?: string;
  value: string;
  type?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  secret?: boolean;
}) {
  const [showSecret, setShowSecret] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        {secret && value && (
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      <Input
        type={secret && !showSecret ? "password" : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-mono text-sm"
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

/**
 * 设置分组
 */
function SettingsGroup({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * 系统设置页面
 */
export default function SettingsPage() {
  const [settings, setSettings] = useState({
    glmApiKey: "",
    glmOcrApiUrl: "https://open.bigmodel.cn/api/paas/v4/layout_parsing",
    glmChatApiUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    mongodbUri: "mongodb://localhost:27017/cai-orc",
    baseUrl: "http://localhost:3000",
    maxFileSize: "10485760",
    uploadDir: "./public/uploads",
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /**
   * 加载设置
   */
  useEffect(() => {
    // 从 localStorage 加载
    const savedSettings = localStorage.getItem("app_settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch {
        // 忽略解析错误
      }
    }
  }, []);

  /**
   * 保存设置
   */
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    // 保存到 localStorage（仅用于前端演示）
    // 实际生产环境应该调用后端 API 保存到配置文件或数据库
    localStorage.setItem("app_settings", JSON.stringify(settings));

    // 模拟保存延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    setSaving(false);
    setSaved(true);

    // 3秒后隐藏成功提示
    setTimeout(() => setSaved(false), 3000);
  };

  /**
   * 测试 API 连接
   */
  const testConnection = async (type: "glm" | "mongodb") => {
    try {
      if (type === "glm") {
        const res = await fetch("/api/test/glm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: settings.glmApiKey }),
        });
        if (res.ok) {
          alert("GLM API 连接成功！");
        } else {
          alert("GLM API 连接失败，请检查密钥");
        }
      }
    } catch (error) {
      alert(`连接测试失败: ${error}`);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="p-2 bg-primary rounded-lg">
                <SettingsIcon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">系统设置</h1>
                <p className="text-sm text-muted-foreground">配置 API 密钥和系统参数</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {saved && (
                <Badge variant="success" className="animate-fade-in">
                  已保存
                </Badge>
              )}
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "保存中..." : "保存设置"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* GLM API 配置 */}
        <SettingsGroup
          title="GLM API 配置"
          description="配置智谱 AI 的 API 密钥和接口地址"
        >
          <SettingItem
            label="API 密钥"
            description="您的智谱 AI API Key，从 https://open.bigmodel.cn/ 获取"
            value={settings.glmApiKey}
            placeholder="输入您的 GLM API Key"
            secret
            onChange={(value) => setSettings((prev) => ({ ...prev, glmApiKey: value }))}
          />
          <SettingItem
            label="OCR API 地址"
            value={settings.glmOcrApiUrl}
            onChange={(value) => setSettings((prev) => ({ ...prev, glmOcrApiUrl: value }))}
          />
          <SettingItem
            label="Chat API 地址"
            value={settings.glmChatApiUrl}
            onChange={(value) => setSettings((prev) => ({ ...prev, glmChatApiUrl: value }))}
          />
          <Button
            variant="outline"
            onClick={() => testConnection("glm")}
            disabled={!settings.glmApiKey}
          >
            测试 GLM API 连接
          </Button>
        </SettingsGroup>

        {/* 数据库配置 */}
        <SettingsGroup
          title="数据库配置"
          description="MongoDB 连接配置"
          className="mt-6"
        >
          <SettingItem
            label="MongoDB URI"
            description="数据库连接字符串"
            value={settings.mongodbUri}
            placeholder="mongodb://localhost:27017/cai-orc"
            onChange={(value) => setSettings((prev) => ({ ...prev, mongodbUri: value }))}
          />
        </SettingsGroup>

        {/* 文件存储配置 */}
        <SettingsGroup
          title="文件存储配置"
          description="文件上传和存储相关设置"
          className="mt-6"
        >
          <SettingItem
            label="基础 URL"
            description="应用访问地址，用于生成文件链接"
            value={settings.baseUrl}
            placeholder="http://localhost:3000"
            onChange={(value) => setSettings((prev) => ({ ...prev, baseUrl: value }))}
          />
          <SettingItem
            label="上传目录"
            description="文件存储路径（相对于项目根目录）"
            value={settings.uploadDir}
            placeholder="./public/uploads"
            onChange={(value) => setSettings((prev) => ({ ...prev, uploadDir: value }))}
          />
          <SettingItem
            label="最大文件大小"
            description="单个文件最大大小（字节），默认 10MB = 10485760"
            value={settings.maxFileSize}
            type="number"
            placeholder="10485760"
            onChange={(value) => setSettings((prev) => ({ ...prev, maxFileSize: value }))}
          />
        </SettingsGroup>

        {/* 说明信息 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">设置说明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• API 密钥存储在本地浏览器中，仅用于前端演示</p>
            <p>• 生产环境应通过环境变量或配置文件管理敏感信息</p>
            <p>• 修改数据库配置后需要重启服务才能生效</p>
            <p>• GLM API 调用会产生费用，请根据使用量充值</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
