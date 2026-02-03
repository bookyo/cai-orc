/**
 * 文档处理 API 路由
 * POST /api/documents/process
 * 执行完整的 OCR + AI 解析流程
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Document, AuditLog } from "@/models";
import { ocrFromUrl } from "@/lib/services/glmOcr";
import { smartParse, parseByType, detectDocumentType } from "@/lib/services/glmParser";
import { DocumentType } from "@/types/document";
import { requirePermission } from "@/lib/permission";

/**
 * 处理单个文档
 */
async function processDocument(
  documentId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // 连接数据库
    await connectToDatabase();

    // 获取文档
    const document = await Document.findById(documentId);
    if (!document) {
      return { success: false, error: "文档不存在" };
    }

    // 记录开始处理
    await AuditLog.log(
      documentId,
      document.fileName,
      "reparse",
      { stage: "started" }
    );

    // 步骤 1: OCR 识别
    let ocrResult;
    try {
      ocrResult = await ocrFromUrl(document.fileUrl);
      await document.updateOcrResult({
        mdResults: ocrResult.mdResults,
        layoutDetails: ocrResult.layoutDetails,
        numPages: ocrResult.numPages,
      });
      await AuditLog.log(
        documentId,
        document.fileName,
        "reparse",
        { stage: "ocr_completed", numPages: ocrResult.numPages }
      );
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
      return { success: false, error: `OCR 失败: ${error.message}` };
    }

    // 步骤 2: AI 解析
    let parsedData;
    let detectedType: DocumentType = document.documentType;

    try {
      // 如果未指定类型或为 "other"，先自动识别
      if (document.documentType === "other") {
        const detection = await detectDocumentType(ocrResult.mdResults);
        detectedType = detection.type;
      }

      // 根据类型解析
      const result = await parseByType(ocrResult.mdResults, detectedType);
      parsedData = { [detectedType]: result };

      await document.updateParsedData(parsedData, detectedType);
      await AuditLog.log(
        documentId,
        document.fileName,
        "reparse",
        { stage: "ai_parse_completed", documentType: detectedType }
      );
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
      return { success: false, error: `AI 解析失败: ${error.message}` };
    }

    return {
      success: true,
      message: `处理成功，识别为: ${detectedType}`,
    };
  } catch (error: any) {
    console.error("Document processing error:", error);
    return {
      success: false,
      error: error.message || "处理失败",
    };
  }
}

/**
 * POST 处理文档
 */
export async function POST(request: NextRequest) {
  // 权限检查
  const permissionResult = await requirePermission(request, "canReprocessDocuments");
  if (permissionResult instanceof NextResponse) {
    return permissionResult;
  }

  try {
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: "缺少文档 ID" },
        { status: 400 }
      );
    }

    // 异步处理文档
    processDocument(documentId).catch((error) => {
      console.error("Background processing error:", error);
    });

    return NextResponse.json({
      success: true,
      message: "文档处理已开始",
      documentId,
    });
  } catch (error: any) {
    console.error("Process API error:", error);
    return NextResponse.json(
      {
        error: "处理失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET 获取处理状态
 */
export async function GET(request: NextRequest) {
  // 权限检查
  const permissionResult = await requirePermission(request, "canViewDocuments");
  if (permissionResult instanceof NextResponse) {
    return permissionResult;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json(
        { error: "缺少文档 ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const document = await Document.findById(documentId);

    if (!document) {
      return NextResponse.json(
        { error: "文档不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: document._id,
      fileName: document.fileName,
      status: document.status,
      documentType: document.documentType,
      uploadDate: document.uploadDate,
      ocrProcessedAt: document.metadata.ocrProcessedAt,
      aiParsedAt: document.metadata.aiParsedAt,
      error: document.error,
    });
  } catch (error: any) {
    console.error("Get status API error:", error);
    return NextResponse.json(
      {
        error: "获取状态失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
