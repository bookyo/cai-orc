/**
 * User Mongoose Schema
 */

import mongoose, { Schema, Model } from "mongoose";
import { UserRole, Permissions, ROLE_PERMISSIONS, IUser } from "@/types/user";
import bcrypt from "bcrypt";

/**
 * User Model 接口扩展
 * 包含所有静态方法和实例方法
 */
export interface IUserModel extends Model<IUser> {
  findByPhone(phone: string): any;
  createAdmin(phone: string, password: string, name: string): Promise<any>;
  initializeUsers(config: {
    adminPhone: string;
    adminPassword: string;
    adminName: string;
  }): Promise<any>;
}

/**
 * User 实例方法接口
 */
export interface IUserDocument extends Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLastLogin(): Promise<any>;
}

/**
 * User Schema
 */
const UserSchema = new Schema<IUser>(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      match: /^1[3-9]\d{9}$/, // 中国手机号格式
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "operation", "guest"],
      default: "guest",
      required: true,
    },
    permissions: {
      canUpload: { type: Boolean, default: false },
      canViewDocuments: { type: Boolean, default: false },
      canDeleteDocuments: { type: Boolean, default: false },
      canExportDocuments: { type: Boolean, default: false },
      canReprocessDocuments: { type: Boolean, default: false },
      canViewReports: { type: Boolean, default: false },
      canManageUsers: { type: Boolean, default: false },
      canManageSettings: { type: Boolean, default: false },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password; // 不返回密码
        return ret;
      },
    },
  }
);

/**
 * 索引定义
 */
UserSchema.index({ phone: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

/**
 * 密码哈希中间件
 */
UserSchema.pre("save", async function (next) {
  // 只有密码被修改时才哈希
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

/**
 * 实例方法：验证密码
 */
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * 实例方法：更新登录时间
 */
UserSchema.methods.updateLastLogin = async function () {
  this.lastLoginAt = new Date();
  return this.save();
};

/**
 * 静态方法：通过手机号查找用户
 */
UserSchema.statics.findByPhone = function (phone: string) {
  return this.findOne({ phone });
};

/**
 * 静态方法：创建初始管理员用户
 */
UserSchema.statics.createAdmin = async function (
  phone: string,
  password: string,
  name: string
) {
  const existingAdmin = await this.findOne({ role: "admin" });
  if (existingAdmin) {
    return existingAdmin;
  }

  const admin = await this.create({
    phone,
    password,
    name,
    role: "admin",
    permissions: ROLE_PERMISSIONS.admin,
  });

  return admin;
};

/**
 * 静态方法：初始化默认用户
 */
UserSchema.statics.initializeUsers = async function (config: {
  adminPhone: string;
  adminPassword: string;
  adminName: string;
}) {
  // 使用 findOne 检查是否已有管理员
  const existingAdmin = await this.findOne({ role: "admin" });
  if (existingAdmin) {
    return existingAdmin;
  }

  const admin = await this.create({
    phone: config.adminPhone,
    password: config.adminPassword,
    name: config.adminName,
    role: "admin",
    permissions: ROLE_PERMISSIONS.admin,
  });

  return admin;
};

/**
 * Model 导出
 */
let UserModel: IUserModel;

if (mongoose.models.User) {
  UserModel = mongoose.models.User as unknown as IUserModel;
} else {
  UserModel = mongoose.model<IUser, IUserModel>("User", UserSchema);
}

export default UserModel;
