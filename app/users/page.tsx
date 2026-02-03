/**
 * 用户管理页面（仅 admin）
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { ROLE_CONFIG } from "@/lib/role-config";

/**
 * 用户管理页面
 */
export default function UsersPage() {
  const { user, logout, hasPermission } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    phone: "",
    password: "",
    name: "",
    role: "operation" as "admin" | "operation" | "guest",
  });

  // 检查权限
  useEffect(() => {
    if (!loading && !hasPermission("canManageUsers")) {
      window.location.href = "/";
    }
  }, [loading, hasPermission]);

  /**
   * 获取用户列表
   */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  /**
   * 创建用户
   */
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();

      if (data.success) {
        setShowAddModal(false);
        setNewUser({ phone: "", password: "", name: "", role: "operation" });
        fetchUsers();
        alert("用户创建成功");
      } else {
        alert(data.error || "创建失败");
      }
    } catch (error) {
      console.error("Failed to create user:", error);
      alert("创建失败");
    }
  };

  /**
   * 删除用户
   */
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`确定要删除用户 "${userName}" 吗？`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        fetchUsers();
        alert("用户删除成功");
      } else {
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("删除失败");
    }
  };

  /**
   * 切换用户状态
   */
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await res.json();

      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || "操作失败");
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("操作失败");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <div className="p-2 bg-primary rounded-lg">
                  <Users className="h-6 w-6 text-primary-foreground" />
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold">用户管理</h1>
                <p className="text-sm text-muted-foreground">
                  管理系统用户和权限
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">
                {user?.name} ({ROLE_CONFIG[user?.role as keyof typeof ROLE_CONFIG]?.label})
              </span>
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                退出
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* 操作栏 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">用户列表</h2>
                <p className="text-sm text-muted-foreground">
                  共 {users.length} 个用户
                </p>
              </div>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                添加用户
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 用户列表 */}
        <div className="space-y-3">
          {users.map((userItem, index) => (
            <Card key={userItem.id || index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gray-100 rounded-full">
                      <UserIcon className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{userItem.name}</h3>
                        <Badge
                          className={
                            ROLE_CONFIG[userItem.role as keyof typeof ROLE_CONFIG]
                              ?.color
                          }
                        >
                          {ROLE_CONFIG[userItem.role as keyof typeof ROLE_CONFIG]
                            ?.label || userItem.role}
                        </Badge>
                        {userItem.role === "admin" && (
                          <Shield className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {userItem.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {userItem.isActive ? (
                      <Badge variant="success">正常</Badge>
                    ) : (
                      <Badge variant="destructive">已禁用</Badge>
                    )}

                    {userItem.role !== "admin" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleStatus(userItem.id, userItem.isActive)
                          }
                        >
                          {userItem.isActive ? "禁用" : "启用"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleDeleteUser(userItem.id, userItem.name)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 添加用户弹窗 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>添加新用户</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">姓名</label>
                    <Input
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      placeholder="请输入姓名"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">手机号</label>
                    <Input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) =>
                        setNewUser({ ...newUser, phone: e.target.value })
                      }
                      placeholder="请输入手机号"
                      pattern="[0-9]{11}"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">密码</label>
                    <Input
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      placeholder="请输入密码（至少6位）"
                      minLength={6}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">角色</label>
                    <Select
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          role: e.target.value as "operation" | "guest",
                        })
                      }
                    >
                      <option value="operation">操作员</option>
                      <option value="guest">访客</option>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddModal(false)}
                    >
                      取消
                    </Button>
                    <Button type="submit">创建</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
