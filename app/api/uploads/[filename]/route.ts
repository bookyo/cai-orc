
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { env } from "@/lib/env";

/**
 * 简单的 MIME 类型映射
 */
const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // 安全检查：防止目录遍历
    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return new NextResponse("Invalid filename", { status: 400 });
    }

    const filePath = path.join(env.uploadDir, filename);

    // 检查文件是否存在
    try {
      await fs.access(filePath);
    } catch {
      return new NextResponse("File not found", { status: 404 });
    }

    // 读取文件
    const fileBuffer = await fs.readFile(filePath);

    // 确定 Content-Type
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    // 返回文件
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
