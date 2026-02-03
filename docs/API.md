# API 文档

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **认证方式**: 无需认证（可扩展）

## 文档管理 API

### 1. 上传文档

**请求**
```http
POST /api/documents/upload
Content-Type: multipart/form-data
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 上传的文件 |
| documentType | string | 否 | 文档类型（默认自动识别） |

**响应**
```json
{
  "success": true,
  "document": {
    "id": "文档ID",
    "fileName": "文件名",
    "fileUrl": "文件URL",
    "status": "processing"
  },
  "message": "文件上传成功，正在处理..."
}
```

---

### 2. 获取文档列表

**请求**
```http
GET /api/documents?page=1&limit=20&documentType=invoice&status=completed
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码（默认1） |
| limit | number | 否 | 每页数量（默认20） |
| documentType | string | 否 | 文档类型筛选 |
| status | string | 否 | 状态筛选 |
| search | string | 否 | 搜索关键词 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应**
```json
{
  "success": true,
  "data": {
    "documents": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    },
    "stats": {
      "total": 100,
      "byType": {},
      "byStatus": {}
    }
  }
}
```

---

### 3. 获取文档详情

**请求**
```http
GET /api/documents/{id}
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": "文档ID",
    "fileName": "文件名",
    "documentType": "invoice",
    "status": "completed",
    "ocrResult": {...},
    "parsedData": {
      "invoice": {
        "invoiceNo": "发票号",
        "amount": 1000.00
      }
    }
  }
}
```

---

### 4. 更新文档

**请求**
```http
PUT /api/documents/{id}
Content-Type: application/json

{
  "documentType": "invoice",
  "parsedData": {...}
}
```

---

### 5. 删除文档

**请求**
```http
DELETE /api/documents/{id}
```

---

### 6. 批量删除文档

**请求**
```http
DELETE /api/documents
Content-Type: application/json

{
  "ids": ["id1", "id2", "id3"]
}
```

---

### 7. 处理文档（OCR + AI 解析）

**请求**
```http
POST /api/documents/process
Content-Type: application/json

{
  "documentId": "文档ID"
}
```

**响应**
```json
{
  "success": true,
  "message": "文档处理已开始",
  "documentId": "文档ID"
}
```

---

### 8. 获取处理状态

**请求**
```http
GET /api/documents/process?id={documentId}
```

---

## 统计报表 API

### 9. 获取统计数据

**请求**
```http
GET /api/reports?range=month
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| range | string | 否 | 时间范围（week/month/quarter/year） |
| startDate | string | 否 | 自定义开始日期 |
| endDate | string | 否 | 自定义结束日期 |

**响应**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-31T23:59:59.999Z",
      "range": "month"
    },
    "overview": {
      "total": 100,
      "today": 5,
      "week": 20,
      "month": 50,
      "byStatus": {
        "completed": 80,
        "processing": 15,
        "failed": 5
      }
    },
    "documentStats": [...],
    "invoiceStats": {
      "totalAmount": 50000.00,
      "avgAmount": 500.00,
      "count": 100
    },
    "trends": {
      "monthly": [...],
      "daily": [...]
    }
  }
}
```

---

## 数据导出 API

### 10. 导出数据

**请求**
```http
POST /api/export
Content-Type: application/json

{
  "format": "json",
  "ids": ["id1", "id2"],
  "documentType": "invoice",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| format | string | 否 | 导出格式（json/csv，默认json） |
| ids | array | 否 | 要导出的文档ID列表 |
| documentType | string | 否 | 按类型筛选 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应**
- 返回文件流，Content-Type 根据 format 变化
- JSON: `application/json`
- CSV: `text/csv; charset=utf-8`

---

## 数据模型

### Document（文档）

```typescript
{
  _id: ObjectId,
  fileName: string,           // 文件名
  fileUrl: string,            // 文件URL
  fileType: string,           // 文件MIME类型
  documentType: "invoice" | "certificate" | "resume" | "handwritten" | "financial_report" | "other",
  status: "processing" | "completed" | "failed",
  uploadDate: Date,           // 上传时间

  ocrResult: {
    mdResults: string,        // Markdown格式OCR结果
    layoutDetails: Array,     // 布局详情
    numPages: number          // 页数
  },

  parsedData: {
    invoice?: {
      invoiceNo?: string,
      invoiceCode?: string,
      invoiceDate?: Date,
      amount?: number,
      taxAmount?: number,
      sellerName?: string,
      buyerName?: string,
      items?: Array
    },
    certificate?: {...},
    resume?: {...},
    handwritten?: {...},
    financialReport?: {...}
  },

  metadata: {
    fileSize: number,
    pageCount?: number,
    confidence?: number,
    ocrProcessedAt?: Date,
    aiParsedAt?: Date
  },

  error?: {
    message: string,
    stage: "upload" | "ocr" | "ai_parse" | "database"
  },

  createdAt: Date,
  updatedAt: Date
}
```

---

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

### 错误响应格式

```json
{
  "error": "错误描述",
  "message": "详细信息"
}
```

---

## 使用示例

### JavaScript Fetch

```javascript
// 上传文档
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('documentType', 'invoice');

const response = await fetch('/api/documents/upload', {
  method: 'POST',
  body: formData
});
const data = await response.json();

// 获取文档列表
const response = await fetch('/api/documents?page=1&limit=20');
const data = await response.json();
```

### cURL

```bash
# 上传文档
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@document.png" \
  -F "documentType=invoice"

# 获取文档列表
curl http://localhost:3000/api/documents?page=1&limit=20

# 获取统计
curl http://localhost:3000/api/reports?range=month

# 导出数据
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{"format":"json","documentType":"invoice"}' \
  -o export.json
```
