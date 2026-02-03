/**
 * 登出 API 路由
 * POST /api/auth/logout
 */

import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

/**
 * POST 登出
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: true,
      message: "登出成功",
    },
    {
      headers: {
        "Set-Cookie": clearAuthCookie(),
      },
    }
  );
}
