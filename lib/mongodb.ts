/**
 * MongoDB 连接管理
 */

import mongoose from "mongoose";
import { env } from "./env";

/**
 * 全局 mongoose 缓存类型
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

/**
 * 声明全局类型扩展
 */
declare global {
  var mongooseCache: MongooseCache | undefined;
}

/**
 * 获取缓存的 mongoose 连接
 */
function getCache(): MongooseCache {
  return global.mongooseCache || { conn: null, promise: null };
}

/**
 * 设置缓存的 mongoose 连接
 */
function setCache(cache: MongooseCache): void {
  global.mongooseCache = cache;
}

/**
 * 连接到 MongoDB
 * 使用连接池缓存避免热重载时创建多个连接
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  const cache = getCache();

  // 如果已有连接，直接返回
  if (cache.conn) {
    return cache.conn;
  }

  // 如果没有正在进行的连接，创建一个新的
  if (!cache.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    cache.promise = mongoose
      .connect(env.mongodbUri, opts)
      .then((mongoose) => {
        console.log("✓ MongoDB connected successfully");
        return mongoose;
      })
      .catch((error) => {
        console.error("✗ MongoDB connection error:", error);
        cache.promise = null; // 重置 promise 以便重试
        throw error;
      });

    setCache(cache);
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}

/**
 * 断开 MongoDB 连接
 */
export async function disconnectFromDatabase(): Promise<void> {
  const cache = getCache();

  if (cache.conn) {
    await mongoose.disconnect();
    cache.conn = null;
    cache.promise = null;
    setCache(cache);
    console.log("✓ MongoDB disconnected");
  }
}

/**
 * 检查 MongoDB 连接状态
 */
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * 获取连接状态描述
 */
export function getConnectionState(): string {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[mongoose.connection.readyState as keyof typeof states] || "unknown";
}

/**
 * mongoose 事件监听器
 */
mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

// 进程退出时关闭连接
process.on("SIGINT", async () => {
  await disconnectFromDatabase();
  process.exit(0);
});
