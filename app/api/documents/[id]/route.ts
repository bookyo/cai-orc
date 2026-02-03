/**
 * 文档详情 API 路由
 * GET /api/documents/[id] - 获取文档详情
 * PUT /api/documents/[id] - 更新文档
 * DELETE /api/documents/[id] - 删除文档
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Document, AuditLog } from "@/models";
import { requirePermission } from "@/lib/permission";

/**
 * 路由参数处理
 */
function getIdFromParams(params: { id: string }): string {
  return params.id;
}

/**
 * GET 获取文档详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 权限检查
  const permissionResult = await requirePermission(request, "canViewDocuments");
  if (permissionResult instanceof NextResponse) {
    return permissionResult;
  }

  try {
    const { id } = await params;

    await connectToDatabase();

    const document = await Document.findById(id);

    if (!document) {
      return NextResponse.json(
        { error: "文档不存在" },
        { status: 404 }
      );
    }

    // 记录查看日志
    await AuditLog.log(id, document.fileName, "view");

    return NextResponse.json({
      success: true,
      data: {
        id: document._id,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileType: document.fileType,
        documentType: document.documentType,
        status: document.status,
        uploadDate: document.uploadDate,
        ocrResult: document.ocrResult,
        parsedData: document.parsedData,
        metadata: document.metadata,
        error: document.error,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Document detail API error:", error);
    return NextResponse.json(
      {
        error: "获取文档详情失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT 更新文档
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 权限检查
  const permissionResult = await requirePermission(request, "canViewDocuments");
  if (permissionResult instanceof NextResponse) {
    return permissionResult;
  }

  try {
    const { id } = await params;
    const body = await request.json();

    await connectToDatabase();

    const document = await Document.findById(id);

    if (!document) {
      return NextResponse.json(
        { error: "文档不存在" },
        { status: 404 }
      );
    }

    // 允许更新的字段
    const allowedUpdates = ["documentType", "parsedData"];
    const updates: any = {};

    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    // 如果更新了解析数据，标记为已完成
    if (updates.parsedData) {
      updates.status = "completed";
      updates.metadata = {
        ...document.metadata,
        aiParsedAt: new Date(),
      };
    }

    const updatedDocument = await Document.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    // 记录更新日志
    await AuditLog.log(
      id,
      document.fileName,
      "update",
      { updates }
    );

    return NextResponse.json({
      success: true,
      data: {
        id: updatedDocument!._id,
        fileName: updatedDocument!.fileName,
        documentType: updatedDocument!.documentType,
        status: updatedDocument!.status,
        parsedData: updatedDocument!.parsedData,
        updatedAt: updatedDocument!.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Document update API error:", error);
    return NextResponse.json(
      {
        error: "更新文档失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE 删除文档
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 权限检查
  const permissionResult = await requirePermission(request, "canDeleteDocuments");
  if (permissionResult instanceof NextResponse) {
    return permissionResult;
  }

  try {
    const { id } = await params;

    await connectToDatabase();

    const document = await Document.findById(id);

    if (!document) {
      return NextResponse.json(
        { error: "文档不存在" },
        { status: 404 }
      );
    }

    // 记录删除前的信息
    const docInfo = {
      fileName: document.fileName,
      documentType: document.documentType,
    };

    // 删除文档
    await Document.findByIdAndDelete(id);

    // TODO: 删除物理文件
    // await deleteFile(document.fileName);

    // 记录删除日志
    await AuditLog.log(id, docInfo.fileName, "delete", docInfo);

    return NextResponse.json({
      success: true,
      message: "文档已删除",
    });
  } catch (error: any) {
    console.error("Document delete API error:", error);
    return NextResponse.json(
      {
        error: "删除文档失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
