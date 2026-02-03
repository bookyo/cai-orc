/**
 * 发票金额报表分析页面
 * 专注于发票金额统计：本月、上月、半年、自定义时间范围
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Loader2,
  ArrowLeft,
  DollarSign,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { startOfMonth, endOfMonth, subMonths, subDays, format } from "date-fns";

/**
 * 时间范围选项
 */
const TIME_RANGE_OPTIONS = [
  { value: "this_month", label: "本月" },
  { value: "last_month", label: "上月" },
  { value: "half_year", label: "近半年" },
  { value: "custom", label: "自定义" },
];

/**
 * 获取日期范围
 */
function getDateRange(range: string): { startDate: string; endDate: string } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date();

  switch (range) {
    case "this_month":
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    case "last_month":
      const lastMonth = subMonths(now, 1);
      startDate = startOfMonth(lastMonth);
      endDate = endOfMonth(lastMonth);
      break;
    case "half_year":
      startDate = startOfMonth(subMonths(now, 6));
      endDate = endOfMonth(now);
      break;
    default:
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
  }

  return {
    startDate: format(startDate, "yyyy-MM-dd"),
    endDate: format(endDate, "yyyy-MM-dd"),
  };
}

/**
 * 发票金额报表页面
 */
export default function InvoiceReportsPage() {
  const { user } = useAuth();
  const [range, setRange] = useState("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  // 权限检查
  useEffect(() => {
    if (!user) return;
    if (!user.permissions.canViewReports) {
      window.location.href = "/";
    }
  }, [user]);

  /**
   * 获取报表数据
   */
  const fetchReports = async () => {
    setLoading(true);
    try {
      const dateRange = range === "custom"
        ? { startDate: customStart, endDate: customEnd }
        : getDateRange(range);

      const params = new URLSearchParams({
        range: "custom",
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const res = await fetch(`/api/reports/invoice?${params.toString()}`);
      const result = await res.json();

      if (result.success) {
        setInvoiceData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.permissions.canViewReports) {
      fetchReports();
    }
  }, [range, customStart, customEnd, user]);

  if (!user || !user.permissions.canViewReports) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="p-2 bg-primary rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">发票金额分析</h1>
                <p className="text-sm text-muted-foreground">
                  查看发票金额统计和趋势
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* 时间筛选 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">时间范围</label>
                <Select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="w-full md:w-40"
                >
                  {TIME_RANGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              {range === "custom" && (
                <>
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">开始日期</label>
                    <Input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">结束日期</label>
                    <Input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                    />
                  </div>
                </>
              )}

              <Button onClick={fetchReports} disabled={loading}>
                <Calendar className="h-4 w-4 mr-2" />
                查询
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    发票数量
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {invoiceData?.count || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">张</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    总金额
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(invoiceData?.totalAmount || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    平均金额
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(invoiceData?.avgAmount || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    最高金额
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(invoiceData?.maxAmount || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    最低金额
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(invoiceData?.minAmount || 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 金额趋势图 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  金额趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoiceData?.monthlyTrend && invoiceData.monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={invoiceData.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `¥${value}`} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar dataKey="amount" name="金额" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    暂无数据
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 明细列表 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  发票明细
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoiceData?.invoices && invoiceData.invoices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">发票号码</th>
                          <th className="text-left py-2">开票日期</th>
                          <th className="text-left py-2">销售方</th>
                          <th className="text-left py-2">购买方</th>
                          <th className="text-right py-2">金额</th>
                          <th className="text-right py-2">税额</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceData.invoices.map((invoice: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{invoice.invoiceNo || "-"}</td>
                            <td className="py-2">{invoice.invoiceDate || "-"}</td>
                            <td className="py-2">{invoice.sellerName || "-"}</td>
                            <td className="py-2">{invoice.buyerName || "-"}</td>
                            <td className="text-right py-2">
                              {invoice.amount ? formatCurrency(invoice.amount) : "-"}
                            </td>
                            <td className="text-right py-2">
                              {invoice.taxAmount ? formatCurrency(invoice.taxAmount) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    暂无发票数据
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
