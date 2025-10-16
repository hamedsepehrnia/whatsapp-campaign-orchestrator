# 📚 مستندات کامل API

مستندات جامع تمام API های سیستم مدیریت کمپین‌های واتساپ

## 🔐 احراز هویت (Authentication)

### Base URL
```
http://localhost:3000/api
```

### Headers مورد نیاز
```http
Content-Type: application/json
Authorization: Bearer <jwt-token>
```

## 📱 API های احراز هویت

### 1. درخواست OTP
```http
POST /api/auth/request-otp
```

**Request Body:**
```json
{
  "channel": "sms|email",
  "target": "09123456789|user@example.com"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully",
  "expiresIn": 300
}
```

### 2. تایید OTP
```http
POST /api/auth/verify-otp
```

**Request Body:**
```json
{
  "channel": "sms|email",
  "target": "09123456789|user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "message": "OTP verified successfully",
  "verified": true
}
```

## 👤 API های کاربران

### 1. ثبت‌نام با OTP
```http
POST /api/user/register
```

**Request Body:**
```json
{
  "name": "علی احمدی",
  "username": "ali_ahmadi",
  "email": "ali@example.com",
  "phone": "09123456789",
  "password": "password123",
  "verificationToken": "otp-verification-token"
}
```

### 2. ثبت‌نام ساده
```http
POST /api/user/register-simple
```

**Request Body:**
```json
{
  "name": "علی احمدی",
  "username": "ali_ahmadi",
  "email": "ali@example.com",
  "phone": "09123456789",
  "password": "password123"
}
```

### 3. ورود
```http
POST /api/user/login
```

**Request Body:**
```json
{
  "email": "ali@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User login successfully",
  "token": "jwt-token",
  "user": {
    "id": 1,
    "name": "علی احمدی",
    "username": "ali_ahmadi",
    "email": "ali@example.com",
    "role": "USER"
  }
}
```

### 4. دریافت پروفایل
```http
GET /api/user/profile
```

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

### 5. ویرایش پروفایل
```http
POST /api/user/profile
```

**Request Body:**
```json
{
  "username": "new_username",
  "email": "new@example.com",
  "age": 25,
  "address": "تهران، ایران"
}
```

### 6. خروج
```http
POST /api/user/logout
```

## 🎯 API های کمپین‌ها

### 1. ایجاد کمپین جدید
```http
POST /api/campaigns
```

**Request Body:**
```json
{
  "message": "متن پیام کمپین",
  "title": "عنوان کمپین"
}
```

**Response:**
```json
{
  "message": "Campaign created successfully",
  "campaign": {
    "id": 1,
    "title": "عنوان کمپین",
    "status": "DRAFT"
  }
}
```

### 2. لیست کمپین‌های کاربر
```http
GET /api/campaigns
```

**Query Parameters:**
- `status`: وضعیت کمپین (DRAFT, READY, RUNNING, COMPLETED, PAUSED, FAILED)
- `title`: جستجو در عنوان
- `startDate`: تاریخ شروع
- `endDate`: تاریخ پایان
- `page`: شماره صفحه (پیش‌فرض: 1)
- `limit`: تعداد در هر صفحه (پیش‌فرض: 10)

### 3. جزئیات کمپین
```http
GET /api/campaigns/:campaignId
```

**Query Parameters:**
- `include`: شامل کردن اطلاعات اضافی (progress, recipients, attachments, report)

### 4. آپلود لیست مخاطبین
```http
POST /api/campaigns/:campaignId/recipients
```

**Content-Type:** `multipart/form-data`

**Form Data:**
- `recipientsFile`: فایل Excel (.xlsx)

**Response:**
```json
{
  "message": "Recipients uploaded successfully",
  "recipientsCount": 100,
  "campaign": {
    "id": 1,
    "status": "READY",
    "totalRecipients": 100
  }
}
```

### 5. آپلود پیوست
```http
POST /api/campaigns/:campaignId/attachment
```

**Content-Type:** `multipart/form-data`

**Form Data:**
- `attachment`: فایل پیوست

### 6. حذف پیوست
```http
DELETE /api/campaigns/:campaignId/attachment
```

### 7. تنظیم فاصله ارسال
```http
PUT /api/campaigns/:campaignId/interval
```

**Request Body:**
```json
{
  "interval": "5s|10s|20s",
  "sendType": "immediate|scheduled",
  "scheduledAt": "2024-01-01T10:00:00Z",
  "timezone": "Asia/Tehran"
}
```

### 8. تولید QR Code
```http
POST /api/campaigns/:campaignId/qr-code
```

**Response:**
```json
{
  "message": "QR code generation initiated",
  "sessionId": "uuid-session-id",
  "instructions": "WhatsApp session is being prepared. QR code will be sent via WebSocket."
}
```

### 9. بررسی وضعیت اتصال
```http
GET /api/campaigns/:campaignId/connection
```

### 10. شروع کمپین
```http
POST /api/campaigns/:campaignId/start
```

### 11. توقف کمپین
```http
POST /api/campaigns/:campaignId/pause
```

### 12. ادامه کمپین
```http
POST /api/campaigns/:campaignId/resume
```

### 13. حذف کمپین
```http
DELETE /api/campaigns/:campaignId
```

### 14. پیش‌نمایش کمپین
```http
GET /api/campaigns/:campaignId/preview
```

### 15. وضعیت مراحل کمپین
```http
GET /api/campaigns/:campaignId/steps
```

### 16. گزارش کمپین
```http
GET /api/campaigns/:campaignId/report/download
```

**Response:** فایل Excel

## 📦 API های پکیج‌ها

### 1. لیست پکیج‌ها
```http
GET /api/packages
```

**Query Parameters:**
- `category`: دسته‌بندی پکیج
- `status`: وضعیت پکیج (ACTIVE, INACTIVE)

### 2. جزئیات پکیج
```http
GET /api/packages/:id
```

### 3. ایجاد پکیج (ادمین)
```http
POST /api/packages
```

**Request Body:**
```json
{
  "title": "پکیج پایه",
  "description": "توضیحات پکیج",
  "price": 100000,
  "duration": 30,
  "category": "basic",
  "status": "active"
}
```

### 4. ویرایش پکیج (ادمین)
```http
PUT /api/packages/:id
```

### 5. حذف پکیج (ادمین)
```http
DELETE /api/packages/:id
```

## 💳 API های پرداخت

### 1. ایجاد سفارش
```http
POST /api/orders
```

**Request Body:**
```json
{
  "packageId": 1
}
```

### 2. لیست سفارشات کاربر
```http
GET /api/orders/me
```

### 3. شروع پرداخت
```http
POST /api/payments/start
```

**Request Body:**
```json
{
  "orderId": 1
}
```

### 4. تایید پرداخت
```http
POST /api/payments/verify
```

**Request Body:**
```json
{
  "orderId": 1,
  "success": true
}
```

### 5. تاریخچه پرداخت‌ها
```http
GET /api/payments/me
```

## 👨‍💼 API های ادمین

### 1. لیست کاربران
```http
GET /api/admin/users
```

**Query Parameters:**
- `q`: جستجو
- `role`: نقش کاربر
- `status`: وضعیت کاربر
- `page`: شماره صفحه
- `limit`: تعداد در هر صفحه

### 2. تغییر نقش کاربر
```http
PATCH /api/admin/users/:userId/role
```

**Request Body:**
```json
{
  "role": "admin|superAdmin"
}
```

### 3. تغییر وضعیت کاربر
```http
PATCH /api/admin/users/:userId/status
```

**Request Body:**
```json
{
  "status": "active|inactive|banned"
}
```

### 4. لیست تراکنش‌ها
```http
GET /api/admin/transactions
```

### 5. آمار داشبورد
```http
GET /api/admin/dashboard
```

**Response:**
```json
{
  "usersCount": 150,
  "packagesCount": 5,
  "paidOrdersCount": 75,
  "totalSales": 15000000
}
```

### 6. مدیریت قالب Excel
```http
POST /api/admin/excel-template
GET /api/admin/excel-template/download
GET /api/admin/excel-template/info
```

## 🔄 API های تازه‌سازی توکن

### 1. تازه‌سازی توکن
```http
POST /api/refresh/token
```

**Request Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

### 2. خروج از همه دستگاه‌ها
```http
POST /api/refresh/logout-all
```

## 📊 کدهای وضعیت HTTP

| کد | معنی | توضیح |
|---|---|---|
| 200 | OK | درخواست موفق |
| 201 | Created | ایجاد موفق |
| 400 | Bad Request | درخواست نامعتبر |
| 401 | Unauthorized | عدم احراز هویت |
| 403 | Forbidden | عدم دسترسی |
| 404 | Not Found | یافت نشد |
| 500 | Internal Server Error | خطای سرور |

## 🔍 نمونه درخواست‌ها

### cURL Examples

#### ورود کاربر
```bash
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ali@example.com",
    "password": "password123"
  }'
```

#### ایجاد کمپین
```bash
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "message": "سلام! این یک پیام تست است.",
    "title": "کمپین تست"
  }'
```

#### آپلود مخاطبین
```bash
curl -X POST http://localhost:3000/api/campaigns/1/recipients \
  -H "Authorization: Bearer <jwt-token>" \
  -F "recipientsFile=@recipients.xlsx"
```

## 🔌 WebSocket Events

### اتصال
```javascript
const socket = new WebSocket('ws://localhost:3000/ws/campaigns?campaignId=1&userId=1');
```

### رویدادها
- `campaign_update`: به‌روزرسانی وضعیت کمپین
- `progress_update`: به‌روزرسانی پیشرفت
- `status_update`: به‌روزرسانی وضعیت
- `error_update`: به‌روزرسانی خطا
- `qr_code`: دریافت QR Code
- `completion_update`: تکمیل کمپین

## 📝 نکات مهم

1. **احراز هویت**: تمام API های محافظت شده نیاز به JWT token دارند
2. **Rate Limiting**: حداکثر 200 درخواست در 15 دقیقه
3. **File Upload**: حداکثر 20MB برای فایل‌ها
4. **WebSocket**: برای دریافت به‌روزرسانی‌های لحظه‌ای
5. **Error Handling**: تمام خطاها در قالب JSON برگردانده می‌شوند

---

**نکته**: این مستندات به‌روزرسانی می‌شوند. لطفاً آخرین نسخه را بررسی کنید.
