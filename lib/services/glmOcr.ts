/**
 * GLM-OCR API 服务
 * 文档布局解析和 OCR 识别
 */

import axios, { AxiosError } from "axios";
import { env } from "../env";

/**
 * GLM-OCR 响应接口
 */
export interface GlmOcrResponse {
  id: string;
  created: number;
  model: string;
  md_results: string;
  layout_details: LayoutDetail[][];
  layout_visualization: string[];
  data_info: DataInfo;
  usage: Usage;
  request_id: string;
}

export interface LayoutDetail {
  index: number;
  label: string;
  bbox_2d: [number, number, number, number];
  content: string;
  height: number;
  width: number;
}

export interface DataInfo {
  num_pages: number;
  pages: PageInfo[];
}

export interface PageInfo {
  width: number;
  height: number;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details?: {
    cached_tokens: number;
  };
}

/**
 * GLM-OCR 请求参数
 */
export interface GlmOcrOptions {
  file: string; // 文件 URL 或 base64
  model?: string;
}

/**
 * GLM-OCR 服务类
 */
export class GlmOcrService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = env.glmApiKey;
    this.apiUrl = env.glmOcrApiUrl;

    if (!this.apiKey) {
      throw new Error("GLM_API_KEY is not configured");
    }
  }

  /**
   * 调用 GLM-OCR API
   */
  async parse(options: GlmOcrOptions): Promise<GlmOcrResponse> {
    try {
      console.log("GLM-OCR API request:", {
        model: options.model || "GLM-OCR",
        file: options.file,
      });
      const response = await axios.post<GlmOcrResponse>(
        this.apiUrl,
        {
          model: options.model || "GLM-OCR",
          file: options.file,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 120000, // 2 分钟超时
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;
        console.error("GLM-OCR API error:", {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          message: axiosError.message,
        });

        throw new Error(
          `OCR API 调用失败: ${axiosError.response?.data?.error?.message || axiosError.message}`
        );
      }
      throw error;
    }
  }

  /**
   * 处理文件 URL 进行 OCR
   */
  async parseFromUrl(fileUrl: string): Promise<GlmOcrResponse> {
    return this.parse({ file: fileUrl });
  }

  /**
   * 处理 Base64 编码的文件进行 OCR
   */
  async parseFromBase64(base64Data: string): Promise<GlmOcrResponse> {
    // 确保是 data URL 格式
    const fileUrl = base64Data.startsWith("data:")
      ? base64Data
      : `data:image/png;base64,${base64Data}`;

    return this.parse({ file: fileUrl });
  }

  /**
   * 将 layout_details 转换为统一格式
   */
  static normalizeLayoutDetails(
    layoutDetails: LayoutDetail[][]
  ): Array<LayoutDetail & { page?: number }> {
    const result: Array<LayoutDetail & { page?: number }> = [];

    layoutDetails.forEach((pageDetails, pageIndex) => {
      pageDetails.forEach((detail) => {
        result.push({
          ...detail,
          page: pageIndex + 1,
        });
      });
    });

    return result;
  }

  /**
   * 提取纯文本内容
   */
  static extractText(layoutDetails: LayoutDetail[][]): string {
    return layoutDetails
      .flat()
      .map((item) => item.content)
      .join("\n");
  }

  /**
   * 按标签分组内容
   */
  static groupByLabel(
    layoutDetails: LayoutDetail[][]
  ): Record<string, string[]> {
    const groups: Record<string, string> = {};

    layoutDetails.flat().forEach((item) => {
      if (!groups[item.label]) {
        groups[item.label] = "";
      }
      groups[item.label] += item.content + "\n";
    });

    // 转换为数组格式
    const result: Record<string, string[]> = {};
    Object.entries(groups).forEach(([label, content]) => {
      result[label] = content.trim().split("\n").filter(Boolean);
    });

    return result;
  }

  /**
   * 获取文档置信度（基于识别质量）
   */
  static calculateConfidence(layoutDetails: LayoutDetail[][]): number {
    const allItems = layoutDetails.flat();
    if (allItems.length === 0) return 0;

    // 这里可以根据实际返回的数据计算置信度
    // 目前返回一个基于内容长度的简单估算
    const totalContentLength = allItems.reduce(
      (sum, item) => sum + item.content.length,
      0
    );

    // 简单的置信度计算：内容越多，置信度越高
    return Math.min(100, (totalContentLength / 10) * 2);
  }
}

/**
 * 导出单例实例
 */
export const glmOcrService = new GlmOcrService();

/**
 * 便捷函数：从 URL 进行 OCR
 */
export async function ocrFromUrl(fileUrl: string): Promise<{
  mdResults: string;
  layoutDetails: Array<LayoutDetail & { page?: number }>;
  numPages: number;
  confidence: number;
}> {
  console.log("OCR from URL:", fileUrl);
  const response = await glmOcrService.parseFromUrl(fileUrl);
  console.log(response);
  const layoutDetails = GlmOcrService.normalizeLayoutDetails(
    response.layout_details
  );
  const confidence = GlmOcrService.calculateConfidence(
    response.layout_details
  );

  return {
    mdResults: response.md_results,
    layoutDetails,
    numPages: response.data_info.num_pages,
    confidence,
  };
}

/**
 * 便捷函数：从 Base64 进行 OCR
 */
export async function ocrFromBase64(
  base64Data: string
): Promise<{
  mdResults: string;
  layoutDetails: Array<LayoutDetail & { page?: number }>;
  numPages: number;
  confidence: number;
}> {
  const response = await glmOcrService.parseFromBase64(base64Data);

  const layoutDetails = GlmOcrService.normalizeLayoutDetails(
    response.layout_details
  );
  const confidence = GlmOcrService.calculateConfidence(
    response.layout_details
  );

  return {
    mdResults: response.md_results,
    layoutDetails,
    numPages: response.data_info.num_pages,
    confidence,
  };
}
