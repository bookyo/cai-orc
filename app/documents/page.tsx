/**
 * 文档列表页面
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  Search,
  Filter,
  Trash2,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { formatDateTime, formatCurrency } from "@/lib/utils";

/**
 * 文档类型映射
 */
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  invoice: "发票",
  certificate: "证书",
  resume: "简历",
  handwritten: "手写笔记",
  financial_report: "财务报表",
  other: "其他",
};

/**
 * 状态映射
 */
const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  processing: { label: "处理中", variant: "warning" },
  completed: { label: "已完成", variant: "success" },
  failed: { label: "失败", variant: "destructive" },
};

/**
 * 文档列表页面
 */
export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  /**
   * 获取文档列表
   */
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (search) params.append("search", search);
      if (documentType) params.append("documentType", documentType);
      if (status) params.append("status", status);

      const res = await fetch(`/api/documents?${params.toString()}`);
      const data = await res.json();

      setDocuments(data.data.documents);
      setTotalPages(data.data.pagination.totalPages);
      setTotal(data.data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, documentType, status]);

  // 轮询处理中的文档
  useEffect(() => {
    const hasProcessingDocs = documents.some(doc => doc.status === "processing");
    if (!hasProcessingDocs) return;

    const interval = setInterval(() => {
      fetchDocuments();
    }, 3000); // 每3秒刷新一次

    return () => clearInterval(interval);
  }, [documents]);

  /**
   * 搜索处理
   */
  const handleSearch = () => {
    setPage(1);
    fetchDocuments();
  };

  /**
   * 切换选择状态
   */
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /**
   * 全选/取消全选
   */
  const toggleSelectAll = () => {
    if (selectedIds.length === documents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(documents.map((doc) => doc.id));
    }
  };

  /**
   * 批量导出
   */
  const handleBatchExport = async () => {
    if (selectedIds.length === 0) return;

    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          format: "json",
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `documents-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to export:", error);
    }
  };

  /**
   * 批量删除
   */
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;

    if (!confirm(`确定要删除 ${selectedIds.length} 个文档吗？`)) {
      return;
    }

    try {
      const res = await fetch("/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (res.ok) {
        setSelectedIds([]);
        fetchDocuments();
      }
    } catch (error) {
      console.error("Failed to delete documents:", error);
    }
  };

  /**
   * 渲染文档预览信息
   */
  const renderPreview = (doc: any) => {
    const { preview, documentType } = doc;

    if (documentType === "invoice" && preview.invoice) {
      return (
        <div className="text-sm">
          <div className="font-medium">{preview.invoice.sellerName || "-"}</div>
          <div className="text-muted-foreground">
            {preview.invoice.amount
              ? formatCurrency(preview.invoice.amount)
              : "-"}
          </div>
        </div>
      );
    }

    if (documentType === "resume" && preview.resume) {
      return (
        <div className="text-sm">
          <div className="font-medium">{preview.resume.name || "-"}</div>
          <div className="text-muted-foreground">
            {preview.resume.phone || preview.resume.email || "-"}
          </div>
        </div>
      );
    }

    if (documentType === "certificate" && preview.certificate) {
      return (
        <div className="text-sm">
          <div className="font-medium">{preview.certificate.certName || "-"}</div>
          <div className="text-muted-foreground">
            {preview.certificate.certNo || "-"}
          </div>
        </div>
      );
    }

    return <div className="text-sm text-muted-foreground">等待处理...</div>;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <div className="p-2 bg-primary rounded-lg">
                  <FileText className="h-6 w-6 text-primary-foreground" />
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold">文档列表</h1>
                <p className="text-sm text-muted-foreground">共 {total} 个文档</p>
              </div>
            </div>
            <Link href="/upload">
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                上传文档
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* 筛选栏 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* 搜索框 */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索文件名、发票号、公司名称..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 类型筛选 */}
              <Select
                value={documentType}
                onChange={(e) => {
                  setDocumentType(e.target.value);
                  setPage(1);
                }}
                className="md:w-40"
              >
                <option value="">全部类型</option>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>

              {/* 状态筛选 */}
              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="md:w-40"
              >
                <option value="">全部状态</option>
                {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>

              {/* 搜索按钮 */}
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                搜索
              </Button>
            </div>

            {/* 批量操作 */}
            {selectedIds.length > 0 && (
              <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">
                  已选择 {selectedIds.length} 个文档
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                    取消选择
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBatchExport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    导出
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBatchDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 文档列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无文档</h3>
              <p className="text-muted-foreground mb-4">
                上传您的第一个文档开始使用
              </p>
              <Link href="/upload">
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  上传文档
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* 表头 */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={selectedIds.length === documents.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4"
                />
              </div>
              <div className="col-span-4">文件名</div>
              <div className="col-span-2">类型</div>
              <div className="col-span-2">状态</div>
              <div className="col-span-2">上传时间</div>
              <div className="col-span-1">操作</div>
            </div>

            {/* 文档项 */}
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className={`transition-all hover:shadow-md ${
                  selectedIds.includes(doc.id) ? "ring-2 ring-primary" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* 复选框 */}
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(doc.id)}
                        onChange={() => toggleSelect(doc.id)}
                        className="w-4 h-4"
                      />
                    </div>

                    {/* 文件名 */}
                    <div className="col-span-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-gray-100 rounded">
                          <FileText className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="font-medium hover:text-primary truncate block"
                          >
                            {doc.fileName}
                          </Link>
                          <div className="mt-1 md:hidden">
                            {renderPreview(doc)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 类型 */}
                    <div className="col-span-2">
                      <Badge variant="outline">
                        {DOCUMENT_TYPE_LABELS[doc.documentType] || "其他"}
                      </Badge>
                    </div>

                    {/* 状态 */}
                    <div className="col-span-2">
                      <Badge
                        variant={
                          STATUS_LABELS[doc.status]?.variant as any || "default"
                        }
                      >
                        {STATUS_LABELS[doc.status]?.label || doc.status}
                      </Badge>
                    </div>

                    {/* 上传时间 */}
                    <div className="col-span-2 text-sm text-muted-foreground">
                      {formatDateTime(doc.uploadDate)}
                    </div>

                    {/* 操作 */}
                    <div className="col-span-1">
                      <div className="flex items-center space-x-2">
                        <Link href={`/documents/${doc.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* 移动端预览 */}
                    <div className="col-span-1 md:hidden hidden">
                      {renderPreview(doc)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              第 {page} / {totalPages} 页
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
