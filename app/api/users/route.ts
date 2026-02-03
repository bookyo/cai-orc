/**
 * 用户管理 API 路由
 * GET /api/users - 获取用户列表
 * POST /api/users - 创建新用户（仅 admin）
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models";
import { requirePermission } from "@/lib/permission";
import { ROLE_PERMISSIONS, UserRole } from "@/types/user";

/**
 * GET 获取用户列表
 */
export async function GET(request: NextRequest) {
  // 权限检查
  const permissionResult = await requirePermission(request, "canManageUsers");
  if (permissionResult instanceof NextResponse) {
    return permissionResult;
  }

  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role");
    const isActive = searchParams.get("isActive");

    const query: any = {};

    if (role && role !== "all") {
      query.role = role;
    }

    if (isActive !== null && isActive !== "all") {
      query.isActive = isActive === "true";
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error("Get users error:", error);
    return NextResponse.json(
      {
        error: "获取用户列表失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST 创建新用户
 */
export async function POST(request: NextRequest) {
  // 权限检查
  const permissionResult = await requirePermission(request, "canManageUsers");
  if (permissionResult instanceof NextResponse) {
    return permissionResult;
  }

  try {
    const body = await request.json();
    const { phone, password, name, role } = body;

    // 验证参数
    if (!phone || !password || !name || !role) {
      return NextResponse.json(
        { error: "请填写完整信息" },
        { status: 400 }
      );
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "手机号格式不正确" },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码长度不能少于6位" },
        { status: 400 }
      );
    }

    // 验证角色
    if (!["admin", "operation", "guest"].includes(role)) {
      return NextResponse.json(
        { error: "无效的用户角色" },
        { status: 400 }
      );
    }

    // admin 不能创建其他 admin
    if (role === "admin") {
      return NextResponse.json(
        { error: "不能创建管理员账号" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 检查手机号是否已存在
    const existingUser = await User.findByPhone(phone);
    if (existingUser) {
      return NextResponse.json(
        { error: "该手机号已被注册" },
        { status: 400 }
      );
    }

    // 创建用户
    const user = await User.create({
      phone,
      password,
      name,
      role,
      permissions: ROLE_PERMISSIONS[role as UserRole],
    });

    return NextResponse.json(
      {
        success: true,
        message: "用户创建成功",
        data: {
          id: user._id,
          phone: user.phone,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json(
      {
        error: "创建用户失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
