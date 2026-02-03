/**
 * 数据导出 API 路由
 * POST /api/export
 * 导出文档数据为 JSON 或 Excel 格式
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Document } from "@/models";
import { requirePermission } from "@/lib/permission";
export const dynamic = "force-dynamic";

/**
 * 导出为 JSON
 */
function exportAsJson(documents: any[]) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      total: documents.length,
      documents: documents.map((doc) => ({
        id: doc._id,
        fileName: doc.fileName,
        fileType: doc.fileType,
        documentType: doc.documentType,
        status: doc.status,
        uploadDate: doc.uploadDate,
        parsedData: doc.parsedData,
        ocrResult: doc.ocrResult?.mdResults,
      })),
    },
    null,
    2
  );
}

/**
 * 导出为 CSV（简化版）
 */
function exportAsCsv(documents: any[]) {
  const headers = [
    "ID",
    "文件名",
    "文档类型",
    "状态",
    "上传日期",
    "发票号码",
    "发票金额",
    "销售方",
    "购买方",
  ];

  const rows = documents.map((doc) => {
    const invoice = doc.parsedData?.invoice || {};
    return [
      doc._id,
      doc.fileName,
      doc.documentType,
      doc.status,
      doc.uploadDate,
      invoice.invoiceNo || "",
      invoice.amount || "",
      invoice.sellerName || "",
      invoice.buyerName || "",
    ].map((v) => `"${v || ""}"`).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * POST 导出数据
 */
export async function POST(request: NextRequest) {
  // 权限检查
  const permissionResult = await requirePermission(request, "canExportDocuments");
  if (permissionResult instanceof NextResponse) {
    return permissionResult;
  }

  try {
    const body = await request.json();
    const { format = "json", ids, documentType, startDate, endDate } = body;

    await connectToDatabase();

    // 构建查询条件
    const query: any = {};

    if (ids && Array.isArray(ids) && ids.length > 0) {
      query._id = { $in: ids };
    }

    if (documentType) {
      query.documentType = documentType;
    }

    if (startDate || endDate) {
      query.uploadDate = {};
      if (startDate) query.uploadDate.$gte = new Date(startDate);
      if (endDate) query.uploadDate.$lte = new Date(endDate);
    }

    // 查询文档
    const documents = await Document.find(query).sort({ uploadDate: -1 }).lean();

    if (documents.length === 0) {
      return NextResponse.json(
        { error: "没有可导出的数据" },
        { status: 400 }
      );
    }

    // 根据格式导出
    let content: string;
    let contentType: string;
    let filename: string;

    if (format === "csv") {
      content = exportAsCsv(documents);
      contentType = "text/csv; charset=utf-8";
      filename = `documents-export-${Date.now()}.csv`;
    } else {
      content = exportAsJson(documents);
      contentType = "application/json";
      filename = `documents-export-${Date.now()}.json`;
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Export API error:", error);
    return NextResponse.json(
      {
        error: "导出失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
