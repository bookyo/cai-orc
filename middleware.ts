/**
 * Next.js Middleware
 * 用于保护需要认证的路由
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 不需要认证的路由
 */
const publicRoutes = ["/login", "/api/auth/login", "/api/init", "/api/auth/me"];

/**
 * 检查是否是公开路由
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname.startsWith(route));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开路由直接放行
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 检查是否有认证 token
  const token = request.cookies.get("auth_token");

  if (!token) {
    // 未登录，重定向到登录页
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
