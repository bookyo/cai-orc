/**
 * 登录 API 路由
 * POST /api/auth/login
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models";
import { generateToken, setAuthCookie } from "@/lib/auth";

/**
 * POST 登录
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    // 验证参数
    if (!phone || !password) {
      return NextResponse.json(
        { error: "请输入手机号和密码" },
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

    await connectToDatabase();

    // 查找用户
    const user = await User.findByPhone(phone);

    if (!user) {
      return NextResponse.json(
        { error: "手机号或密码错误" },
        { status: 401 }
      );
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "手机号或密码错误" },
        { status: 401 }
      );
    }

    // 检查用户是否激活
    if (!user.isActive) {
      return NextResponse.json(
        { error: "账号已被禁用，请联系管理员" },
        { status: 403 }
      );
    }

    // 更新最后登录时间
    await user.updateLastLogin();

    // 生成 token
    const token = await generateToken({
      id: user._id.toString(),
      phone: user.phone,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
    });

    // 设置 cookie
    const cookieHeader = setAuthCookie(token);

    // 返回用户信息
    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user._id.toString(),
          phone: user.phone,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
        },
      },
      {
        headers: {
          "Set-Cookie": cookieHeader,
        },
      }
    );
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        error: "登录失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
