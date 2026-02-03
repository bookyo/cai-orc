/**
 * 环境变量配置和验证
 */

interface EnvConfig {
  // MongoDB
  mongodbUri: string;

  // GLM API
  glmApiKey: string;
  glmOcrApiUrl: string;
  glmChatApiUrl: string;

  // JWT
  jwtSecret: string;

  // Admin User (初始化)
  adminPhone: string;
  adminPassword: string;
  adminName: string;

  // File Upload
  maxFileSize: number;
  allowedFileTypes: string[];

  // Storage
  uploadDir: string;
  baseUrl: string;

  // Rate Limiting
  rateLimitMax: number;
  rateLimitWindowMs: number;

  // Cache
  cacheTtlSeconds: number;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue || "";
}

function parseNumber(value: string, defaultValue: number): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseStringArray(value: string): string[] {
  return value.split(",").map((s) => s.trim());
}

export const env: EnvConfig = {
  mongodbUri: getEnvVar("MONGODB_URI", "mongodb://localhost:27017/cai-orc"),

  glmApiKey: getEnvVar("GLM_API_KEY"),
  glmOcrApiUrl: getEnvVar(
    "GLM_OCR_API_URL",
    "https://open.bigmodel.cn/api/paas/v4/layout_parsing"
  ),
  glmChatApiUrl: getEnvVar(
    "GLM_CHAT_API_URL",
    "https://open.bigmodel.cn/api/paas/v4/chat/completions"
  ),

  jwtSecret: getEnvVar("JWT_SECRET", "change-this-secret-in-production"),

  adminPhone: getEnvVar("ADMIN_PHONE", "13800138000"),
  adminPassword: getEnvVar("ADMIN_PASSWORD", "admin123456"),
  adminName: getEnvVar("ADMIN_NAME", "系统管理员"),

  maxFileSize: parseNumber(getEnvVar("MAX_FILE_SIZE", "10485760"), 10485760), // 10MB default
  allowedFileTypes: parseStringArray(
    getEnvVar("ALLOWED_FILE_TYPES", "image/png,image/jpeg,image/jpg,application/pdf")
  ),

  uploadDir: getEnvVar("UPLOAD_DIR", "./public/uploads"),
  baseUrl: getEnvVar("BASE_URL", "http://localhost:3000"),

  rateLimitMax: parseNumber(getEnvVar("RATE_LIMIT_MAX", "100"), 100),
  rateLimitWindowMs: parseNumber(getEnvVar("RATE_LIMIT_WINDOW_MS", "900000"), 900000), // 15 minutes

  cacheTtlSeconds: parseNumber(getEnvVar("CACHE_TTL_SECONDS", "3600"), 3600), // 1 hour
};

// 验证必需的环境变量
export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!env.glmApiKey || env.glmApiKey === "your_glm_api_key_here") {
    errors.push("GLM_API_KEY is required. Please set a valid API key.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
