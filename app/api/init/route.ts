/**
 * 系统初始化 API 路由
 * POST /api/init
 * 创建默认管理员用户
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models";
import { env } from "@/lib/env";

/**
 * POST 初始化系统（创建默认管理员）
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // 检查是否已有用户
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      return NextResponse.json(
        {
          error: "系统已初始化",
          message: "系统中已有用户，无需重复初始化",
        },
        { status: 400 }
      );
    }

    // 创建默认管理员
    const admin = await User.createAdmin(
      env.adminPhone,
      env.adminPassword,
      env.adminName
    );

    return NextResponse.json({
      success: true,
      message: "系统初始化成功",
      data: {
        admin: {
          id: admin._id,
          phone: admin.phone,
          name: admin.name,
          role: admin.role,
        },
      },
    });
  } catch (error: any) {
    console.error("Init error:", error);
    return NextResponse.json(
      {
        error: "系统初始化失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET 检查系统是否已初始化
 */
export async function GET() {
  try {
    await connectToDatabase();

    const userCount = await User.countDocuments();

    return NextResponse.json({
      success: true,
      data: {
        initialized: userCount > 0,
        userCount,
      },
    });
  } catch (error: any) {
    console.error("Check init error:", error);
    return NextResponse.json(
      {
        error: "检查系统状态失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
