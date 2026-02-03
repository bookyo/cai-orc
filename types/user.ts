/**
 * 用户类型定义
 */

export type UserRole = "admin" | "operation" | "guest";

/**
 * 权限定义
 */
export interface Permissions {
  // 文档上传
  canUpload: boolean;
  // 文档查看
  canViewDocuments: boolean;
  // 文档删除
  canDeleteDocuments: boolean;
  // 文档导出
  canExportDocuments: boolean;
  // 文档重新解析
  canReprocessDocuments: boolean;
  // 查看报表
  canViewReports: boolean;
  // 用户管理
  canManageUsers: boolean;
  // 系统设置
  canManageSettings: boolean;
}

/**
 * 角色权限配置
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permissions> = {
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
  operation: {
    canUpload: true,
    canViewDocuments: true,
    canDeleteDocuments: true,
    canExportDocuments: true,
    canReprocessDocuments: true,
    canViewReports: true,
    canManageUsers: false,
    canManageSettings: false,
  },
  guest: {
    canUpload: false,
    canViewDocuments: true,
    canDeleteDocuments: false,
    canExportDocuments: false,
    canReprocessDocuments: false,
    canViewReports: true,
    canManageUsers: false,
    canManageSettings: false,
  },
};

/**
 * 用户接口
 */
export interface IUser {
  _id: string;
  phone: string;
  password: string; // 哈希后的密码
  name: string;
  role: UserRole;
  permissions: Permissions;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

/**
 * 登录请求
 */
export interface LoginRequest {
  phone: string;
  password: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    phone: string;
    name: string;
    role: UserRole;
    permissions: Permissions;
  };
  message?: string;
}

/**
 * 创建用户请求
 */
export interface CreateUserRequest {
  phone: string;
  password: string;
  name: string;
  role: UserRole;
}

/**
 * 会话用户（存储在JWT中）
 */
export interface SessionUser {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  permissions: Permissions;
}
