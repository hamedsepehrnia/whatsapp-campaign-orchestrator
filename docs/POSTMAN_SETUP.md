# 📮 راهنمای Postman

راهنمای کامل استفاده از Postman Collection برای تست API ها

## 📥 نصب و راه‌اندازی

### دانلود Postman
1. به [postman.com](https://www.postman.com) بروید
2. Postman Desktop App را دانلود کنید
3. حساب کاربری ایجاد کنید (اختیاری)

### Import Collection
1. فایل `WhatsApp-Campaign-API-Complete.postman_collection.json` را دانلود کنید
2. در Postman، روی Import کلیک کنید
3. فایل collection را انتخاب کنید
4. Environment file را نیز import کنید

## 🌍 تنظیمات Environment

### ایجاد Environment
```json
{
  "name": "WhatsApp Campaign API",
  "values": [
    {
      "key": "base_url",
      "value": "http://localhost:3000",
      "enabled": true
    },
    {
      "key": "api_url",
      "value": "{{base_url}}/api",
      "enabled": true
    },
    {
      "key": "auth_token",
      "value": "",
      "enabled": true
    },
    {
      "key": "user_id",
      "value": "",
      "enabled": true
    },
    {
      "key": "campaign_id",
      "value": "",
      "enabled": true
    }
  ]
}
```

### تنظیمات متغیرها
- **base_url**: آدرس سرور (پیش‌فرض: http://localhost:3000)
- **api_url**: آدرس API (پیش‌فرض: {{base_url}}/api)
- **auth_token**: توکن احراز هویت (خودکار پر می‌شود)
- **user_id**: شناسه کاربر (خودکار پر می‌شود)
- **campaign_id**: شناسه کمپین (خودکار پر می‌شود)

## 🔐 احراز هویت

### 1. ثبت‌نام ساده
```http
POST {{api_url}}/user/register-simple
Content-Type: application/json

{
  "name": "علی احمدی",
  "username": "ali_ahmadi",
  "email": "ali@example.com",
  "phone": "09123456789",
  "password": "password123"
}
```

### 2. ورود
```http
POST {{api_url}}/user/login
Content-Type: application/json

{
  "email": "ali@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User login successfully",
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "name": "علی احمدی",
    "username": "ali_ahmadi",
    "email": "ali@example.com",
    "role": "USER"
  }
}
```

### 3. تنظیم توکن
1. بعد از ورود موفق، توکن را کپی کنید
2. در Environment، متغیر `auth_token` را تنظیم کنید
3. متغیر `user_id` را نیز تنظیم کنید

## 🎯 تست کمپین‌ها

### 1. ایجاد کمپین
```http
POST {{api_url}}/campaigns
Authorization: Bearer {{auth_token}}
Content-Type: application/json

{
  "message": "سلام! این یک پیام تست است.",
  "title": "کمپین تست"
}
```

**Response:**
```json
{
  "message": "Campaign created successfully",
  "campaign": {
    "id": 1,
    "title": "کمپین تست",
    "status": "DRAFT"
  }
}
```

### 2. لیست کمپین‌ها
```http
GET {{api_url}}/campaigns
Authorization: Bearer {{auth_token}}
```

### 3. جزئیات کمپین
```http
GET {{api_url}}/campaigns/{{campaign_id}}
Authorization: Bearer {{auth_token}}
```

## 📁 آپلود فایل‌ها

### 1. دانلود قالب Excel
```http
GET {{api_url}}/campaigns/excel-template/download
```

### 2. آپلود مخاطبین
```http
POST {{api_url}}/campaigns/{{campaign_id}}/recipients
Authorization: Bearer {{auth_token}}
Content-Type: multipart/form-data

recipientsFile: [فایل Excel]
```

### 3. آپلود پیوست
```http
POST {{api_url}}/campaigns/{{campaign_id}}/attachment
Authorization: Bearer {{auth_token}}
Content-Type: multipart/form-data

attachment: [فایل پیوست]
```

## ⚙️ تنظیمات کمپین

### 1. تنظیم فاصله ارسال
```http
PUT {{api_url}}/campaigns/{{campaign_id}}/interval
Authorization: Bearer {{auth_token}}
Content-Type: application/json

{
  "interval": "10s",
  "sendType": "immediate"
}
```

### 2. تولید QR Code
```http
POST {{api_url}}/campaigns/{{campaign_id}}/qr-code
Authorization: Bearer {{auth_token}}
```

### 3. بررسی وضعیت اتصال
```http
GET {{api_url}}/campaigns/{{campaign_id}}/connection
Authorization: Bearer {{auth_token}}
```

## 🚀 کنترل کمپین

### 1. شروع کمپین
```http
POST {{api_url}}/campaigns/{{campaign_id}}/start
Authorization: Bearer {{auth_token}}
```

### 2. توقف کمپین
```http
POST {{api_url}}/campaigns/{{campaign_id}}/pause
Authorization: Bearer {{auth_token}}
```

### 3. ادامه کمپین
```http
POST {{api_url}}/campaigns/{{campaign_id}}/resume
Authorization: Bearer {{auth_token}}
```

## 📊 گزارش‌گیری

### 1. گزارش کمپین
```http
GET {{api_url}}/campaigns/{{campaign_id}}/report
Authorization: Bearer {{auth_token}}
```

### 2. دانلود گزارش Excel
```http
GET {{api_url}}/campaigns/{{campaign_id}}/report/download
Authorization: Bearer {{auth_token}}
```

## 👨‍💼 تست پنل ادمین

### 1. لیست کاربران
```http
GET {{api_url}}/admin/users
Authorization: Bearer {{auth_token}}
```

### 2. آمار داشبورد
```http
GET {{api_url}}/admin/dashboard
Authorization: Bearer {{auth_token}}
```

### 3. لیست تراکنش‌ها
```http
GET {{api_url}}/admin/transactions
Authorization: Bearer {{auth_token}}
```

## 🔄 تست WebSocket

### 1. اتصال WebSocket
```javascript
// در Postman، از WebSocket request استفاده کنید
ws://localhost:3000/ws/campaigns?campaignId={{campaign_id}}&userId={{user_id}}
```

### 2. رویدادهای WebSocket
- `campaign_update`: به‌روزرسانی وضعیت کمپین
- `progress_update`: به‌روزرسانی پیشرفت
- `status_update`: به‌روزرسانی وضعیت
- `error_update`: به‌روزرسانی خطا
- `qr_code`: دریافت QR Code
- `completion_update`: تکمیل کمپین

## 🧪 تست‌های پیشرفته

### 1. تست Rate Limiting
```http
# ارسال 10 درخواست متوالی
GET {{api_url}}/campaigns
Authorization: Bearer {{auth_token}}
```

### 2. تست Validation
```http
# ارسال داده نامعتبر
POST {{api_url}}/campaigns
Authorization: Bearer {{auth_token}}
Content-Type: application/json

{
  "message": "",
  "title": ""
}
```

### 3. تست Error Handling
```http
# درخواست بدون احراز هویت
GET {{api_url}}/campaigns
```

## 📋 Collection Structure

### Folders
```
📁 WhatsApp Campaign API
├── 📁 Authentication
│   ├── Register Simple
│   ├── Login
│   └── Logout
├── 📁 Campaigns
│   ├── Create Campaign
│   ├── List Campaigns
│   ├── Get Campaign Details
│   ├── Update Campaign
│   └── Delete Campaign
├── 📁 File Management
│   ├── Download Excel Template
│   ├── Upload Recipients
│   ├── Upload Attachment
│   └── Delete Attachment
├── 📁 Campaign Control
│   ├── Generate QR Code
│   ├── Check Connection
│   ├── Start Campaign
│   ├── Pause Campaign
│   └── Resume Campaign
├── 📁 Reporting
│   ├── Get Campaign Report
│   └── Download Report
└── 📁 Admin
    ├── List Users
    ├── Dashboard Stats
    └── List Transactions
```

## 🔧 تنظیمات پیشرفته

### Pre-request Scripts
```javascript
// تنظیم خودکار متغیرها
if (pm.response.code === 200) {
  const response = pm.response.json();
  
  if (response.token) {
    pm.environment.set("auth_token", response.token);
  }
  
  if (response.user && response.user.id) {
    pm.environment.set("user_id", response.user.id);
  }
  
  if (response.campaign && response.campaign.id) {
    pm.environment.set("campaign_id", response.campaign.id);
  }
}
```

### Tests
```javascript
// تست‌های خودکار
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response has required fields", function () {
  const response = pm.response.json();
  pm.expect(response).to.have.property('message');
});

pm.test("Response time is less than 2000ms", function () {
  pm.expect(pm.response.responseTime).to.be.below(2000);
});
```

## 🚀 اجرای تست‌ها

### 1. اجرای Collection
1. روی Collection کلیک کنید
2. روی "Run" کلیک کنید
3. تست‌ها را انتخاب کنید
4. روی "Run" کلیک کنید

### 2. اجرای Folder
1. روی Folder کلیک کنید
2. روی "Run" کلیک کنید
3. تست‌های مربوطه اجرا می‌شوند

### 3. اجرای تست واحد
1. روی Request کلیک کنید
2. روی "Send" کلیک کنید
3. نتیجه را بررسی کنید

## 📊 گزارش‌گیری

### 1. مشاهده نتایج
- نتایج تست‌ها در Console نمایش داده می‌شود
- آمار عملکرد در Reports قابل مشاهده است

### 2. Export Results
- نتایج را می‌توان به CSV export کرد
- گزارش‌های تفصیلی در HTML قابل دریافت است

## 🔍 عیب‌یابی

### مشکلات رایج
1. **خطای 401**: توکن احراز هویت نامعتبر
2. **خطای 404**: آدرس API اشتباه
3. **خطای 500**: خطای سرور

### راه‌حل‌ها
1. بررسی Environment variables
2. بررسی توکن احراز هویت
3. بررسی آدرس سرور
4. بررسی لاگ‌های سرور

---

**نکته**: این راهنما به‌روزرسانی می‌شود. لطفاً آخرین نسخه را بررسی کنید.
