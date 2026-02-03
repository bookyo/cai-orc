/**
 * 文档上传页面
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  X,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { formatFileSize } from "@/lib/utils";

/**
 * 文档类型选项
 */
const DOCUMENT_TYPES = [
  { value: "other", label: "自动识别" },
  { value: "invoice", label: "发票" },
  { value: "certificate", label: "证书" },
  { value: "resume", label: "简历" },
  { value: "handwritten", label: "手写笔记" },
  { value: "financial_report", label: "财务报表" },
];

/**
 * 上传状态
 */
type UploadStatus = "idle" | "uploading" | "success" | "error";

/**
 * 上传页面组件
 */
export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState("other");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ id: string; name: string }>>([]);

  /**
   * 处理文件拖放
   */
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter((file) => {
      const isValidType = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "application/pdf",
      ].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== acceptedFiles.length) {
      setErrorMessage("部分文件被过滤（不支持类型或超过10MB）");
    } else {
      setErrorMessage("");
    }

    setFiles((prev) => [...prev, ...validFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  /**
   * 移除文件
   */
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * 上传文件
   */
  const handleUpload = async () => {
    if (files.length === 0) {
      setErrorMessage("请先选择文件");
      return;
    }

    setUploadStatus("uploading");
    setUploadProgress(0);
    setErrorMessage("");

    const results: Array<{ id: string; name: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      try {
        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "上传失败");
        }

        const data = await response.json();
        results.push({
          id: data.document.id,
          name: data.document.fileName,
        });

        setUploadProgress(((i + 1) / files.length) * 100);
      } catch (error: any) {
        setErrorMessage(`上传 ${file.name} 失败: ${error.message}`);
        setUploadStatus("error");
        return;
      }
    }

    setUploadStatus("success");
    setUploadedDocs(results);
    setFiles([]);

    // 3秒后跳转到文档列表
    setTimeout(() => {
      router.push("/documents");
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* 顶部导航栏 */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg">
                <Upload className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">上传文档</h1>
                <p className="text-sm text-muted-foreground">支持 PDF、JPG、PNG 格式</p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => router.back()}>
              返回
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>上传新文档</CardTitle>
            <CardDescription>
              上传您的财务文档，AI 将自动识别并提取结构化数据
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 文档类型选择 */}
            <div>
              <label className="block text-sm font-medium mb-2">文档类型</label>
              <Select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* 拖放上传区域 */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive ? "释放文件以上传" : "拖放文件到此处"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    或点击选择文件
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  支持 PNG、JPG、PDF 格式，单个文件最大 10MB
                </div>
              </div>
            </div>

            {/* 文件列表 */}
            {files.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">待上传文件 ({files.length})</h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 上传进度 */}
            {uploadStatus === "uploading" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>上传中...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 成功状态 */}
            {uploadStatus === "success" && (
              <div className="flex items-center space-x-3 p-4 bg-green-50 text-green-700 rounded-lg">
                <Check className="h-5 w-5" />
                <div>
                  <p className="font-medium">上传成功！</p>
                  <p className="text-sm">正在跳转到文档列表...</p>
                </div>
              </div>
            )}

            {/* 错误状态 */}
            {errorMessage && (
              <div className="flex items-center space-x-3 p-4 bg-red-50 text-red-700 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}

            {/* 上传按钮 */}
            <div className="flex justify-end space-x-3">
              {files.length > 0 && uploadStatus !== "uploading" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setFiles([])}
                  >
                    清空
                  </Button>
                  <Button onClick={handleUpload} disabled={files.length === 0}>
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      上传 ({files.length})
                    </>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 提示信息 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">上传说明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• 支持的文件格式：PDF、JPG、JPEG、PNG</p>
            <p>• 单个文件大小限制：10MB</p>
            <p>• 上传后系统将自动进行 OCR 识别和数据提取</p>
            <p>• 处理时间通常在 10-30 秒，请稍候</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
