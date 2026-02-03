#!/usr/bin/env node
/**
 * 系统初始化脚本
 * 创建默认管理员用户
 */

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { config } from "dotenv";

// 加载环境变量
const result = config({ path: ".env.local" });

const env = {
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/cai-orc",
  adminPhone: process.env.ADMIN_PHONE || "13800138000",
  adminPassword: process.env.ADMIN_PASSWORD || "admin123456",
  adminName: process.env.ADMIN_NAME || "系统管理员",
};

const ROLE_PERMISSIONS = {
  admin: {
    canUpload: true,
    canViewDocuments: true,
    canDeleteDocuments: true,
    canExportDocuments: true,
    canReprocessDocuments: true,
    canViewReports: true,
    canManageUsers: true,
    canManageSettings: true,
  },
};

// User Schema
const UserSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["admin", "operation", "guest"], default: "guest" },
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
  isActive: { type: Boolean, default: true },
  lastLoginAt: Date,
});

UserSchema.index({ phone: 1 });

const User = mongoose.model("User", UserSchema);

async function initSystem() {
  try {
    console.log("🚀 正在初始化系统...\n");

    // 连接数据库
    await mongoose.connect(env.mongodbUri);
    console.log("✓ 数据库连接成功");

    // 检查是否已有用户
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log(`\n⚠️  系统已有 ${existingUsers} 个用户，无需初始化`);
      console.log("如需重新初始化，请先清空数据库");
      await mongoose.disconnect();
      process.exit(0);
    }

    // 创建默认管理员
    console.log("\n📝 创建默认管理员用户...");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(env.adminPassword, salt);

    const admin = await User.create({
      phone: env.adminPhone,
      password: hashedPassword,
      name: env.adminName,
      role: "admin",
      permissions: ROLE_PERMISSIONS.admin,
      isActive: true,
    });

    await mongoose.disconnect();

    console.log("\n✅ 系统初始化成功！\n");
    console.log("═══════════════════════════════════════");
    console.log("📋 默认管理员账号信息");
    console.log("═══════════════════════════════════════");
    console.log(`  手机号: ${admin.phone}`);
    console.log(`  密码:   ${env.adminPassword}`);
    console.log(`  姓名:   ${admin.name}`);
    console.log(`  角色:   管理员`);
    console.log("═══════════════════════════════════════\n");
    console.log("🌐 访问地址: http://localhost:3000/login");
    console.log("\n⚠️  重要提示：");
    console.log("  - 首次登录后请立即修改默认密码");
    console.log("  - 请妥善保管管理员账号信息\n");

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ 系统初始化失败:", error.message);
    if (error.message.includes("ECONNREFUSED")) {
      console.error("\n💡 提示: 请先启动 MongoDB 服务");
      console.error("   docker run -d -p 27017:27017 --name mongodb mongo:latest");
    }
    process.exit(1);
  }
}

initSystem();
