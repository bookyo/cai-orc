/**
 * AuditLog Mongoose Schema
 * 用于记录文档操作审计日志
 */

import mongoose, { Schema, Model } from "mongoose";

/**
 * AuditLog Model 接口扩展
 * 包含所有静态方法
 */
export interface IAuditLogModel extends Model<IAuditLog> {
  log(
    documentId: string,
    fileName: string,
    action: AuditAction,
    details?: Record<string, any>,
    userId?: string
  ): Promise<any>;
  getDocumentHistory(documentId: string, limit?: number): Promise<any[]>;
  getActionStats(startDate?: Date, endDate?: Date): Promise<any[]>;
}

/**
 * 审计日志类型
 */
export type AuditAction =
  | "upload"
  | "view"
  | "update"
  | "delete"
  | "reparse"
  | "export"
  | "batch_delete"
  | "batch_export";

/**
 * 审计日志接口
 */
export interface IAuditLog {
  _id: string;
  documentId: string;
  fileName: string;
  action: AuditAction;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  createdAt: Date;
}

/**
 * AuditLog Schema
 */
const AuditLogSchema = new Schema<IAuditLog>(
  {
    documentId: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    action: {
      type: String,
      enum: ["upload", "view", "update", "delete", "reparse", "export", "batch_delete", "batch_export"],
      required: true,
    },
    userId: String,
    ipAddress: String,
    userAgent: String,
    details: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: {
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
// 文档 ID 索引
AuditLogSchema.index({ documentId: 1 });

// 操作类型索引
AuditLogSchema.index({ action: 1 });

// 创建时间索引（用于时间范围查询）
AuditLogSchema.index({ createdAt: -1 });

// 用户 ID 索引
AuditLogSchema.index({ userId: 1 });

// 复合索引：文档 + 操作 + 时间
AuditLogSchema.index({ documentId: 1, action: 1, createdAt: -1 });

/**
 * 静态方法
 */

// 记录日志
AuditLogSchema.statics.log = async function (
  documentId: string,
  fileName: string,
  action: AuditAction,
  details?: Record<string, any>,
  userId?: string
) {
  return this.create({
    documentId,
    fileName,
    action,
    details,
    userId,
  });
};

// 获取文档操作历史
AuditLogSchema.statics.getDocumentHistory = function (documentId: string, limit = 50) {
  return this.find({ documentId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// 按操作类型统计
AuditLogSchema.statics.getActionStats = async function (startDate?: Date, endDate?: Date) {
  const match: any = {};
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = startDate;
    if (endDate) match.createdAt.$lte = endDate;
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$action",
        count: { $sum: 1 },
      },
    },
  ]);
};

/**
 * Model 导出
 */
let AuditLogModel: IAuditLogModel;

if (mongoose.models.AuditLog) {
  AuditLogModel = mongoose.models.AuditLog as unknown as IAuditLogModel;
} else {
  AuditLogModel = mongoose.model<IAuditLog, IAuditLogModel>("AuditLog", AuditLogSchema);
}

export default AuditLogModel;
