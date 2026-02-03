/**
 * 发票报表 API 路由
 * GET /api/reports/invoice
 * 专门用于发票金额统计分析
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Document } from "@/models";
import { requirePermission } from "@/lib/permission";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from "date-fns";

/**
 * GET 发票报表数据
 */
export async function GET(request: NextRequest) {
  // 权限检查
  const permissionResult = await requirePermission(request, "canViewReports");
  if (permissionResult instanceof NextResponse) {
    return permissionResult;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    await connectToDatabase();

    // 构建查询条件
    const matchQuery: any = {
      documentType: "invoice",
      status: "completed",
      "parsedData.invoice.amount": { $exists: true, $ne: null },
    };

    // 添加日期范围
    if (startDate || endDate) {
      matchQuery["parsedData.invoice.invoiceDate"] = {};
      if (startDate) {
        matchQuery["parsedData.invoice.invoiceDate"].$gte = startDate;
      }
      if (endDate) {
        matchQuery["parsedData.invoice.invoiceDate"].$lte = endDate;
      }
    }

    // 获取统计和发票列表
    const [statsResult, invoices] = await Promise.all([
      // 统计数据
      Document.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: "$parsedData.invoice.amount" },
            avgAmount: { $avg: "$parsedData.invoice.amount" },
            minAmount: { $min: "$parsedData.invoice.amount" },
            maxAmount: { $max: "$parsedData.invoice.amount" },
          },
        },
      ]),
      // 发票列表
      Document.find(matchQuery)
        .select("parsedData.invoice")
        .sort({ "parsedData.invoice.invoiceDate": -1 })
        .limit(100)
        .lean(),
    ]);

    const stats = statsResult[0] || {
      count: 0,
      totalAmount: 0,
      avgAmount: 0,
      minAmount: 0,
      maxAmount: 0,
    };

    // 处理发票列表
    const invoiceList = invoices.map((doc) => ({
      invoiceNo: doc.parsedData?.invoice?.invoiceNo,
      invoiceCode: doc.parsedData?.invoice?.invoiceCode,
      invoiceDate: doc.parsedData?.invoice?.invoiceDate,
      amount: doc.parsedData?.invoice?.amount,
      taxAmount: doc.parsedData?.invoice?.taxAmount,
      sellerName: doc.parsedData?.invoice?.sellerName,
      buyerName: doc.parsedData?.invoice?.buyerName,
    }));

    // 获取月度趋势
    const monthlyTrend = await Document.aggregate([
      {
        $match: matchQuery,
      },
      {
        $group: {
          _id: {
            year: { $year: "$uploadDate" },
            month: { $month: "$uploadDate" },
          },
          amount: {
            $sum: "$parsedData.invoice.amount",
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    const formattedTrend = monthlyTrend.map((item: any) => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
      amount: item.amount,
      count: item.count,
    }));

    return NextResponse.json({
      success: true,
      data: {
        count: stats.count,
        totalAmount: stats.totalAmount,
        avgAmount: stats.avgAmount,
        minAmount: stats.minAmount,
        maxAmount: stats.maxAmount,
        monthlyTrend: formattedTrend,
        invoices: invoiceList,
      },
    });
  } catch (error: any) {
    console.error("Invoice reports API error:", error);
    return NextResponse.json(
      {
        error: "获取发票报表失败",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
