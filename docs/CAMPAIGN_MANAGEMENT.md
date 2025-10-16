# 🎯 مدیریت کمپین‌ها

راهنمای کامل مدیریت کمپین‌های واتساپ در سیستم

## 📋 مراحل ایجاد کمپین

### مرحله 1: تعریف کمپین و متن پیام
```http
POST /api/campaigns
```

**Request Body:**
```json
{
  "message": "سلام! این یک پیام تست است.",
  "title": "کمپین تست"
}
```

**نکات مهم:**
- عنوان کمپین الزامی است
- متن پیام باید واضح و مفید باشد
- حداکثر طول پیام: 4096 کاراکتر

### مرحله 2: آپلود لیست مخاطبین

#### دانلود قالب Excel
```http
GET /api/campaigns/excel-template/download
```

#### آپلود فایل Excel
```http
POST /api/campaigns/:campaignId/recipients
```

**Content-Type:** `multipart/form-data`

**فرمت فایل Excel:**
| phone | name |
|-------|------|
| 09123456789 | علی احمدی |
| 09987654321 | فاطمه محمدی |

**نکات مهم:**
- ستون `phone` الزامی است
- ستون `name` اختیاری است
- فرمت شماره تلفن: 09xxxxxxxxx
- حداکثر 10,000 مخاطب در هر کمپین

### مرحله 3: آپلود پیوست (اختیاری)

#### آپلود فایل
```http
POST /api/campaigns/:campaignId/attachment
```

**Content-Type:** `multipart/form-data`

**فرمت‌های پشتیبانی شده:**
- تصاویر: JPG, PNG, GIF
- ویدیو: MP4, AVI
- اسناد: PDF, DOC, DOCX
- حداکثر حجم: 20MB

### مرحله 4: تنظیم فاصله ارسال

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

**گزینه‌های فاصله:**
- `5s`: 5 ثانیه بین پیام‌ها
- `10s`: 10 ثانیه بین پیام‌ها (پیش‌فرض)
- `20s`: 20 ثانیه بین پیام‌ها

### مرحله 5: اتصال WhatsApp

#### تولید QR Code
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

#### بررسی وضعیت اتصال
```http
GET /api/campaigns/:campaignId/connection
```

### مرحله 6: پیش‌نمایش و تایید

#### پیش‌نمایش کمپین
```http
GET /api/campaigns/:campaignId/preview
```

**Response:**
```json
{
  "message": "Campaign preview retrieved successfully",
  "campaign": {
    "id": 1,
    "message": "سلام! این یک پیام تست است.",
    "totalRecipients": 100,
    "interval": "10s",
    "hasAttachment": true,
    "whatsappConnected": true,
    "status": "READY"
  },
  "recipients": [
    {
      "id": 1,
      "phone": "09123456789",
      "name": "علی احمدی",
      "message": "سلام! این یک پیام تست است.",
      "attachment": {
        "filename": "image.jpg",
        "size": 1024000,
        "type": "image/jpeg"
      }
    }
  ]
}
```

#### تایید و شروع کمپین
```http
POST /api/campaigns/:campaignId/confirm-and-start
```

## 🎮 کنترل کمپین

### شروع کمپین
```http
POST /api/campaigns/:campaignId/start
```

### توقف کمپین
```http
POST /api/campaigns/:campaignId/pause
```

### ادامه کمپین
```http
POST /api/campaigns/:campaignId/resume
```

### حذف کمپین
```http
DELETE /api/campaigns/:campaignId
```

## 📊 نظارت بر کمپین

### وضعیت مراحل کمپین
```http
GET /api/campaigns/:campaignId/steps
```

**Response:**
```json
{
  "campaign": {
    "id": 1,
    "status": "RUNNING",
    "currentStep": 7,
    "totalSteps": 8
  },
  "steps": {
    "step1": {
      "name": "تعریف کمپین و متن پیام",
      "completed": true
    },
    "step2": {
      "name": "دانلود فایل نمونه اکسل",
      "completed": true
    },
    "step3": {
      "name": "آپلود فایل اکسل",
      "completed": true
    },
    "step4": {
      "name": "افزودن فایل ضمیمه",
      "completed": true
    },
    "step5": {
      "name": "تنظیمات وقفه ارسال",
      "completed": true
    },
    "step6": {
      "name": "اتصال حساب WhatsApp",
      "completed": true
    },
    "step7": {
      "name": "ارسال پیام‌ها",
      "completed": true
    },
    "step8": {
      "name": "گزارش نهایی",
      "completed": false
    }
  }
}
```

### پیشرفت کمپین
```http
GET /api/campaigns/:campaignId/progress
```

**Response:**
```json
{
  "campaign": {
    "id": 1,
    "status": "RUNNING",
    "progress": {
      "total": 100,
      "sent": 45,
      "failed": 2,
      "delivered": 43
    },
    "startedAt": "2024-01-01T10:00:00Z",
    "completedAt": null
  }
}
```

## 📈 گزارش‌گیری

### گزارش کمپین
```http
GET /api/campaigns/:campaignId/report
```

**Response:**
```json
{
  "message": "Report generated successfully",
  "report": {
    "campaignId": 1,
    "title": "کمپین تست",
    "status": "COMPLETED",
    "totalMessages": 100,
    "successfulMessages": 95,
    "failedMessages": 5,
    "deliveredMessages": 90,
    "remainingMessages": 0,
    "deliveryRate": 95.0,
    "startedAt": "2024-01-01T10:00:00Z",
    "completedAt": "2024-01-01T10:30:00Z",
    "duration": 1800000,
    "isCompleted": true,
    "errors": [
      {
        "phone": "09111111111",
        "error": "Invalid phone number"
      }
    ]
  }
}
```

### دانلود گزارش Excel
```http
GET /api/campaigns/:campaignId/report/download
```

**Response:** فایل Excel با سه برگه:
1. **Campaign Summary**: خلاصه کمپین
2. **Recipients Details**: جزئیات مخاطبین
3. **Campaign Message**: متن کمپین

## 🔍 جستجو و فیلتر

### جستجوی کمپین‌ها
```http
GET /api/campaigns/search
```

**Query Parameters:**
- `query`: جستجو در عنوان و متن
- `status`: فیلتر بر اساس وضعیت
- `title`: فیلتر بر اساس عنوان
- `startDate`: تاریخ شروع
- `endDate`: تاریخ پایان
- `sortBy`: مرتب‌سازی (createdAt, title, status)
- `sortOrder`: ترتیب (asc, desc)
- `page`: شماره صفحه
- `limit`: تعداد در هر صفحه

### کمپین‌های زمان‌بندی شده
```http
GET /api/campaigns/scheduled
```

### لغو کمپین زمان‌بندی شده
```http
POST /api/campaigns/:campaignId/cancel-schedule
```

## 🔧 مدیریت فایل‌ها

### آپلود فایل موقت
```http
POST /api/campaigns/:campaignId/attachment/temp
```

### تایید فایل موقت
```http
POST /api/campaigns/:campaignId/attachment/confirm
```

**Request Body:**
```json
{
  "tempFilename": "temp-file-name",
  "originalName": "original-file-name",
  "mimetype": "image/jpeg"
}
```

### حذف فایل موقت
```http
POST /api/campaigns/cleanup-temp
```

### دریافت جزئیات پیوست
```http
GET /api/campaigns/:campaignId/attachment
```

## 🔄 مدیریت مراحل

### رفتن به مرحله خاص
```http
POST /api/campaigns/:campaignId/navigate
```

**Request Body:**
```json
{
  "step": 3
}
```

### بازگشت به مرحله قبل
```http
POST /api/campaigns/:campaignId/go-back
```

### بازنشانی به مرحله خاص
```http
POST /api/campaigns/:campaignId/reset
```

**Request Body:**
```json
{
  "step": 2
}
```

## 🔌 WebSocket Events

### اتصال WebSocket
```javascript
const socket = new WebSocket('ws://localhost:3000/ws/campaigns?campaignId=1&userId=1');
```

### رویدادهای کمپین
```javascript
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'campaign_update':
      // به‌روزرسانی وضعیت کمپین
      break;
    case 'progress_update':
      // به‌روزرسانی پیشرفت
      break;
    case 'status_update':
      // به‌روزرسانی وضعیت
      break;
    case 'error_update':
      // به‌روزرسانی خطا
      break;
    case 'qr_code':
      // دریافت QR Code
      break;
    case 'completion_update':
      // تکمیل کمپین
      break;
  }
};
```

## ⚠️ محدودیت‌ها و نکات مهم

### محدودیت‌های کمپین
- حداکثر 10,000 مخاطب در هر کمپین
- حداکثر 20MB برای فایل پیوست
- حداقل 5 ثانیه فاصله بین پیام‌ها
- حداکثر 4096 کاراکتر برای متن پیام

### نکات امنیتی
- فایل‌های خطرناک مسدود می‌شوند
- شماره تلفن‌ها اعتبارسنجی می‌شوند
- دسترسی به کمپین‌ها بر اساس مالکیت کنترل می‌شود

### بهترین شیوه‌ها
- از فایل‌های Excel استاندارد استفاده کنید
- فاصله مناسب بین پیام‌ها تنظیم کنید
- قبل از شروع کمپین، پیش‌نمایش را بررسی کنید
- گزارش‌های کمپین را ذخیره کنید

---

**نکته**: این راهنما به‌روزرسانی می‌شود. لطفاً آخرین نسخه را بررسی کنید.
