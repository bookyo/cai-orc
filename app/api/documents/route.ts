/**
 * 文档列表 API 路由
 * GET /api/documents
 * 支持分页、筛选、搜索
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Document, DocumentType, DocumentStatus, AuditLog } from "@/models";
import { DocumentQuery } from "@/types/document";
import { requirePermission } from "@/lib/permission";

/**
 * 解析查询参数
 */
function parseQueryParams(request: NextRequest): DocumentQuery & { page: number; limit: number } {
  const searchParams = request.nextUrl.searchParams;

  return {
    documentType: searchParams.get("documentType") as DocumentType | undefined,
    status: searchParams.get("status") as DocumentStatus | undefined,
    startDate: searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined,
    endDate: searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined,
    search: searchParams.get("search") || undefined,
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "20", 10),
    sortBy: (searchParams.get("sortBy") as "uploadDate" | "fileName" | "documentType" | "status") || "uploadDate",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
  };
}

/**
 * 构建查询条件
 */
function buildQuery(params: DocumentQuery): any {
  const query: any = {};

  // 文档类型筛选
  if (params.documentType) {
    const types = Array.isArray(params.documentType)
      ? params.documentType
      : [params.documentType];
    query.documentType = { $in: types };
  }

  // 状态筛选
  if (params.status) {
    query.status = params.status;
  }

  // 日期范围筛选
  if (params.startDate || params.endDate) {
    query.uploadDate = {};
    if (params.startDate) {
      query.uploadDate.$gte = params.startDate;
    }
    if (params.endDate) {
      query.uploadDate.$lte = params.endDate;
    }
  }

  // 搜索关键词
  if (params.search) {
    query.$or = [
      { fileName: { $regex: params.search, $options: "i" } },
      { "ocrResult.mdResults": { $regex: params.search, $options: "i" } },
      { "parsedData.invoice.invoiceNo": { $regex: params.search, $options: "i" } },
      { "parsedData.invoice.sellerName": { $regex: params.search, $options: "i" } },
      { "parsedData.invoice.buyerName": { $regex: params.search, $options: "i" } },
      { "parsedData.resume.name": { $regex: params.search, $options: "i" } },
    ];
  }

  return query;
}

/**
 * GET 获取文档列表
 */
export async function GET(request: NextRequest) {
  // 权限检查
  const permissionResult = await requirePermission(request, "canViewDocuments");
  if (permissionResult instanceof NextResponse) {
    return permissionResult;
  }

  try {
    const params = parseQueryParams(request);

    // 连接数据库
    await connectToDatabase();

    // 构建查询
    const query = buildQuery(params);

    // 构建排序
    const sort: any = {};
    if (params.sortBy) {
      sort[params.sortBy] = params.sortOrder === "asc" ? 1 : -1;
    }

    // 执行查询
    const [documents, total] = await Promise.all([
      Document.find(query)
        .sort(sort)
        .skip((params.page - 1) * params.limit)
        .limit(params.limit)
        .lean(),
      Document.countDocuments(query),
    ]);

    // 获取统计信息
    const stats = await Document.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byType: {
            $push: {
              k: "$documentType",
              v: 1,
            },
          },
          byStatus: {
            $push: {
              k: "$status",
              v: 1,
            },
          },
        },
      },
      {
        $project: {
          total: 1,
          byType: { $arrayToObject: "$byType" },
          byStatus: { $arrayToObject: "$byStatus" },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        documents: documents.map((doc) => ({
          id: doc._id,
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          fileType: doc.fileType,
          documentType: doc.documentType,
          status: doc.status,
          uploadDate: doc.uploadDate,
          metadata: doc.metadata,
          // 包含部分解析数据用于预览
          preview: {
            invoice: doc.parsedData?.invoice
              ? {
                  invoiceNo: doc.parsedData.invoice.invoiceNo,
                  amount: doc.parsedData.invoice.amount,
                  sellerName: doc.parsedData.invoice.sellerName,
                }
              : null,
            resume: doc.parsedData?.resume
              ? {
                  name: doc.parsedData.resume.name,
                  phone: doc.parsedData.resume.phone,
                  email: doc.parsedData.resume.email,
                }
              : null,
            certificate: doc.parsedData?.certificate
              ? {
                  certName: doc.parsedData.certificate.certName,
                  certNo: doc.parsedData.certificate.certNo,
                }
              : null,
          },
        })),
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages: Math.ceil(total / params.limit),
        },
        stats: stats[0] || {
          total: 0,
          byType: {},
          byStatus: {},
        },
      },
    });
  } catch (error: any) {
    console.error("Documents API error:", error);
    return NextResponse.json(
      {
        error: "获取文档列表失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE 批量删除文档
 */
export async function DELETE(request: NextRequest) {
  // 权限检查
  const permissionResult = await requirePermission(request, "canDeleteDocuments");
  if (permissionResult instanceof NextResponse) {
    return permissionResult;
  }

  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "缺少要删除的文档 ID 列表" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 获取要删除的文档信息
    const documents = await Document.find({ _id: { $in: ids } });

    // 删除文档
    const result = await Document.deleteMany({ _id: { $in: ids } });

    // 记录审计日志
    for (const doc of documents) {
      await AuditLog.log(
        doc._id.toString(),
        doc.fileName,
        "delete",
        { batch: true }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `已删除 ${result.deletedCount} 个文档`,
    });
  } catch (error: any) {
    console.error("Batch delete API error:", error);
    return NextResponse.json(
      {
        error: "批量删除失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
