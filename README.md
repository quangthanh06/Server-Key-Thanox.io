# 🔑 Proxy Key System

Hệ thống nhận KEY PROXY miễn phí, production-ready, xây dựng trên Cloudflare Workers + React, tích hợp thực tế với hệ thống ServerKey (`https://serveripa.proxyvip.click`).

## 📋 Tổng quan

Website cho phép người dùng nhận key proxy (IPA hoặc VPN) miễn phí thông qua quy trình 2 bước bảo mật:
1. **Bước 1**: Vượt link cấu hình của chủ sở hữu website (`STEP1_BYPASS_URL`).
2. **Bước 2**: Tích hợp trực tiếp với hệ thống **ServerKey thật** (`https://serveripa.proxyvip.click/api/getkey`) tương ứng với loại proxy (`ipa` hoặc `vpn`) đã chọn, tự động lấy link gtraffic thật và lưu flow ID vào D1.

## 🏗️ Kiến trúc

### Stack
- **Frontend**: React 18 + Vite + TypeScript (Custom Cyber Neon Grid CSS)
- **Backend**: Cloudflare Workers + Hono REST API
- **Database**: Cloudflare D1
- **Deployment**: Cloudflare Pages / Workers

### Cấu trúc dự án
```
/
├─ frontend/           # React SPA
│  ├─ src/
│  │  ├─ api/          # API client & endpoints
│  │  ├─ components/   # UI components
│  │  ├─ pages/        # Page components
│  │  ├─ state/        # State machine & hooks
│  │  ├─ styles/       # Global CSS & variables
│  │  └─ types.ts      # Shared TypeScript types
│  ├─ index.html
│  ├─ package.json
│  └─ vite.config.ts
│
├─ worker/             # Cloudflare Worker backend
│  ├─ src/
│  │  ├─ lib/          # Crypto, config, response helpers
│  │  ├─ middleware/   # Security headers, rate limiting
│  │  ├─ routes/       # API route handlers
│  │  ├─ services/     # Business logic & ServerKey integration
│  │  ├─ __tests__/    # Test suite (23 vitest tests)
│  │  ├─ types.ts      # Backend types
│  │  └─ index.ts      # Entry point
│  ├─ migrations/      # D1 SQL migrations
│  ├─ wrangler.jsonc   # Worker configuration
│  └─ package.json
│
├─ README.md
└─ .gitignore
```

## 🚀 Hướng dẫn cài đặt

### Yêu cầu
- Node.js >= 18
- npm >= 8
- Tài khoản Cloudflare (Workers + D1)
- Wrangler CLI: `npm install -g wrangler`

### 1. Cài đặt dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../worker
npm install
```

### 2. Tạo D1 Database
```bash
cd worker
wrangler d1 create proxy-key-db
```
Copy `database_id` vào `worker/wrangler.jsonc`.

### 3. Chạy Migrations
```bash
# Local development
wrangler d1 execute proxy-key-db --local --file=migrations/001_initial.sql
wrangler d1 execute proxy-key-db --local --file=migrations/002_indexes.sql

# Production
wrangler d1 execute proxy-key-db --file=migrations/001_initial.sql
wrangler d1 execute proxy-key-db --file=migrations/002_indexes.sql
```

### 4. Cấu hình Secrets
```bash
wrangler secret put SESSION_SECRET
wrangler secret put IP_SALT
```

### 5. Cấu hình Environment Variables (`worker/wrangler.jsonc`)
```jsonc
"vars": {
  "BRAND_NAME": "PROXY KEY",
  "SITE_TITLE": "GET.KEY // PROXY KEY",
  "VERSION": "1.0.0",
  "STEP1_BYPASS_URL": "https://your-bypass-url.com",
  "DAILY_GLOBAL_LIMIT": "3000",
  "DAILY_IP_LIMIT": "2",
  "KEY_DURATION": "3600",
  "REQUESTS_PER_MINUTE": "30",
  "EXTERNAL_BASE_URL": "https://serveripa.proxyvip.click",
  "EXTERNAL_GETKEY_ENDPOINT": "/api/getkey",
  "EXTERNAL_STATS_ENDPOINT": "/api/getkey/stats"
}
```

### 6. Dev Local
```bash
# Terminal 1: Backend
cd worker
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```
Frontend: http://localhost:5173  
Backend: http://localhost:8787

### 7. Deploy Production
```bash
# Worker
cd worker
wrangler deploy

# Frontend
cd ../frontend
npm run build
```

## 🔌 Tích Hợp ServerKey Thực Tế (`https://serveripa.proxyvip.click`)

### 1. Endpoint & Request Contract Thật Đang Được Dùng
- **Endpoint**: `POST https://serveripa.proxyvip.click/api/getkey`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  - Đối với IPA: `{"keyType": "ipa"}`
  - Đối với VPN: `{"keyType": "vpn"}`
- **Response Trả Về Từ ServerKey**:
  ```json
  {
    "ok": true,
    "url": "https://gtraffic.io/oNer2QX",
    "reused": true
  }
  ```
- **Xử lý Flow ID**: Mã rút gọn (ví dụ `oNer2QX`) được trích xuất từ URL và lưu trực tiếp vào trường `step2_flow_id` của bảng `sessions` trong Cloudflare D1.

### 2. Điểm Khuyết Thiếu & Cơ Chế Còn Lại Của ServerKey
- **Phần đã kết nối THẬT**: Tạo link vượt bước 2 (IPA & VPN), phân loại chính xác theo `session.proxy_type`, lưu flow ID thật.
- **Phần ServerKey chưa hỗ trợ tự động hoàn toàn**: 
  - ServerKey **không** cung cấp API Webhook hay API tra cứu trạng thái shortlink cho bên thứ ba (`gtraffic.io` sau khi vượt link sẽ chuyển hướng trực tiếp người dùng về trang HTML `/claim` của ServerKey).
  - Vì vậy, hệ thống cung cấp endpoint `POST /api/step2/complete` để xác nhận bước 2 khi người dùng hoặc callback quay lại website trước khi thực hiện nhận key (`POST /api/key/claim`).

## 🔗 API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/session` | Tạo session mới |
| GET | `/api/session/:id` | Lấy thông tin session |
| POST | `/api/select-type` | Chọn loại proxy (ipa/vpn) |
| POST | `/api/bypass/start` | Bắt đầu bước vượt link 1 (ký HMAC token + nonce) |
| GET | `/api/bypass/callback` | Callback xác nhận bước 1 |
| POST | `/api/step2/start` | Tạo flow bước 2 trên ServerKey thật (IPA/VPN) |
| GET | `/api/step2/status` | Kiểm tra trạng thái bước 2 |
| POST | `/api/step2/complete` | Xác nhận hoàn thành bước 2 |
| POST | `/api/key/claim` | Nhận key (yêu cầu bước 1 & 2 đã hoàn thành) |
| GET | `/api/system/stats` | Thống kê hệ thống |
| GET | `/api/health` | Health check |

## 🧪 Tests Suite
Chạy toàn bộ 23 bài test kiểm tra:
```bash
cd worker
npm test
```

## 📄 License
MIT
