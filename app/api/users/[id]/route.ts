/**
 * 用户详情 API 路由
 * GET /api/users/[id] - 获取用户详情
 * PUT /api/users/[id] - 更新用户
 * DELETE /api/users/[id] - 删除用户
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models";
import { requirePermission } from "@/lib/permission";
import { getUserFromRequest } from "@/lib/auth";
import { ROLE_PERMISSIONS, UserRole } from "@/types/user";

/**
 * GET 获取用户详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 权限检查 - 用户可以查看自己的信息，其他需要管理权限
  const { id } = await params;
  const currentUser = await getUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  // 查看别人的信息需要管理权限
  if (id !== currentUser.id) {
    const permissionResult = await requirePermission(request, "canManageUsers");
    if (permissionResult instanceof NextResponse) {
      return permissionResult;
    }
  }

  try {
    await connectToDatabase();

    const user = await User.findById(id).select("-password");

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error("Get user error:", error);
    return NextResponse.json(
      {
        error: "获取用户失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT 更新用户
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 权限检查
  const permissionResult = await requirePermission(request, "canManageUsers");
  if (permissionResult instanceof NextResponse) {
    return permissionResult;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, role, isActive } = body;

    await connectToDatabase();

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    // 不能修改 admin 的角色和状态
    if (user.role === "admin") {
      return NextResponse.json(
        { error: "不能修改管理员账号" },
        { status: 400 }
      );
    }

    // 更新字段
    if (name) user.name = name;
    if (role && role !== user.role) {
      user.role = role as UserRole;
      user.permissions = ROLE_PERMISSIONS[role as UserRole];
    }
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    return NextResponse.json({
      success: true,
      message: "用户更新成功",
      data: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json(
      {
        error: "更新用户失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE 删除用户
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 权限检查
  const permissionResult = await requirePermission(request, "canManageUsers");
  if (permissionResult instanceof NextResponse) {
    return permissionResult;
  }

  try {
    const { id } = await params;
    const currentUser = await getUserFromRequest(request);

    await connectToDatabase();

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    // 不能删除 admin
    if (user.role === "admin") {
      return NextResponse.json(
        { error: "不能删除管理员账号" },
        { status: 400 }
      );
    }

    // 不能删除自己
    if (currentUser && user._id.toString() === currentUser.id) {
      return NextResponse.json(
        { error: "不能删除自己的账号" },
        { status: 400 }
      );
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "用户删除成功",
    });
  } catch (error: any) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      {
        error: "删除用户失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
