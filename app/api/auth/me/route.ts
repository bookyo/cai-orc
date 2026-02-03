/**
 * 获取当前用户信息 API 路由
 * GET /api/auth/me
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

/**
 * GET 获取当前登录用户信息
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      {
        error: "未登录",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user,
  });
}
