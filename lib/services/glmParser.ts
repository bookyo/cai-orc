/**
 * GLM-4.7 AI 解析服务
 * 将 OCR 结果转换为结构化 JSON 数据
 */

import axios, { AxiosError } from "axios";
import { env } from "../env";
import { DocumentType } from "@/types/document";

/**
 * GLM Chat API 消息接口
 */
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * GLM Chat API 响应接口
 */
interface ChatResponse {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 解析结果接口
 */
export interface ParsedData {
  invoice?: any;
  certificate?: any;
  resume?: any;
  handwritten?: any;
  financialReport?: any;
  detectedType?: DocumentType;
}

/**
 * Prompt 模板
 */
const PROMPT_TEMPLATES = {
  /**
   * 发票解析 Prompt
   */
  invoice: `你是一个专业的财务数据提取助手。请将以下OCR识别结果转换为结构化JSON数据。

文档类型：发票

请提取以下字段（如果存在）：
- invoiceNo: 发票号码
- invoiceCode: 发票代码
- invoiceDate: 开票日期（YYYY-MM-DD格式）
- amount: 价税合计（数字）
- taxAmount: 税额（数字）
- amountWithoutTax: 不含税金额（数字）
- sellerName: 销售方名称
- sellerTaxId: 销售方纳税人识别号
- buyerName: 购买方名称
- buyerTaxId: 购买方纳税人识别号
- items: 明细项数组
  - name: 货物/服务名称
  - quantity: 数量
  - unitPrice: 单价
  - amount: 金额

请只返回JSON，不要包含任何其他文字。如果某字段无法识别，请设置为null。`,

  /**
   * 证书解析 Prompt
   */
  certificate: `你是一个专业的证书信息提取助手。请将以下OCR识别结果转换为结构化JSON数据。

文档类型：证书

请提取以下字段（如果存在）：
- certName: 证书名称
- certNo: 证书编号
- certType: 证书类型
- issuer: 颁发机构
- issueDate: 颁发日期（YYYY-MM-DD格式）
- expiryDate: 有效期至（YYYY-MM-DD格式）
- holderName: 持有人姓名
- idNumber: 身份证号

请只返回JSON，不要包含任何其他文字。如果某字段无法识别，请设置为null。`,

  /**
   * 简历解析 Prompt
   */
  resume: `你是一个专业的简历信息提取助手。请将以下OCR识别结果转换为结构化JSON数据。

文档类型：简历

请提取以下字段（如果存在）：
- name: 姓名
- phone: 电话
- email: 邮箱
- gender: 性别
- birthDate: 出生日期（YYYY-MM-DD格式）
- address: 地址
- education: 教育经历数组
  - school: 学校名称
  - major: 专业
  - degree: 学历
  - startDate: 开始日期（YYYY-MM格式）
  - endDate: 结束日期（YYYY-MM格式）
  - gpa: GPA
- experience: 工作经历数组
  - company: 公司名称
  - position: 职位
  - startDate: 开始日期（YYYY-MM格式）
  - endDate: 结束日期（YYYY-MM格式）
  - description: 工作描述
- skills: 技能标签数组
- summary: 个人简介

请只返回JSON，不要包含任何其他文字。如果某字段无法识别，请设置为null。`,

  /**
   * 手写笔记解析 Prompt
   */
  handwritten: `你是一个专业的手写内容识别助手。请将以下OCR识别结果整理为结构化JSON数据。

文档类型：手写笔记

请提取以下内容：
- content: 识别出的文本内容，保持段落结构
- confidence: 识别置信度（0-100的数字）
- language: 主要语言（中文/英文/其他）

请只返回JSON，不要包含任何其他文字。`,

  /**
   * 财务报表解析 Prompt
   */
  financial_report: `你是一个专业的财务报表分析助手。请将以下OCR识别结果转换为结构化JSON数据。

文档类型：财务报表

请提取以下字段（如果存在）：
- reportType: 报表类型（资产负债表/利润表/现金流量表）
- reportPeriod: 报表期间
- startDate: 期间开始日期（YYYY-MM-DD格式）
- endDate: 期间结束日期（YYYY-MM-DD格式）
- revenue: 营业收入（数字）
- profit: 利润总额（数字）
- assets: 资产总额（数字）
- liabilities: 负债总额（数字）
- equity: 所有者权益（数字）
- items: 报表项目数组
  - name: 项目名称
  - amount: 金额
  - category: 分类

请只返回JSON，不要包含任何其他文字。如果某字段无法识别，请设置为null。`,

  /**
   * 文档类型识别 Prompt
   */
  detect_type: `你是一个文档类型识别专家。请分析以下OCR识别结果，判断文档类型。

可能的文档类型：
- invoice: 发票（包含发票号码、金额、买卖方等）
- certificate: 证书（包含证书名称、编号、颁发机构等）
- resume: 简历（包含个人信息、教育经历、工作经历等）
- handwritten: 手写笔记（手写内容）
- financial_report: 财务报表（资产负债表、利润表等）
- other: 其他类型

请只返回JSON格式：
{
  "type": "文档类型",
  "confidence": 置信度(0-100),
  "reason": "判断理由"
}

OCR识别结果：
{content}`,
};

/**
 * GLM Chat API 服务类
 */
export class GlmParserService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = env.glmApiKey;
    this.apiUrl = env.glmChatApiUrl;

    if (!this.apiKey) {
      throw new Error("GLM_API_KEY is not configured");
    }
  }

  /**
   * 调用 GLM Chat API
   */
  private async chat(messages: ChatMessage[], model: string = "glm-4.7"): Promise<string> {
    try {
      const response = await axios.post<ChatResponse>(
        this.apiUrl,
        {
          model,
          messages,
          temperature: 0.1, // 低温度以获得更确定性的结果
          top_p: 0.9,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 60000, // 1 分钟超时
        }
      );

      return response.data.choices[0]?.message?.content || "";
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;
        console.error("GLM Chat API error:", {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          message: axiosError.message,
        });

        throw new Error(
          `GLM API 调用失败: ${axiosError.response?.data?.error?.message || axiosError.message}`
        );
      }
      throw error;
    }
  }

  /**
   * 解析 JSON 响应（处理可能的格式问题）
   */
  private parseJsonResponse(response: string): any {
    // 尝试直接解析
    try {
      return JSON.parse(response);
    } catch {
      // 尝试提取 JSON 部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // 忽略
        }
      }
      throw new Error("无法解析 API 响应中的 JSON");
    }
  }

  /**
   * 识别文档类型
   */
  async detectDocumentType(ocrResult: string): Promise<{
    type: DocumentType;
    confidence: number;
    reason: string;
  }> {
    const prompt = PROMPT_TEMPLATES.detect_type.replace("{content}", ocrResult);

    const response = await this.chat([
      { role: "user", content: prompt },
    ]);

    const result = this.parseJsonResponse(response);

    return {
      type: result.type || "other",
      confidence: result.confidence || 50,
      reason: result.reason || "",
    };
  }

  /**
   * 解析发票
   */
  async parseInvoice(ocrResult: string): Promise<any> {
    const response = await this.chat([
      { role: "user", content: PROMPT_TEMPLATES.invoice + "\n\nOCR原始结果：\n" + ocrResult },
    ]);

    return this.parseJsonResponse(response);
  }

  /**
   * 解析证书
   */
  async parseCertificate(ocrResult: string): Promise<any> {
    const response = await this.chat([
      { role: "user", content: PROMPT_TEMPLATES.certificate + "\n\nOCR原始结果：\n" + ocrResult },
    ]);

    return this.parseJsonResponse(response);
  }

  /**
   * 解析简历
   */
  async parseResume(ocrResult: string): Promise<any> {
    const response = await this.chat([
      { role: "user", content: PROMPT_TEMPLATES.resume + "\n\nOCR原始结果：\n" + ocrResult },
    ]);

    return this.parseJsonResponse(response);
  }

  /**
   * 解析手写笔记
   */
  async parseHandwritten(ocrResult: string): Promise<any> {
    const response = await this.chat([
      { role: "user", content: PROMPT_TEMPLATES.handwritten + "\n\nOCR原始结果：\n" + ocrResult },
    ]);

    return this.parseJsonResponse(response);
  }

  /**
   * 解析财务报表
   */
  async parseFinancialReport(ocrResult: string): Promise<any> {
    const response = await this.chat([
      { role: "user", content: PROMPT_TEMPLATES.financial_report + "\n\nOCR原始结果：\n" + ocrResult },
    ]);

    return this.parseJsonResponse(response);
  }

  /**
   * 根据文档类型解析
   */
  async parseByType(
    ocrResult: string,
    documentType: DocumentType
  ): Promise<any> {
    switch (documentType) {
      case "invoice":
        return this.parseInvoice(ocrResult);
      case "certificate":
        return this.parseCertificate(ocrResult);
      case "resume":
        return this.parseResume(ocrResult);
      case "handwritten":
        return this.parseHandwritten(ocrResult);
      case "financial_report":
        return this.parseFinancialReport(ocrResult);
      default:
        return null;
    }
  }

  /**
   * 智能解析（自动识别类型）
   */
  async smartParse(ocrResult: string): Promise<{
    documentType: DocumentType;
    parsedData: ParsedData;
  }> {
    // 首先识别文档类型
    const { type } = await this.detectDocumentType(ocrResult);

    // 然后根据类型解析
    const data = await this.parseByType(ocrResult, type);

    return {
      documentType: type,
      parsedData: {
        [type]: data,
        detectedType: type,
      },
    };
  }
}

/**
 * 导出单例实例
 */
export const glmParserService = new GlmParserService();

/**
 * 便捷函数：智能解析
 */
export async function smartParse(ocrResult: string): Promise<{
  documentType: DocumentType;
  parsedData: ParsedData;
}> {
  return glmParserService.smartParse(ocrResult);
}

/**
 * 便捷函数：按类型解析
 */
export async function parseByType(
  ocrResult: string,
  documentType: DocumentType
): Promise<any> {
  return glmParserService.parseByType(ocrResult, documentType);
}

/**
 * 便捷函数：识别文档类型
 */
export async function detectDocumentType(ocrResult: string): Promise<{
  type: DocumentType;
  confidence: number;
  reason: string;
}> {
  return glmParserService.detectDocumentType(ocrResult);
}
