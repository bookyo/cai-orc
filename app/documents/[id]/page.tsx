/**
 * 文档详情页面
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Download,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  Check,
  Calendar,
  DollarSign,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatCurrency } from "@/lib/utils";

/**
 * 发票详情组件
 */
function InvoiceDetail({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DetailItem
          label="发票号码"
          value={data.invoiceNo}
          icon={FileText}
        />
        <DetailItem
          label="发票代码"
          value={data.invoiceCode}
        />
        <DetailItem
          label="开票日期"
          value={data.invoiceDate}
          icon={Calendar}
        />
        <DetailItem
          label="价税合计"
          value={data.amount ? formatCurrency(data.amount) : "-"}
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Building2 className="h-4 w-4 mr-2" />
              销售方
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">名称：</span>
              {data.sellerName || "-"}
            </div>
            <div>
              <span className="text-muted-foreground">税号：</span>
              {data.sellerTaxId || "-"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Building2 className="h-4 w-4 mr-2" />
              购买方
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">名称：</span>
              {data.buyerName || "-"}
            </div>
            <div>
              <span className="text-muted-foreground">税号：</span>
              {data.buyerTaxId || "-"}
            </div>
          </CardContent>
        </Card>
      </div>

      {data.items && data.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">明细项</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">货物/服务名称</th>
                    <th className="text-right py-2">数量</th>
                    <th className="text-right py-2">单价</th>
                    <th className="text-right py-2">金额</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{item.name || "-"}</td>
                      <td className="text-right py-2">{item.quantity || "-"}</td>
                      <td className="text-right py-2">
                        {item.unitPrice ? formatCurrency(item.unitPrice) : "-"}
                      </td>
                      <td className="text-right py-2">
                        {item.amount ? formatCurrency(item.amount) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * 简历详情组件
 */
function ResumeDetail({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem label="姓名" value={data.name} icon={User} />
            <DetailItem label="性别" value={data.gender} />
            <DetailItem label="电话" value={data.phone} icon={Phone} />
            <DetailItem label="邮箱" value={data.email} icon={Mail} />
            <DetailItem label="出生日期" value={data.birthDate} icon={Calendar} />
            <DetailItem
              label="地址"
              value={data.address}
              icon={MapPin}
              className="md:col-span-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* 教育经历 */}
      {data.education && data.education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">教育经历</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.education.map((edu: any, index: number) => (
                <div key={index} className="border-l-2 border-primary pl-4">
                  <div className="font-medium">{edu.school || "-"}</div>
                  <div className="text-sm text-muted-foreground">
                    {edu.major} · {edu.degree}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {edu.startDate} ~ {edu.endDate}
                    {edu.gpa && ` · GPA: ${edu.gpa}`}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 工作经历 */}
      {data.experience && data.experience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">工作经历</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.experience.map((exp: any, index: number) => (
                <div key={index} className="border-l-2 border-blue-500 pl-4">
                  <div className="font-medium">{exp.company || "-"}</div>
                  <div className="text-sm text-muted-foreground">{exp.position || "-"}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {exp.startDate} ~ {exp.endDate}
                  </div>
                  {exp.description && (
                    <div className="text-sm mt-2 text-gray-600">
                      {exp.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 技能标签 */}
      {data.skills && data.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">技能</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * 证书详情组件
 */
function CertificateDetail({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <DetailItem label="证书名称" value={data.certName} />
      <DetailItem label="证书编号" value={data.certNo} />
      <DetailItem label="证书类型" value={data.certType} />
      <DetailItem label="颁发机构" value={data.issuer} />
      <DetailItem label="颁发日期" value={data.issueDate} icon={Calendar} />
      <DetailItem label="有效期至" value={data.expiryDate} icon={Calendar} />
      <DetailItem label="持有人" value={data.holderName} icon={User} />
      <DetailItem label="身份证号" value={data.idNumber} />
    </div>
  );
}

/**
 * 详情项组件
 */
function DetailItem({
  label,
  value,
  icon: Icon,
  className = "",
}: {
  label: string;
  value?: string | null;
  icon?: any;
  className?: string;
}) {
  if (!value) return null;

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      <span className="text-muted-foreground">{label}：</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

/**
 * 文档详情页面
 */
export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);

  /**
   * 获取文档详情
   */
  const fetchDocument = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${params.id}`);
      if (!res.ok) {
        throw new Error("Document not found");
      }
      const data = await res.json();
      setDocument(data.data);
    } catch (error) {
      console.error("Failed to fetch document:", error);
      router.push("/documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchDocument();
    }
  }, [params.id]);

  /**
   * 重新处理文档
   */
  const handleReprocess = async () => {
    setReprocessing(true);
    try {
      const res = await fetch("/api/documents/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: params.id }),
      });

      if (res.ok) {
        // 等待一段时间后刷新
        setTimeout(() => {
          fetchDocument();
          setReprocessing(false);
        }, 5000);
      }
    } catch (error) {
      console.error("Failed to reprocess:", error);
      setReprocessing(false);
    }
  };

  /**
   * 删除文档
   */
  const handleDelete = async () => {
    if (!confirm("确定要删除这个文档吗？")) return;

    try {
      const res = await fetch(`/api/documents/${params.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/documents");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">文档不存在</p>
          <Link href="/documents">
            <Button className="mt-4">返回列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  const parsedData = document.parsedData?.[document.documentType];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/documents">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary rounded-lg">
                  <FileText className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{document.fileName}</h1>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(document.uploadDate)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleReprocess}
                disabled={reprocessing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${reprocessing ? "animate-spin" : ""}`} />
                重新识别
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* 状态卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">状态</p>
                  <p className="text-lg font-semibold mt-1">
                    {document.status === "completed" ? "已完成" :
                     document.status === "processing" ? "处理中" : "失败"}
                  </p>
                </div>
                {document.status === "completed" ? (
                  <Check className="h-8 w-8 text-green-500" />
                ) : document.status === "processing" ? (
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">文件类型</p>
                <p className="text-lg font-semibold mt-1">
                  {document.fileType}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">文件大小</p>
                <p className="text-lg font-semibold mt-1">
                  {(document.metadata.fileSize / 1024).toFixed(1)} KB
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">识别类型</p>
                <p className="text-lg font-semibold mt-1">
                  {
                    ({
                      invoice: "发票",
                      certificate: "证书",
                      resume: "简历",
                      handwritten: "手写笔记",
                      financial_report: "财务报表",
                      other: "其他",
                    } as Record<string, string>)[document.documentType]
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 结构化数据 */}
        {parsedData ? (
          <Card>
            <CardHeader>
              <CardTitle>识别结果</CardTitle>
            </CardHeader>
            <CardContent>
              {document.documentType === "invoice" && <InvoiceDetail data={parsedData} />}
              {document.documentType === "resume" && <ResumeDetail data={parsedData} />}
              {document.documentType === "certificate" && <CertificateDetail data={parsedData} />}
              {document.documentType === "handwritten" && (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{parsedData.content}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              {document.status === "processing" ? (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">正在处理中，请稍候...</p>
                </>
              ) : (
                <>
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">暂无识别结果</p>
                  <Button onClick={handleReprocess}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    重新识别
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* 原始 OCR 结果（可展开） */}
        {document.ocrResult && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">原始 OCR 结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">
                  {document.ocrResult.mdResults}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
