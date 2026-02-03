/**
 * 认证工具库
 * JWT token 生成和验证
 */

import { SignJWT, jwtVerify } from "jose";
import { SessionUser } from "@/types/user";
import { env } from "./env";

/**
 * JWT 密钥
 */
const JWT_SECRET = new TextEncoder().encode(
  env.jwtSecret || "your-secret-key-change-in-production"
);

/**
 * Token 过期时间（默认 7 天）
 */
const TOKEN_EXPIRY = "7d";

/**
 * 生成 JWT Token
 */
export async function generateToken(user: SessionUser): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    permissions: user.permissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  return token;
}

/**
 * 验证 JWT Token
 */
export async function verifyToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * 从请求中获取用户
 */
export async function getUserFromRequest(
  request: Request
): Promise<SessionUser | null> {
  try {
    // 从 Cookie 获取 token
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      return null;
    }

    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const token = cookies["auth_token"];
    if (!token) {
      return null;
    }

    return await verifyToken(token);
  } catch (error) {
    console.error("Get user from request failed:", error);
    return null;
  }
}

/**
 * 设置 Cookie
 */
export function setAuthCookie(token: string): string {
  return `auth_token=${token}; Path=/; HttpOnly; SameSite=lax; Max-Age=${7 * 24 * 60 * 60}`;
}

/**
 * 清除 Cookie
 */
export function clearAuthCookie(): string {
  return "auth_token=; Path=/; HttpOnly; SameSite=lax; Max-Age=0";
}
