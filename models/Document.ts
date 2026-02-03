/**
 * Document Mongoose Schema
 */

import mongoose, { Schema, Model, Document as MongooseDocument } from "mongoose";
import {
  DocumentType,
  DocumentStatus,
  IDocument,
  LayoutDetail,
  InvoiceData,
  CertificateData,
  ResumeData,
  HandwrittenData,
  FinancialReportData,
} from "@/types/document";

/**
 * Document 实例方法接口
 */
export interface IDocumentModel extends Model<IDocument> {
  getCountByType(): Promise<any[]>;
  getCountByStatus(): Promise<any[]>;
  getRecentUploads(limit?: number): Promise<any[]>;
  searchDocuments(keyword: string, limit?: number): Promise<any[]>;
}

/**
 * Document 实例方法接口
 */
export interface IDocumentDocument extends MongooseDocument {
  updateStatus(status: DocumentStatus, error?: any): Promise<any>;
  updateOcrResult(ocrResult: any): Promise<any>;
  updateParsedData(parsedData: any, documentType?: DocumentType): Promise<any>;
}

/**
 * Layout Detail 子文档 Schema
 */
const LayoutDetailSchema = new Schema<LayoutDetail>(
  {
    index: { type: Number, required: true },
    label: { type: String, required: true },
    bbox_2d: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]) => v.length === 4,
        message: "bbox_2d must have exactly 4 elements",
      },
    },
    content: { type: String, required: true },
    height: { type: Number, required: true },
    width: { type: Number, required: true },
    page: { type: Number },
  },
  { _id: false }
);

/**
 * Invoice Item 子文档 Schema
 */
const InvoiceItemSchema = new Schema(
  {
    name: String,
    quantity: Number,
    unitPrice: Number,
    amount: Number,
    taxRate: Number,
  },
  { _id: false }
);

/**
 * Education Experience 子文档 Schema
 */
const EducationExperienceSchema = new Schema(
  {
    school: String,
    major: String,
    degree: String,
    startDate: Date,
    endDate: Date,
    gpa: String,
  },
  { _id: false }
);

/**
 * Work Experience 子文档 Schema
 */
const WorkExperienceSchema = new Schema(
  {
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    description: String,
  },
  { _id: false }
);

/**
 * Financial Report Item 子文档 Schema
 */
const FinancialReportItemSchema = new Schema(
  {
    name: String,
    amount: Number,
    category: String,
  },
  { _id: false }
);

/**
 * OCR Result 子文档 Schema
 */
const OcrResultSchema = new Schema(
  {
    mdResults: { type: String, required: true },
    layoutDetails: [LayoutDetailSchema],
    numPages: Number,
  },
  { _id: false }
);

/**
 * Parsed Data 子文档 Schema
 */
const ParsedDataSchema = new Schema(
  {
    invoice: {
      invoiceNo: String,
      invoiceCode: String,
      invoiceDate: Date,
      amount: Number,
      taxAmount: Number,
      amountWithoutTax: Number,
      sellerName: String,
      sellerTaxId: String,
      buyerName: String,
      buyerTaxId: String,
      items: [InvoiceItemSchema],
    },
    certificate: {
      certName: String,
      certNo: String,
      certType: String,
      issuer: String,
      issueDate: Date,
      expiryDate: Date,
      holderName: String,
      idNumber: String,
    },
    resume: {
      name: String,
      phone: String,
      email: String,
      gender: String,
      birthDate: Date,
      address: String,
      education: [EducationExperienceSchema],
      experience: [WorkExperienceSchema],
      skills: [String],
      summary: String,
    },
    handwritten: {
      content: String,
      confidence: Number,
      language: String,
      transcribeTime: Date,
    },
    financialReport: {
      reportType: String,
      reportPeriod: String,
      startDate: Date,
      endDate: Date,
      revenue: Number,
      profit: Number,
      assets: Number,
      liabilities: Number,
      equity: Number,
      items: [FinancialReportItemSchema],
    },
  },
  { _id: false }
);

/**
 * Error 子文档 Schema
 */
const ErrorSchema = new Schema(
  {
    message: { type: String, required: true },
    code: String,
    stage: {
      type: String,
      enum: ["upload", "ocr", "ai_parse", "database"],
    },
  },
  { _id: false }
);

/**
 * Metadata 子文档 Schema
 */
const MetadataSchema = new Schema(
  {
    fileSize: { type: Number, required: true },
    pageCount: Number,
    confidence: Number,
    ocrProcessedAt: Date,
    aiParsedAt: Date,
  },
  { _id: false }
);

/**
 * Document 主 Schema
 */
const DocumentSchema = new Schema<IDocument>(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true, unique: true },
    fileType: { type: String, required: true },
    documentType: {
      type: String,
      enum: ["invoice", "certificate", "resume", "handwritten", "financial_report", "other"],
      default: "other",
      required: true,
    },
    uploadDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
      required: true,
    },

    ocrResult: OcrResultSchema,
    parsedData: ParsedDataSchema,

    metadata: {
      fileSize: { type: Number, required: true },
      pageCount: Number,
      confidence: Number,
      ocrProcessedAt: Date,
      aiParsedAt: Date,
    },

    error: ErrorSchema,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * 索引定义
 */
// 文档类型索引
DocumentSchema.index({ documentType: 1 });

// 状态索引
DocumentSchema.index({ status: 1 });

// 上传日期索引（用于时间范围查询）
DocumentSchema.index({ uploadDate: -1 });

// 复合索引：文档类型 + 状态 + 日期
DocumentSchema.index({ documentType: 1, status: 1, uploadDate: -1 });

// 发票金额索引（用于报表统计）
DocumentSchema.index({ "parsedData.invoice.amount": 1 });

// 发票日期索引
DocumentSchema.index({ "parsedData.invoice.invoiceDate": -1 });

// 文本搜索索引
DocumentSchema.index({ fileName: "text", "ocrResult.mdResults": "text" });

/**
 * 虚拟字段
 */
DocumentSchema.virtual("id").get(function (this: MongooseDocument) {
  return this._id.toString();
});

/**
 * 实例方法
 */

// 更新状态
DocumentSchema.methods.updateStatus = function (status: DocumentStatus, error?: any) {
  this.status = status;
  if (error && status === "failed") {
    this.error = {
      message: error.message || "Unknown error",
      code: error.code,
      stage: error.stage,
    };
  } else {
    this.error = undefined;
  }
  return this.save();
};

// 更新 OCR 结果
DocumentSchema.methods.updateOcrResult = function (ocrResult: any) {
  this.ocrResult = ocrResult;
  this.metadata.ocrProcessedAt = new Date();
  if (ocrResult.numPages) {
    this.metadata.pageCount = ocrResult.numPages;
  }
  return this.save();
};

// 更新解析结果
DocumentSchema.methods.updateParsedData = function (parsedData: any, documentType?: DocumentType) {
  this.parsedData = parsedData;
  this.metadata.aiParsedAt = new Date();
  if (documentType) {
    this.documentType = documentType;
  }
  this.status = "completed";
  return this.save();
};

/**
 * 静态方法
 */

// 按类型统计
DocumentSchema.statics.getCountByType = async function () {
  return this.aggregate([
    {
      $group: {
        _id: "$documentType",
        count: { $sum: 1 },
      },
    },
  ]);
};

// 按状态统计
DocumentSchema.statics.getCountByStatus = async function () {
  return this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
};

// 获取最近上传
DocumentSchema.statics.getRecentUploads = function (limit = 10) {
  return this.find().sort({ uploadDate: -1 }).limit(limit);
};

// 搜索文档
DocumentSchema.statics.searchDocuments = function (keyword: string, limit = 20) {
  return this.find({
    $or: [
      { fileName: { $regex: keyword, $options: "i" } },
      { "ocrResult.mdResults": { $regex: keyword, $options: "i" } },
    ],
  })
    .sort({ uploadDate: -1 })
    .limit(limit);
};

/**
 * Model 导出
 */
let DocumentModel: IDocumentModel;

// 避免热重载时重新编译模型
if (mongoose.models.Document) {
  DocumentModel = mongoose.models.Document as unknown as IDocumentModel;
} else {
  DocumentModel = mongoose.model<IDocument, IDocumentModel>("Document", DocumentSchema);
}

export default DocumentModel;
