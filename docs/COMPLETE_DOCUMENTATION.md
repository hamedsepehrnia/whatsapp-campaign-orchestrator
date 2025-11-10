# مستندات جامع سیستم مدیریت کمپین واتساپ

## 📋 فهرست مطالب

1. [معرفی پروژه](#معرفی-پروژه)
2. [معماری سیستم](#معماری-سیستم)
3. [نصب و راه‌اندازی](#نصب-و-راه‌اندازی)
4. [مدل‌های پایگاه داده](#مدل‌های-پایگاه-داده)
5. [API Documentation](#api-documentation)
6. [WebSocket Events](#websocket-events)
7. [سرویس‌ها](#سرویس‌ها)
8. [Middleware ها](#middleware-ها)
9. [امنیت](#امنیت)
10. [استقرار](#استقرار)
11. [تست‌ها](#تست‌ها)
12. [اسکریپت‌های کمکی](#اسکریپت‌های-کمکی)

---

## معرفی پروژه

این پروژه یک سیستم جامع برای مدیریت کمپین‌های واتساپ است که امکان ارسال انبوه پیام‌ها، مدیریت مخاطبین، زمان‌بندی ارسال، و گزارش‌گیری کامل را فراهم می‌کند.

### ویژگی‌های کلیدی

- ✅ **مدیریت کمپین‌های واتساپ**: ایجاد، ویرایش، حذف و مدیریت کمپین‌ها
- ✅ **ارسال انبوه**: ارسال پیام به هزاران مخاطب با فاصله زمانی قابل تنظیم
- ✅ **پیوست‌ها**: پشتیبانی از ارسال فایل‌های مختلف (تصویر، ویدیو، سند)
- ✅ **زمان‌بندی**: قابلیت زمان‌بندی ارسال پیام‌ها
- ✅ **QR Code**: اتصال امن به واتساپ از طریق QR Code
- ✅ **Real-time Updates**: به‌روزرسانی لحظه‌ای وضعیت از طریق WebSocket
- ✅ **سیستم اشتراک**: مدیریت پکیج‌ها و محدودیت پیام
- ✅ **پنل ادمین**: مدیریت کامل کاربران، تراکنش‌ها و پکیج‌ها
- ✅ **گزارش‌گیری**: خروجی Excel از آمار و گزارش‌های کمپین
- ✅ **احراز هویت پیشرفته**: OTP، JWT، Session Management

---

## معماری سیستم

### ساختار پوشه‌ها

```
whatsapp-messager/
├── server.js                 # نقطه ورود اصلی سرور
├── src/
│   ├── app.js                # تنظیمات Express و middleware ها
│   ├── config/               # تنظیمات
│   │   ├── db.js            # اتصال به پایگاه داده
│   │   ├── passport.js      # تنظیمات Passport
│   │   └── prisma.js        # Prisma Client
│   ├── controllers/         # کنترلرهای API
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── campaignController.js
│   │   ├── orderController.js
│   │   ├── otpController.js
│   │   ├── packageController.js
│   │   ├── paymentController.js
│   │   └── userController.js
│   ├── middlewares/         # میدل‌ویرها
│   │   ├── auth.js         # احراز هویت
│   │   ├── errorHandler.js # مدیریت خطا
│   │   ├── subscription.js # بررسی اشتراک
│   │   ├── validate.js     # اعتبارسنجی
│   │   └── validateCampaignStatus.js
│   ├── models/             # مدل‌های Prisma
│   │   └── index.js
│   ├── routes/             # مسیرهای API
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── campaignRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── packageRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── refreshRoutes.js
│   │   └── userRoutes.js
│   ├── services/           # سرویس‌ها
│   │   ├── otpService.js
│   │   ├── paymentService.js
│   │   ├── websocketService.js
│   │   └── whatsappService.js
│   ├── utils/              # ابزارهای کمکی
│   │   ├── campaignHelpers.js
│   │   ├── errors.js
│   │   ├── fileHelpers.js
│   │   ├── logger.js
│   │   ├── mailer.js
│   │   ├── persianDate.js
│   │   ├── qrCodeHelper.js
│   │   ├── sms.js
│   │   └── startupCleanup.js
│   └── validators/         # اعتبارسنجی ورودی‌ها
│       └── schemas.js
├── prisma/
│   ├── schema.prisma       # Schema پایگاه داده
│   └── migrations/         # مایگریشن‌ها
├── public/                 # فایل‌های استاتیک
├── uploads/                # فایل‌های آپلود شده
└── scripts/                # اسکریپت‌های کمکی
```

### تکنولوژی‌های استفاده شده

- **Backend Framework**: Express.js 5.1.0
- **Database**: MySQL با Prisma ORM 5.7.1
- **Authentication**: JWT, Passport.js
- **WhatsApp Integration**: whatsapp-web.js 1.23.0
- **Real-time Communication**: WebSocket (ws 8.14.2)
- **File Upload**: Multer 1.4.5
- **Validation**: Zod 4.1.3
- **Security**: Helmet 8.1.0, bcryptjs 3.0.2
- **Rate Limiting**: express-rate-limit 8.0.1
- **Excel Processing**: xlsx 0.18.5
- **QR Code**: qrcode 1.5.3

---

## نصب و راه‌اندازی

### پیش‌نیازها

- Node.js (v16 یا بالاتر)
- MySQL (v8 یا بالاتر)
- npm یا yarn
- Chrome/Chromium (برای WhatsApp Web)

### مراحل نصب

#### 1. کلون کردن پروژه

```bash
git clone <repository-url>
cd whatsapp-messager
```

#### 2. نصب وابستگی‌ها

```bash
npm install
```

#### 3. تنظیم متغیرهای محیطی

فایل `.env` را در ریشه پروژه ایجاد کنید:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/whatsapp_campaign"

# JWT & Session
JWT_SECRET="your-strong-jwt-secret-key"
SESSION_SECRET="your-strong-session-secret-key"

# Server
PORT=3000
NODE_ENV=development

# Frontend
FRONTEND_URL="http://localhost:3000"

# SMS Service (Kavenegar)
KAVENEGAR_API_KEY="your-kavenegar-api-key"

# Email Configuration
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-email-password"

# Chrome Path (اختیاری - برای سرورهای لینوکس)
CHROME_PATH="/usr/bin/chromium-browser"
```

#### 4. راه‌اندازی پایگاه داده

```bash
# تولید Prisma Client
npm run db:generate

# اجرای مایگریشن‌ها
npm run db:migrate

# (اختیاری) مشاهده پایگاه داده
npm run db:studio
```

#### 5. اجرای پروژه

```bash
# حالت توسعه (با nodemon)
npm run dev

# حالت تولید
npm start
```

سرور روی پورت مشخص شده در `.env` (پیش‌فرض: 3000) اجرا می‌شود.

---

## مدل‌های پایگاه داده

### User (کاربر)

```prisma
model User {
  id                Int      @id @default(autoincrement())
  name              String
  username          String?  @unique
  email             String   @unique
  phone             String   @unique
  password          String
  role              Role     @default(USER)
  status            UserStatus @default(ACTIVE)
  age               Int?
  address           String?
  avatar            String?
  subscriptionActive Boolean @default(false)
  subscriptionExpiresAt DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  purchasedPackages Package[] @relation("UserPackages")
  campaigns         Campaign[]
  orders            Order[]
  refreshTokens     RefreshToken[]
}
```

**Roles**: `USER`, `ADMIN`, `SUPER_ADMIN`
**Status**: `ACTIVE`, `INACTIVE`, `BANNED`

### Campaign (کمپین)

```prisma
model Campaign {
  id                Int      @id @default(autoincrement())
  userId            Int
  title             String?
  message           String
  interval          CampaignInterval @default(TEN_SECONDS)
  isScheduled       Boolean  @default(false)
  scheduledAt       DateTime?
  timezone          String   @default("Asia/Tehran")
  sendType          SendType @default(IMMEDIATE)
  status            CampaignStatus @default(DRAFT)
  isConnected       Boolean  @default(false)
  qrCode            String? @db.Text
  sessionId         String?
  lastActivity      DateTime?
  totalRecipients   Int      @default(0)
  sentCount         Int      @default(0)
  failedCount       Int      @default(0)
  deliveredCount    Int      @default(0)
  startedAt         DateTime?
  completedAt       DateTime?
  totalMessages     Int?
  successfulMessages Int?
  failedMessages    Int?
  deliveryRate      Float?
  averageDeliveryTime Float?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipients        Recipient[]
  attachments       Attachment[]
}
```

**CampaignInterval**: `FIVE_SECONDS`, `TEN_SECONDS`, `TWENTY_SECONDS`
**SendType**: `IMMEDIATE`, `SCHEDULED`
**CampaignStatus**: `DRAFT`, `READY`, `RUNNING`, `COMPLETED`, `PAUSED`, `FAILED`, `CANCELLED`, `ACTIVE`

### Recipient (مخاطب)

```prisma
model Recipient {
  id          Int      @id @default(autoincrement())
  campaignId  Int
  phone       String
  name        String?
  status      RecipientStatus @default(PENDING)
  sentAt      DateTime?
  error       String?

  campaign    Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
}
```

**RecipientStatus**: `PENDING`, `SENT`, `FAILED`, `DELIVERED`

### Attachment (پیوست)

```prisma
model Attachment {
  id            Int      @id @default(autoincrement())
  campaignId    Int
  filename      String
  originalName  String
  mimetype      String
  size          Int
  path          String
  createdAt     DateTime @default(now())

  campaign      Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
}
```

### Package (پکیج)

```prisma
model Package {
  id           Int      @id @default(autoincrement())
  title        String
  description  String
  price        Float
  duration     Int
  category     String
  status       PackageStatus @default(ACTIVE)
  messageLimit Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  users        User[]   @relation("UserPackages")
  orders       Order[]
}
```

### Order (سفارش)

```prisma
model Order {
  id        Int       @id @default(autoincrement())
  userId    Int
  packageId Int
  status    OrderStatus @default(PENDING)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  package   Package   @relation(fields: [packageId], references: [id])
  transaction Transaction?
}
```

**OrderStatus**: `PENDING`, `PAID`, `CANCELLED`

### Transaction (تراکنش)

```prisma
model Transaction {
  id          Int             @id @default(autoincrement())
  orderId     Int             @unique
  amount      Float
  status      TransactionStatus
  gateway     PaymentGateway
  authority   String?
  refId       String?
  gatewayData Json            @default("{}")
  paymentDate DateTime        @default(now())
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  order       Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
}
```

**TransactionStatus**: `PENDING`, `SUCCESS`, `FAILURE`
**PaymentGateway**: `ZARINPAL`, `MOCK`, `OTHER`

### Otp (کد یکبار مصرف)

```prisma
model Otp {
  id          Int      @id @default(autoincrement())
  target      String
  channel     OtpChannel
  purpose     OtpPurpose
  hashedCode  String
  expiresAt   DateTime
  attempts    Int      @default(0)
  maxAttempts Int      @default(5)
  verified    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([target, channel, purpose])
}
```

**OtpChannel**: `SMS`, `EMAIL`
**OtpPurpose**: `REGISTER`

### RefreshToken (توکن تازه‌سازی)

```prisma
model RefreshToken {
  id        Int      @id @default(autoincrement())
  userId    Int
  token     String   @unique
  expiresAt DateTime
  isRevoked Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### احراز هویت

#### درخواست OTP

```http
POST /api/auth/request-otp
Content-Type: application/json

{
  "target": "09123456789",
  "channel": "SMS",
  "purpose": "REGISTER"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

#### تایید OTP

```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "target": "09123456789",
  "channel": "SMS",
  "purpose": "REGISTER",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

### مدیریت کاربران

#### ثبت‌نام با OTP

```http
POST /api/user/register
Content-Type: application/json

{
  "name": "علی احمدی",
  "email": "ali@example.com",
  "phone": "09123456789",
  "password": "securePassword123",
  "otpCode": "123456"
}
```

#### ثبت‌نام ساده (بدون OTP)

```http
POST /api/user/register-simple
Content-Type: application/json

{
  "name": "علی احمدی",
  "email": "ali@example.com",
  "phone": "09123456789",
  "password": "securePassword123"
}
```

#### ورود

```http
POST /api/user/login
Content-Type: application/json

{
  "email": "ali@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "uuid-refresh-token",
  "user": {
    "id": 1,
    "name": "علی احمدی",
    "email": "ali@example.com",
    "role": "USER"
  }
}
```

#### دریافت پروفایل

```http
GET /api/user/profile
Authorization: Bearer {accessToken}
```

#### به‌روزرسانی پروفایل

```http
POST /api/user/profile
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "علی احمدی جدید",
  "age": 30,
  "address": "تهران"
}
```

#### تازه‌سازی توکن

```http
POST /api/refresh/token
Content-Type: application/json

{
  "refreshToken": "uuid-refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "new-access-token"
}
```

#### خروج

```http
POST /api/auth/logout
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "refreshToken": "uuid-refresh-token"
}
```

### مدیریت کمپین‌ها

#### ایجاد کمپین

```http
POST /api/campaigns
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "کمپین تبلیغاتی",
  "message": "سلام، این یک پیام تست است"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Campaign created successfully",
  "campaign": {
    "id": 1,
    "title": "کمپین تبلیغاتی",
    "status": "DRAFT"
  }
}
```

#### دریافت لیست کمپین‌ها

```http
GET /api/campaigns?status=READY&page=1&limit=10
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `status`: فیلتر بر اساس وضعیت (DRAFT, READY, RUNNING, COMPLETED, etc.)
- `page`: شماره صفحه
- `limit`: تعداد در هر صفحه
- `search`: جستجو در عنوان

**Response:**
```json
{
  "success": true,
  "campaigns": [
    {
      "id": 1,
      "title": "کمپین تبلیغاتی",
      "status": "READY",
      "totalRecipients": 100,
      "sentCount": 0,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

#### دریافت جزئیات کمپین

```http
GET /api/campaigns/:campaignId
Authorization: Bearer {accessToken}
```

#### آپلود لیست مخاطبین (Excel)

```http
POST /api/campaigns/:campaignId/recipients
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

recipientsFile: [Excel File]
```

**فرمت Excel:**
- ستون `phone` یا `Phone` یا `PHONE` یا `شماره تلفن` (اجباری)
- ستون `name` یا `Name` یا `NAME` یا `نام` (اختیاری)

**Response:**
```json
{
  "success": true,
  "message": "Recipients uploaded successfully",
  "recipientsCount": 100,
  "campaign": {
    "id": 1,
    "status": "READY",
    "totalRecipients": 100
  }
}
```

#### آپلود پیوست

```http
POST /api/campaigns/:campaignId/attachment
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

attachment: [File]
```

**فرمت‌های مجاز:** تصویر، ویدیو، سند (حداکثر 20MB)

#### آپلود پیوست موقت

```http
POST /api/campaigns/:campaignId/attachment/temp
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

attachment: [File]
```

#### تایید پیوست موقت

```http
POST /api/campaigns/:campaignId/attachment/confirm
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "tempFilename": "temp-attachment-1234567890.xlsx",
  "originalName": "document.xlsx",
  "mimetype": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}
```

#### دریافت جزئیات پیوست

```http
GET /api/campaigns/:campaignId/attachment
Authorization: Bearer {accessToken}
```

#### حذف پیوست

```http
DELETE /api/campaigns/:campaignId/attachment
Authorization: Bearer {accessToken}
```

#### دریافت پیش‌نمایش کمپین

```http
GET /api/campaigns/:campaignId/preview
Authorization: Bearer {accessToken}
```

#### تولید QR Code

```http
POST /api/campaigns/:campaignId/qr-code
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "qrCode": {
    "raw": "qr-code-data",
    "url": "whatsapp-url",
    "image": "data:image/png;base64,..."
  }
}
```

#### بررسی وضعیت اتصال

```http
GET /api/campaigns/:campaignId/connection
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "isConnected": true,
  "lastActivity": "2024-01-01T00:00:00.000Z"
}
```

#### شروع کمپین

```http
POST /api/campaigns/:campaignId/start
Authorization: Bearer {accessToken}
```

#### توقف کمپین

```http
POST /api/campaigns/:campaignId/pause
Authorization: Bearer {accessToken}
```

#### ادامه کمپین

```http
POST /api/campaigns/:campaignId/resume
Authorization: Bearer {accessToken}
```

#### تنظیم فاصله زمانی ارسال

```http
PUT /api/campaigns/:campaignId/interval
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "interval": "FIVE_SECONDS"
}
```

**مقادیر مجاز:** `FIVE_SECONDS`, `TEN_SECONDS`, `TWENTY_SECONDS`

#### به‌روزرسانی عنوان کمپین

```http
PUT /api/campaigns/:campaignId/title
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "عنوان جدید"
}
```

#### دریافت کمپین‌های زمان‌بندی شده

```http
GET /api/campaigns/scheduled
Authorization: Bearer {accessToken}
```

#### لغو زمان‌بندی کمپین

```http
POST /api/campaigns/:campaignId/cancel-schedule
Authorization: Bearer {accessToken}
```

#### دریافت لیست مخاطبین

```http
GET /api/campaigns/:campaignId/recipients?sortBy=phone&sortOrder=asc
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `sortBy`: `id`, `phone`, `name`, `status`, `sentAt`
- `sortOrder`: `asc`, `desc`

#### تولید گزارش

```http
GET /api/campaigns/:campaignId/report
Authorization: Bearer {accessToken}
```

#### دانلود گزارش Excel

```http
GET /api/campaigns/:campaignId/report/download
Authorization: Bearer {accessToken}
```

#### دانلود چند گزارش

```http
POST /api/campaigns/reports/download-multiple
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "campaignIds": [1, 2, 3]
}
```

#### دریافت اطلاعات اشتراک

```http
GET /api/campaigns/subscription
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "isActive": true,
    "expiresAt": "2024-12-31T23:59:59.000Z",
    "totalLimit": 10000,
    "used": 5000,
    "remaining": 5000,
    "packages": [
      {
        "id": 1,
        "title": "پکیج پایه",
        "messageLimit": 10000
      }
    ]
  }
}
```

#### حذف کمپین

```http
DELETE /api/campaigns/:campaignId
Authorization: Bearer {accessToken}
```

#### پاک‌سازی اجباری Session

```http
POST /api/campaigns/:campaignId/cleanup-session
Authorization: Bearer {accessToken}
```

#### دانلود قالب Excel

```http
GET /api/campaigns/excel-template/download
```

این endpoint نیاز به احراز هویت ندارد.

### مدیریت پکیج‌ها

#### دریافت لیست پکیج‌ها

```http
GET /api/packages
```

#### دریافت جزئیات پکیج

```http
GET /api/packages/:id
```

#### ایجاد پکیج (Admin)

```http
POST /api/packages
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "پکیج پایه",
  "description": "توضیحات پکیج",
  "price": 100000,
  "duration": 30,
  "category": "basic",
  "messageLimit": 10000
}
```

#### به‌روزرسانی پکیج (Admin)

```http
PUT /api/packages/:id
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "پکیج پایه - به‌روزرسانی شده",
  "price": 120000
}
```

#### حذف پکیج (Admin)

```http
DELETE /api/packages/:id
Authorization: Bearer {accessToken}
```

### مدیریت سفارشات

#### ایجاد سفارش

```http
POST /api/orders
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "packageId": 1
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": 1,
    "status": "PENDING",
    "package": {
      "id": 1,
      "title": "پکیج پایه",
      "price": 100000
    }
  }
}
```

#### دریافت سفارشات کاربر

```http
GET /api/orders/me
Authorization: Bearer {accessToken}
```

### مدیریت پرداخت

#### تایید پرداخت

```http
POST /api/payments/verify
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "orderId": 1,
  "authority": "A00000000000000000000000000000000000000"
}
```

#### دریافت تاریخچه پرداخت‌ها

```http
GET /api/payments/me
Authorization: Bearer {accessToken}
```

### پنل ادمین

تمام endpoint های ادمین نیاز به نقش `ADMIN` یا `SUPER_ADMIN` دارند.

#### دریافت لیست کاربران

```http
GET /api/admin/users?page=1&limit=10&role=USER&status=ACTIVE
Authorization: Bearer {accessToken}
```

#### به‌روزرسانی نقش کاربر

```http
PATCH /api/admin/users/:userId/role
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "role": "ADMIN"
}
```

#### به‌روزرسانی وضعیت کاربر

```http
PATCH /api/admin/users/:userId/status
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "status": "BANNED"
}
```

#### دریافت لیست تراکنش‌ها

```http
GET /api/admin/transactions?page=1&limit=10&status=SUCCESS
Authorization: Bearer {accessToken}
```

#### دریافت آمار داشبورد

```http
GET /api/admin/dashboard
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 100,
    "activeUsers": 80,
    "totalCampaigns": 500,
    "runningCampaigns": 10,
    "totalRevenue": 5000000,
    "totalTransactions": 200
  }
}
```

#### آپلود قالب Excel (Admin)

```http
POST /api/admin/excel-template
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

template: [Excel File]
```

#### دریافت اطلاعات قالب Excel

```http
GET /api/admin/excel-template/info
Authorization: Bearer {accessToken}
```

---

## WebSocket Events

### اتصال

```javascript
const ws = new WebSocket('ws://localhost:3000/ws/campaigns?campaignId=1&userId=1');
```

### رویدادهای دریافتی

#### campaign_update
به‌روزرسانی وضعیت کمپین

```json
{
  "type": "campaign_update",
  "campaignId": 1,
  "data": {
    "id": 1,
    "title": "کمپین تبلیغاتی",
    "status": "RUNNING",
    "progress": {
      "total": 100,
      "sent": 50,
      "failed": 2,
      "delivered": 48
    },
    "startedAt": "2024-01-01T00:00:00.000Z",
    "timestamp": "2024-01-01T00:05:00.000Z"
  }
}
```

#### progress_update
به‌روزرسانی پیشرفت ارسال

```json
{
  "type": "progress_update",
  "campaignId": 1,
  "data": {
    "progress": {
      "total": 100,
      "sent": 75,
      "failed": 3,
      "delivered": 72,
      "percentage": 75
    },
    "timestamp": "2024-01-01T00:10:00.000Z"
  }
}
```

#### status_update
به‌روزرسانی وضعیت

```json
{
  "type": "status_update",
  "campaignId": 1,
  "data": {
    "status": "ready",
    "message": "WhatsApp connected successfully",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### error_update
خطا

```json
{
  "type": "error_update",
  "campaignId": 1,
  "data": {
    "error": "Connection timeout",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### completion_update
اتمام کمپین

```json
{
  "type": "completion_update",
  "campaignId": 1,
  "data": {
    "report": {
      "totalRecipients": 100,
      "sentCount": 98,
      "failedCount": 2,
      "deliveredCount": 96,
      "deliveryRate": 97.96
    },
    "timestamp": "2024-01-01T01:00:00.000Z"
  }
}
```

#### qr_code
QR Code برای اتصال

```json
{
  "type": "qr_code",
  "campaignId": 1,
  "data": {
    "qrCode": {
      "raw": "qr-code-data",
      "url": "whatsapp-url",
      "image": "data:image/png;base64,..."
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### مثال استفاده در Frontend

```javascript
// اتصال به WebSocket
const campaignId = 1;
const userId = 1;
const ws = new WebSocket(
  `ws://localhost:3000/ws/campaigns?campaignId=${campaignId}&userId=${userId}`
);

// رویداد اتصال
ws.onopen = () => {
  console.log('WebSocket connected');
};

// دریافت پیام‌ها
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'campaign_update':
      console.log('Campaign updated:', data.data);
      break;
    case 'progress_update':
      console.log('Progress:', data.data.progress);
      break;
    case 'status_update':
      console.log('Status:', data.data.status);
      break;
    case 'qr_code':
      // نمایش QR Code
      document.getElementById('qr-image').src = data.data.qrCode.image;
      break;
    case 'error_update':
      console.error('Error:', data.data.error);
      break;
    case 'completion_update':
      console.log('Campaign completed:', data.data.report);
      break;
  }
};

// مدیریت خطا
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

// مدیریت بسته شدن
ws.onclose = () => {
  console.log('WebSocket disconnected');
};
```

---

## سرویس‌ها

### WhatsApp Service

سرویس مدیریت اتصال واتساپ و ارسال پیام‌ها.

**متدهای اصلی:**

- `init(socketIo)`: مقداردهی اولیه سرویس
- `prepareWhatsAppSessions(campaigns, userId)`: آماده‌سازی session های واتساپ
- `generateQRCode(campaignId)`: تولید QR Code
- `checkConnection(campaignId)`: بررسی وضعیت اتصال
- `sendMessage(campaignId, phone, message, attachment)`: ارسال پیام
- `cleanupSession(campaignId)`: پاک‌سازی session

**مثال استفاده:**

```javascript
const whatsappService = require('./services/whatsappService');

// مقداردهی اولیه
whatsappService.init(websocketService);

// تولید QR Code
const qrCode = await whatsappService.generateQRCode(campaignId);

// ارسال پیام
await whatsappService.sendMessage(campaignId, '09123456789', 'Hello', null);
```

### WebSocket Service

سرویس مدیریت ارتباط Real-time از طریق WebSocket.

**متدهای اصلی:**

- `initialize(server)`: مقداردهی اولیه WebSocket Server
- `sendCampaignUpdate(campaignId, userId)`: ارسال به‌روزرسانی کمپین
- `sendProgressUpdate(campaignId, progress, userId)`: ارسال به‌روزرسانی پیشرفت
- `sendStatusUpdate(campaignId, status, message, userId)`: ارسال به‌روزرسانی وضعیت
- `sendErrorUpdate(campaignId, error, userId)`: ارسال خطا
- `sendCompletionUpdate(campaignId, report, userId)`: ارسال گزارش اتمام
- `sendQRCode(campaignId, qrCode, userId)`: ارسال QR Code

### OTP Service

سرویس مدیریت کدهای یکبار مصرف.

**متدهای اصلی:**

- `generateOTP(target, channel, purpose)`: تولید OTP
- `verifyOTP(target, channel, purpose, code)`: تایید OTP
- `sendOTP(target, channel, code)`: ارسال OTP

### Payment Service

سرویس مدیریت پرداخت‌ها (Zarinpal).

**متدهای اصلی:**

- `zarinpalRequest({ merchantId, amount, description, callbackUrl, metadata })`: درخواست پرداخت
- `zarinpalVerify({ merchantId, amount, authority })`: تایید پرداخت

---

## Middleware ها

### Authentication Middleware

#### authenticateSession

احراز هویت بر اساس Session یا JWT Token.

```javascript
const { authenticateSession } = require('./middlewares/auth');

router.get('/protected', authenticateSession, (req, res) => {
  // req.user در دسترس است
  res.json({ user: req.user });
});
```

#### authenticateJwt

احراز هویت فقط بر اساس JWT Token.

```javascript
const { authenticateJwt } = require('./middlewares/auth');

router.get('/protected', authenticateJwt, (req, res) => {
  res.json({ user: req.user });
});
```

#### authorizeRoles

کنترل دسترسی بر اساس نقش کاربر.

```javascript
const { authorizeRoles } = require('./middlewares/auth');

router.get('/admin', 
  authenticateSession, 
  authorizeRoles('admin', 'superAdmin'),
  (req, res) => {
    res.json({ message: 'Admin access' });
  }
);
```

### Subscription Middleware

#### checkCampaignStartPermission

بررسی مجوز شروع کمپین (اشتراک فعال، مخاطبین موجود، اتصال واتساپ).

```javascript
const { checkCampaignStartPermission } = require('./middlewares/subscription');

router.post('/:campaignId/start', 
  authenticateSession,
  checkCampaignStartPermission,
  startCampaign
);
```

#### getSubscriptionInfo

دریافت اطلاعات اشتراک کاربر.

```javascript
const { getSubscriptionInfo } = require('./middlewares/subscription');

router.get('/subscription',
  authenticateSession,
  getSubscriptionInfo,
  (req, res) => {
    res.json({ subscription: req.subscriptionInfo });
  }
);
```

### Validation Middleware

#### validate

اعتبارسنجی ورودی‌ها با استفاده از Zod.

```javascript
const { validate } = require('./middlewares/validate');
const { campaignCreateSchema } = require('./validators/schemas');

router.post('/campaigns',
  authenticateSession,
  validate(campaignCreateSchema),
  createCampaign
);
```

### Error Handler Middleware

#### asyncHandler

مدیریت خطاهای async functions.

```javascript
const { asyncHandler } = require('./middlewares/errorHandler');

exports.getCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    throw new NotFoundError('Campaign not found');
  }
  res.json({ campaign });
});
```

---

## امنیت

### اقدامات امنیتی پیاده‌سازی شده

1. **Rate Limiting**: محدودیت 200 درخواست در 15 دقیقه
2. **Helmet**: محافظت از هدرهای HTTP
3. **CORS**: کنترل دسترسی cross-origin
4. **Input Validation**: اعتبارسنجی کامل ورودی‌ها با Zod
5. **Password Hashing**: رمزنگاری امن رمز عبور با bcryptjs
6. **JWT Tokens**: توکن‌های امن با انقضای 30 روز
7. **Refresh Tokens**: توکن‌های تازه‌سازی با انقضای 60 روز
8. **Session Management**: مدیریت جلسات امن
9. **File Upload Security**: محدودیت نوع و اندازه فایل
10. **SQL Injection Protection**: استفاده از Prisma ORM

### بهترین شیوه‌ها

- ✅ استفاده از متغیرهای محیطی برای اطلاعات حساس
- ✅ اعتبارسنجی تمام ورودی‌ها
- ✅ لاگ‌گیری مناسب برای امنیت
- ✅ به‌روزرسانی منظم وابستگی‌ها
- ✅ استفاده از HTTPS در production
- ✅ محدودیت دسترسی بر اساس نقش کاربر

---

## استقرار

### متغیرهای محیطی Production

```env
NODE_ENV=production
DATABASE_URL="mysql://user:password@host:port/database"
JWT_SECRET="strong-random-secret-key"
SESSION_SECRET="strong-random-session-secret"
PORT=3000
FRONTEND_URL="https://your-frontend-domain.com"
```

### دستورات استقرار

```bash
# نصب وابستگی‌های production
npm install --production

# اجرای مایگریشن‌ها
npm run db:deploy

# تولید Prisma Client
npm run db:generate

# شروع سرویس
npm start
```

### استفاده از PM2

```bash
# نصب PM2
npm install -g pm2

# شروع با PM2
pm2 start server.js --name whatsapp-api

# مشاهده لاگ‌ها
pm2 logs whatsapp-api

# راه‌اندازی مجدد
pm2 restart whatsapp-api

# توقف
pm2 stop whatsapp-api
```

### استفاده از Docker (اختیاری)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN npm run db:generate

EXPOSE 3000

CMD ["npm", "start"]
```

---

## تست‌ها

### اجرای تست‌ها

```bash
# اجرای تمام تست‌ها
npm run test:all

# تست API های کمپین
npm run test:campaign

# تست یکپارچگی واتساپ
npm run test:whatsapp

# تست API های عمومی
npm test
```

### تست دستی با Postman

یک Postman Collection در پوشه `postman/` موجود است که شامل تمام endpoint های API می‌باشد.

---

## اسکریپت‌های کمکی

### بررسی متغیرهای محیطی

```bash
npm run check-env
```

### ایجاد کاربر ادمین

```bash
npm run make-admin
```

### اعطای اشتراک به کاربر

```bash
npm run give-subscription
```

### ایجاد فایل Excel تست

```bash
npm run create-test-excel
```

### دستورات پایگاه داده

```bash
# تولید Prisma Client
npm run db:generate

# اجرای مایگریشن‌ها (development)
npm run db:migrate

# اجرای مایگریشن‌ها (production)
npm run db:deploy

# مشاهده پایگاه داده
npm run db:studio
```

---

## خطاهای رایج و راه‌حل

### خطای اتصال به پایگاه داده

**مشکل:** `Can't reach database server`

**راه‌حل:**
1. بررسی اجرای MySQL
2. بررسی صحت `DATABASE_URL` در `.env`
3. بررسی دسترسی کاربر به پایگاه داده

### خطای QR Code

**مشکل:** QR Code تولید نمی‌شود

**راه‌حل:**
1. بررسی نصب Chrome/Chromium
2. تنظیم `CHROME_PATH` در `.env` (برای سرورهای لینوکس)
3. بررسی لاگ‌های سرور

### خطای محدودیت اشتراک

**مشکل:** `Insufficient quota`

**راه‌حل:**
1. خرید پکیج جدید
2. بررسی انقضای اشتراک
3. بررسی استفاده از quota

### خطای اتصال WebSocket

**مشکل:** WebSocket متصل نمی‌شود

**راه‌حل:**
1. بررسی اجرای سرور
2. بررسی URL WebSocket
3. بررسی فایروال و proxy

---

## پشتیبانی و مشارکت

### گزارش باگ

لطفاً issues را در repository گزارش دهید.

### مشارکت

1. Fork کنید
2. شاخه جدید ایجاد کنید (`git checkout -b feature/amazing-feature`)
3. تغییرات را commit کنید (`git commit -m 'Add amazing feature'`)
4. Push کنید (`git push origin feature/amazing-feature`)
5. Pull Request ایجاد کنید

---

## مجوز

این پروژه تحت مجوز MIT منتشر شده است.

---

## نسخه‌ها

### نسخه 1.0.0

- راه‌اندازی اولیه سیستم
- پشتیبانی از کمپین‌های واتساپ
- سیستم احراز هویت OTP و JWT
- پنل ادمین کامل
- گزارش‌گیری پیشرفته
- Real-time updates با WebSocket
- سیستم اشتراک و پرداخت

---

**آخرین به‌روزرسانی:** 2024

**نگهدارنده:** تیم توسعه

