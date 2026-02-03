/**
 * 权限检查工具函数
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "./auth";
import type { Permissions } from "@/types/user";

/**
 * 检查用户权限
 */
export async function requirePermission(
  request: NextRequest,
  permissionKey: keyof Permissions
): Promise<{ user: any } | NextResponse> {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      { error: "未登录，请先登录" },
      { status: 401 }
    );
  }

  if (!user.permissions[permissionKey]) {
    return NextResponse.json(
      { error: "无权限执行此操作" },
      { status: 403 }
    );
  }

  return { user };
}

/**
 * 权限装饰器工厂
 */
export function withPermission(permissionKey: keyof Permissions) {
  return async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    // 这里先不验证，在各个路由中手动调用
    return NextResponse.next();
  };
}
