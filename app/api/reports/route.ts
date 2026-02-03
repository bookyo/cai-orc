/**
 * 报表统计 API 路由
 * GET /api/reports
 * 提供各种统计数据和聚合分析
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Document } from "@/models";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, subMonths } from "date-fns";
import { requirePermission } from "@/lib/permission";

// 默认空数据
const DEFAULT_DATA = {
  overview: {
    total: 0,
    today: 0,
    week: 0,
    month: 0,
    byStatus: {
      completed: 0,
      processing: 0,
      failed: 0,
    },
  },
  documentStats: [],
  invoiceStats: {
    totalAmount: 0,
    avgAmount: 0,
    count: 0,
    minAmount: 0,
    maxAmount: 0,
  },
  trends: {
    monthly: [],
    daily: [],
  },
};

/**
 * 解析日期范围参数
 */
function parseDateRange(request: NextRequest): { startDate: Date; endDate: Date } {
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get("range") || "month";
  const customStart = searchParams.get("startDate");
  const customEnd = searchParams.get("endDate");

  const now = new Date();
  let startDate: Date;
  let endDate: Date = endOfDay(now);

  switch (range) {
    case "week":
      startDate = startOfDay(subDays(now, 7));
      break;
    case "month":
      startDate = startOfMonth(now);
      break;
    case "quarter":
      startDate = startOfMonth(subMonths(now, 3));
      break;
    case "year":
      startDate = startOfMonth(subMonths(now, 12));
      break;
    case "custom":
      startDate = customStart ? startOfDay(new Date(customStart)) : startOfMonth(now);
      endDate = customEnd ? endOfDay(new Date(customEnd)) : endOfDay(now);
      break;
    default:
      startDate = startOfMonth(now);
  }

  return { startDate, endDate };
}

/**
 * 获取文档统计（按类型）
 */
async function getDocumentStats(startDate: Date, endDate: Date) {
  try {
    return await Document.aggregate([
      {
        $match: {
          uploadDate: { $gte: startDate, $lte: endDate },
          status: "completed",
        },
      },
      {
        $group: {
          _id: "$documentType",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
  } catch {
    return [];
  }
}

/**
 * 获取发票统计数据
 */
async function getInvoiceStats(startDate: Date, endDate: Date) {
  try {
    const result = await Document.aggregate([
      {
        $match: {
          uploadDate: { $gte: startDate, $lte: endDate },
          documentType: "invoice",
          status: "completed",
          "parsedData.invoice.amount": { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: {
            $sum: "$parsedData.invoice.amount",
          },
          avgAmount: {
            $avg: "$parsedData.invoice.amount",
          },
          count: { $sum: 1 },
          minAmount: { $min: "$parsedData.invoice.amount" },
          maxAmount: { $max: "$parsedData.invoice.amount" },
        },
      },
    ]);

    return result[0] || {
      totalAmount: 0,
      avgAmount: 0,
      count: 0,
      minAmount: 0,
      maxAmount: 0,
    };
  } catch {
    return {
      totalAmount: 0,
      avgAmount: 0,
      count: 0,
      minAmount: 0,
      maxAmount: 0,
    };
  }
}

/**
 * 获取月度趋势数据
 */
async function getMonthlyTrend(months: number = 12) {
  try {
    const result = await Document.aggregate([
      {
        $match: {
          status: "completed",
          uploadDate: {
            $gte: startOfMonth(subMonths(new Date(), months - 1)),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$uploadDate" },
            month: { $month: "$uploadDate" },
            documentType: "$documentType",
          },
          count: { $sum: 1 },
          invoiceAmount: {
            $sum: {
              $cond: [
                { $eq: ["$documentType", "invoice"] },
                { $ifNull: ["$parsedData.invoice.amount", 0] },
                0,
              ],
            },
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    return result.map((item: any) => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
      documentType: item._id.documentType,
      count: item.count,
      invoiceAmount: item.invoiceAmount,
    }));
  } catch {
    return [];
  }
}

/**
 * 获取每日上传趋势
 */
async function getDailyTrend(days: number = 30) {
  try {
    const result = await Document.aggregate([
      {
        $match: {
          uploadDate: {
            $gte: startOfDay(subDays(new Date(), days - 1)),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$uploadDate" },
          },
          count: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return result.map((item: any) => ({
      date: item._id,
      count: item.count,
      completed: item.completed,
    }));
  } catch {
    return [];
  }
}

/**
 * 获取整体统计概览
 */
async function getOverviewStats(startDate: Date, endDate: Date) {
  try {
    const [totalCount, todayCount, weekCount, monthCount] = await Promise.all([
      Document.countDocuments({}),
      Document.countDocuments({
        uploadDate: { $gte: startOfDay(new Date()), $lte: endOfDay(new Date()) },
      }),
      Document.countDocuments({
        uploadDate: { $gte: startOfDay(subDays(new Date(), 7)) },
      }),
      Document.countDocuments({
        uploadDate: { $gte: startOfMonth(new Date()) },
      }),
    ]);

    const [completedCount, processingCount, failedCount] = await Promise.all([
      Document.countDocuments({ status: "completed" }),
      Document.countDocuments({ status: "processing" }),
      Document.countDocuments({ status: "failed" }),
    ]);

    return {
      total: totalCount,
      today: todayCount,
      week: weekCount,
      month: monthCount,
      byStatus: {
        completed: completedCount,
        processing: processingCount,
        failed: failedCount,
      },
    };
  } catch {
    return DEFAULT_DATA.overview;
  }
}

/**
 * GET 获取报表统计
 */
export async function GET(request: NextRequest) {
  // 权限检查
  const permissionResult = await requirePermission(request, "canViewReports");
  if (permissionResult instanceof NextResponse) {
    return permissionResult;
  }

  try {
    const { startDate, endDate } = parseDateRange(request);

    // 尝试连接数据库，如果失败则返回默认数据
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return NextResponse.json({
        success: true,
        data: {
          period: {
            start: startDate,
            end: endDate,
            range: request.nextUrl.searchParams.get("range") || "month",
          },
          ...DEFAULT_DATA,
        },
      });
    }

    // 并行获取所有统计数据
    const [
      overview,
      documentStats,
      invoiceStats,
      monthlyTrend,
      dailyTrend,
    ] = await Promise.all([
      getOverviewStats(startDate, endDate),
      getDocumentStats(startDate, endDate),
      getInvoiceStats(startDate, endDate),
      getMonthlyTrend(12),
      getDailyTrend(30),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        period: {
          start: startDate,
          end: endDate,
          range: request.nextUrl.searchParams.get("range") || "month",
        },
        overview,
        documentStats: documentStats.map((item: any) => ({
          type: item._id,
          count: item.count,
        })),
        invoiceStats,
        trends: {
          monthly: monthlyTrend,
          daily: dailyTrend,
        },
      },
    });
  } catch (error: any) {
    console.error("Reports API error:", error);
    return NextResponse.json(
      {
        success: true,
        data: {
          period: {
            start: new Date(),
            end: new Date(),
            range: "month",
          },
          ...DEFAULT_DATA,
        },
      },
      { status: 200 }
    );
  }
}
