/**
 * 文档上传 API 路由
 * POST /api/documents/upload
 * 需要权限: canUpload
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Document, AuditLog } from "@/models";
import { env } from "@/lib/env";
import { saveFile } from "@/lib/storage/fileStorage";
import { requirePermission } from "@/lib/permission";
import { ocrFromUrl } from "@/lib/services/glmOcr";
import { parseByType, detectDocumentType } from "@/lib/services/glmParser";

/**
 * 验证文件类型
 */
function validateFileType(mimeType: string): boolean {
  return env.allowedFileTypes.includes(mimeType);
}

/**
 * 验证文件大小
 */
function validateFileSize(size: number): boolean {
  return size <= env.maxFileSize;
}

/**
 * 异步处理文档
 */
async function processDocumentAsync(documentId: string) {
  try {
    const document = await Document.findById(documentId);
    if (!document) return;

    // 步骤 1: OCR 识别
    let ocrResult;
    try {
      // 直接使用 fileUrl 进行 OCR
      ocrResult = await ocrFromUrl(document.fileUrl);
      await document.updateOcrResult({
        mdResults: ocrResult.mdResults,
        layoutDetails: ocrResult.layoutDetails,
        numPages: ocrResult.numPages,
      });
    } catch (error: any) {
      await document.updateStatus("failed", {
        message: error.message,
        stage: "ocr",
      });
      await AuditLog.log(
        documentId,
        document.fileName,
        "reparse",
        { stage: "ocr_failed", error: error.message }
      );
      return;
    }

    // 步骤 2: AI 解析
    try {
      console.log("OCR Result:", ocrResult);
      const detectedType = document.documentType === "other"
        ? (await detectDocumentType(ocrResult.mdResults)).type
        : document.documentType;

      const result = await parseByType(ocrResult.mdResults, detectedType);
      const parsedData = { [detectedType]: result };

      await document.updateParsedData(parsedData, detectedType);
    } catch (error: any) {
      await document.updateStatus("failed", {
        message: error.message,
        stage: "ai_parse",
      });
      await AuditLog.log(
        documentId,
        document.fileName,
        "reparse",
        { stage: "ai_parse_failed", error: error.message }
      );
      return;
    }
  } catch (error: any) {
    console.error("Document processing error:", error);
  }
}

/**
 * POST 处理文件上传
 */
export async function POST(request: NextRequest) {
  // 权限检查
  const permissionResult = await requirePermission(request, "canUpload");
  if (permissionResult instanceof NextResponse) {
    return permissionResult;
  }

  try {
    // 连接数据库
    await connectToDatabase();

    // 解析表单数据
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;

    // 验证文件
    if (!file) {
      return NextResponse.json(
        { error: "未选择文件" },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!validateFileType(file.type)) {
      return NextResponse.json(
        {
          error: "不支持的文件类型",
          allowedTypes: env.allowedFileTypes,
        },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (!validateFileSize(file.size)) {
      return NextResponse.json(
        {
          error: "文件大小超出限制",
          maxSize: env.maxFileSize,
          maxSizeMB: (env.maxFileSize / 1024 / 1024).toFixed(2),
        },
        { status: 400 }
      );
    }

    // 读取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 保存文件
    const uploadedFile = await saveFile(buffer, file.name, file.type);

    // 创建文档记录
    const document = await Document.create({
      fileName: file.name,
      fileUrl: uploadedFile.url,
      fileType: file.type,
      documentType: documentType || "other",
      uploadDate: new Date(),
      status: "processing",
      filePath: uploadedFile.path, // 直接存储文件路径
      metadata: {
        fileSize: file.size,
      },
    });

    // 记录审计日志
    await AuditLog.log(
      document._id.toString(),
      file.name,
      "upload",
      { fileSize: file.size, fileType: file.type }
    );

    // 自动触发处理（异步，不阻塞响应）
    processDocumentAsync(document._id.toString()).catch((error) => {
      console.error("Background processing error:", error);
    });

    return NextResponse.json(
      {
        success: true,
        document: {
          id: document._id,
          fileName: document.fileName,
          fileUrl: document.fileUrl,
          fileType: document.fileType,
          documentType: document.documentType,
          status: document.status,
          uploadDate: document.uploadDate,
        },
        message: "文件上传成功，正在处理...",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json(
      {
        error: "文件上传失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET 获取上传配置信息
 */
export async function GET() {
  return NextResponse.json({
    maxSize: env.maxFileSize,
    maxSizeMB: (env.maxFileSize / 1024 / 1024).toFixed(2),
    allowedTypes: env.allowedFileTypes,
  });
}
