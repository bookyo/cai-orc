/**
 * 文件存储服务
 * 处理本地文件存储和管理
 */

import fs from "fs/promises";
import path from "path";
import { env } from "../env";
import { v4 as uuidv4 } from "uuid";

/**
 * 文件信息接口
 */
export interface UploadedFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  path: string;
}

/**
 * 确保上传目录存在
 */
async function ensureUploadDir(): Promise<void> {
  try {
    await fs.access(env.uploadDir);
  } catch {
    await fs.mkdir(env.uploadDir, { recursive: true });
  }
}

/**
 * 生成唯一文件名
 */
function generateFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  const timestamp = Date.now();
  const uuid = uuidv4().slice(0, 8);
  return `${baseName}-${timestamp}-${uuid}${ext}`;
}

/**
 * 保存文件到本地存储
 */
export async function saveFile(
  buffer: Buffer,
  originalName: string,
  mimetype: string
): Promise<UploadedFile> {
  await ensureUploadDir();

  const filename = generateFilename(originalName);
  const filePath = path.join(env.uploadDir, filename);

  // 保存文件
  await fs.writeFile(filePath, buffer);

  // 生成访问 URL
  const url = `${env.baseUrl}/uploads/${filename}`;

  return {
    filename,
    originalName,
    mimetype,
    size: buffer.length,
    url,
    path: filePath,
  };
}

/**
 * 保存 Base64 编码的文件
 */
export async function saveBase64File(
  base64: string,
  originalName: string,
  mimetype: string
): Promise<UploadedFile> {
  // 提取 Base64 数据
  const base64Data = base64.includes("base64,")
    ? base64.split("base64,")[1]
    : base64;

  const buffer = Buffer.from(base64Data, "base64");
  return saveFile(buffer, originalName, mimetype);
}

/**
 * 从 URL 保存文件
 */
export async function saveFileFromUrl(
  url: string,
  originalName?: string
): Promise<UploadedFile> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const filename = originalName || url.split("/").pop() || "downloaded-file";

  return saveFile(buffer, filename, contentType);
}

/**
 * 删除文件
 */
export async function deleteFile(filename: string): Promise<void> {
  const filePath = path.join(env.uploadDir, filename);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to delete file ${filename}:`, error);
    throw error;
  }
}

/**
 * 获取文件信息
 */
export async function getFileInfo(filename: string): Promise<{
  exists: boolean;
  size?: number;
 }> {
  const filePath = path.join(env.uploadDir, filename);
  try {
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      size: stats.size,
    };
  } catch {
    return {
      exists: false,
    };
  }
}

/**
 * 清理过期文件（可选）
 */
export async function cleanupOldFiles(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
  const files = await fs.readdir(env.uploadDir);
  let deletedCount = 0;
  const now = Date.now();

  for (const file of files) {
    if (file === ".gitkeep") continue;

    const filePath = path.join(env.uploadDir, file);
    try {
      const stats = await fs.stat(filePath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    } catch (error) {
      console.error(`Failed to process file ${file}:`, error);
    }
  }

  return deletedCount;
}
