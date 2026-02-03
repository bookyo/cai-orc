/**
 * 文档类型定义
 */

export type DocumentType =
  | "invoice"
  | "certificate"
  | "resume"
  | "handwritten"
  | "financial_report"
  | "other";

export type DocumentStatus = "processing" | "completed" | "failed";

/**
 * 基础文档接口
 */
export interface IDocument {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  documentType: DocumentType;
  uploadDate: Date;
  status: DocumentStatus;
  filePath?: string; // 文件存储路径

  // OCR 结果
  ocrResult?: {
    mdResults: string;
    layoutDetails: LayoutDetail[];
    numPages?: number;
  };

  // AI 解析后的结构化数据
  parsedData?: {
    invoice?: InvoiceData;
    certificate?: CertificateData;
    resume?: ResumeData;
    handwritten?: HandwrittenData;
    financialReport?: FinancialReportData;
  };

  // 元数据
  metadata: {
    fileSize: number;
    pageCount?: number;
    confidence?: number;
    ocrProcessedAt?: Date;
    aiParsedAt?: Date;
  };

  // 错误信息（处理失败时）
  error?: {
    message: string;
    code?: string;
    stage?: "upload" | "ocr" | "ai_parse" | "database";
  };

  createdAt: Date;
  updatedAt: Date;

  // 实例方法
  updateStatus(status: DocumentStatus, error?: any): Promise<any>;
  updateOcrResult(ocrResult: any): Promise<any>;
  updateParsedData(parsedData: any, documentType?: DocumentType): Promise<any>;
}

/**
 * 布局详情
 */
export interface LayoutDetail {
  index: number;
  label: string;
  bbox_2d: [number, number, number, number];
  content?: string; // 改为可选
  height: number;
  width: number;
  page?: number;
}

/**
 * 发票数据
 */
export interface InvoiceData {
  invoiceNo?: string;
  invoiceCode?: string;
  invoiceDate?: Date;
  amount?: number;
  taxAmount?: number;
  amountWithoutTax?: number;
  sellerName?: string;
  sellerTaxId?: string;
  buyerName?: string;
  buyerTaxId?: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  name?: string;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
  taxRate?: number;
}

/**
 * 证书数据
 */
export interface CertificateData {
  certName?: string;
  certNo?: string;
  certType?: string;
  issuer?: string;
  issueDate?: Date;
  expiryDate?: Date;
  holderName?: string;
  idNumber?: string;
}

/**
 * 简历数据
 */
export interface ResumeData {
  name?: string;
  phone?: string;
  email?: string;
  gender?: string;
  birthDate?: Date;
  address?: string;
  education?: EducationExperience[];
  experience?: WorkExperience[];
  skills?: string[];
  summary?: string;
}

export interface EducationExperience {
  school?: string;
  major?: string;
  degree?: string;
  startDate?: Date;
  endDate?: Date;
  gpa?: string;
}

export interface WorkExperience {
  company?: string;
  position?: string;
  startDate?: Date;
  endDate?: Date;
  description?: string;
}

/**
 * 手写数据
 */
export interface HandwrittenData {
  content?: string;
  confidence?: number;
  language?: string;
  transcribeTime?: Date;
}

/**
 * 财务报表数据
 */
export interface FinancialReportData {
  reportType?: string;
  reportPeriod?: string;
  startDate?: Date;
  endDate?: Date;
  revenue?: number;
  profit?: number;
  assets?: number;
  liabilities?: number;
  equity?: number;
  items?: FinancialReportItem[];
}

export interface FinancialReportItem {
  name?: string;
  amount?: number;
  category?: string;
}

/**
 * 文档列表查询参数
 */
export interface DocumentQuery {
  documentType?: DocumentType | DocumentType[];
  status?: DocumentStatus;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: keyof IDocument;
  sortOrder?: "asc" | "desc";
}

/**
 * 文档统计
 */
export interface DocumentStats {
  total: number;
  byType: Record<DocumentType, number>;
  byStatus: Record<DocumentStatus, number>;
  todayUploads: number;
  weekUploads: number;
  monthUploads: number;
}

/**
 * 报表统计数据
 */
export interface ReportStats {
  period: {
    start: Date;
    end: Date;
  };
  documents: {
    total: number;
    byType: Record<DocumentType, number>;
  };
  invoice: {
    totalAmount: number;
    avgAmount: number;
    count: number;
    monthlyTrend: MonthlyData[];
  };
  uploads: {
    byDay: DailyData[];
    byMonth: MonthlyData[];
  };
}

export interface MonthlyData {
  month: string;
  count: number;
  amount?: number;
}

export interface DailyData {
  date: string;
  count: number;
}
