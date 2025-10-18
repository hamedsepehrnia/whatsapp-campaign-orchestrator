# 🆕 ویژگی‌های جدید

این سند شامل ویژگی‌های جدید اضافه شده به سیستم مدیریت کمپین‌های واتساپ است.

## 📊 دانلود گزارش چندین کمپین

### توضیح
امکان دانلود گزارش چندین کمپین به صورت همزمان در یک فایل Excel.

### API
```http
POST /api/campaigns/reports/download-multiple
```

### پارامترهای درخواست
```json
{
  "campaignIds": ["campaign1", "campaign2", "campaign3"]
}
```

### پارامترهای Query
- `sortBy`: مرتب‌سازی کمپین‌ها (createdAt, updatedAt, title, status, totalRecipients, sentCount)
- `sortOrder`: ترتیب مرتب‌سازی (asc, desc)
- `recipientSortBy`: مرتب‌سازی مخاطبین (phone, name, status, sentAt, campaignId)
- `recipientSortOrder`: ترتیب مرتب‌سازی مخاطبین (asc, desc)

### محدودیت‌ها
- حداکثر 10 کمپین در هر درخواست
- فقط کمپین‌های متعلق به کاربر
- فقط کمپین‌های با وضعیت COMPLETED، RUNNING، یا PAUSED

### ساختار فایل Excel
1. **Campaigns Summary**: خلاصه تمام کمپین‌ها
2. **All Recipients**: تمام مخاطبین با اطلاعات کمپین
3. **Campaign Messages**: پیام‌های تمام کمپین‌ها

## 🔄 مرتب‌سازی کمپین‌ها

### توضیح
امکان مرتب‌سازی لیست کمپین‌ها بر اساس فیلدهای مختلف.

### API
```http
GET /api/campaigns
```

### پارامترهای جدید
- `sortBy`: فیلد مرتب‌سازی (createdAt, updatedAt, title, status, totalRecipients, sentCount)
- `sortOrder`: ترتیب (asc, desc)

### مثال
```http
GET /api/campaigns?sortBy=createdAt&sortOrder=desc
GET /api/campaigns?sortBy=title&sortOrder=asc
GET /api/campaigns?sortBy=totalRecipients&sortOrder=desc
```

## 👥 مدیریت مخاطبین

### API جدید برای مخاطبین
```http
GET /api/campaigns/:campaignId/recipients
```

### پارامترها
- `sortBy`: مرتب‌سازی (id, phone, name, status, sentAt)
- `sortOrder`: ترتیب (asc, desc)
- `status`: فیلتر وضعیت (PENDING, SENT, DELIVERED, FAILED)
- `page`: شماره صفحه (پیش‌فرض: 1)
- `limit`: تعداد در هر صفحه (پیش‌فرض: 50)

### مثال
```http
GET /api/campaigns/123/recipients?sortBy=phone&sortOrder=asc&status=SENT&page=1&limit=50
```

### پاسخ
```json
{
  "recipients": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  },
  "sorting": {
    "sortBy": "phone",
    "sortOrder": "asc"
  },
  "filters": {
    "status": "SENT"
  }
}
```

## 📋 مرتب‌سازی مخاطبین در جزئیات کمپین

### توضیح
امکان مرتب‌سازی مخاطبین هنگام دریافت جزئیات کمپین.

### API
```http
GET /api/campaigns/:campaignId?include=recipients
```

### پارامترهای جدید
- `recipientSortBy`: مرتب‌سازی مخاطبین (id, phone, name, status, sentAt)
- `recipientSortOrder`: ترتیب (asc, desc)

### مثال
```http
GET /api/campaigns/123?include=recipients&recipientSortBy=phone&recipientSortOrder=asc
```

## 🧪 تست کردن ویژگی‌های جدید

### اجرای تست‌ها
```bash
node tests/test-new-features.js
```

### تست‌های موجود
1. **تست دانلود چندین کمپین**: بررسی API جدید برای دانلود گزارش چندین کمپین
2. **تست مرتب‌سازی کمپین‌ها**: بررسی قابلیت‌های مرتب‌سازی مختلف
3. **تست مرتب‌سازی مخاطبین**: بررسی API جدید برای مخاطبین
4. **تست جزئیات کمپین با مرتب‌سازی**: بررسی مرتب‌سازی مخاطبین در جزئیات کمپین

## 📚 مستندات

### فایل‌های به‌روزرسانی شده
- `docs/API_DOCUMENTATION.md`: مستندات کامل API
- `postman/WhatsApp-Campaign-API-Complete.postman_collection.json`: مجموعه Postman
- `tests/test-new-features.js`: تست‌های جدید

### مثال‌های استفاده

#### دانلود گزارش چندین کمپین
```javascript
const response = await fetch('/api/campaigns/reports/download-multiple', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    campaignIds: ['campaign1', 'campaign2', 'campaign3']
  })
});
```

#### دریافت کمپین‌ها با مرتب‌سازی
```javascript
const response = await fetch('/api/campaigns?sortBy=createdAt&sortOrder=desc', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

#### دریافت مخاطبین با مرتب‌سازی
```javascript
const response = await fetch('/api/campaigns/123/recipients?sortBy=phone&sortOrder=asc&status=SENT', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

## 🔧 تنظیمات پیش‌فرض

### مرتب‌سازی کمپین‌ها
- `sortBy`: `createdAt`
- `sortOrder`: `desc`

### مرتب‌سازی مخاطبین
- `sortBy`: `id`
- `sortOrder`: `asc`

### Pagination
- `page`: `1`
- `limit`: `10` (کمپین‌ها), `50` (مخاطبین)

## ⚠️ نکات مهم

1. **محدودیت کمپین‌ها**: حداکثر 10 کمپین در هر درخواست دانلود چندگانه
2. **دسترسی**: فقط کمپین‌های متعلق به کاربر قابل دسترسی هستند
3. **وضعیت کمپین**: فقط کمپین‌های با وضعیت مناسب قابل گزارش‌گیری هستند
4. **Performance**: برای کمپین‌های بزرگ، از pagination استفاده کنید

## 🚀 آینده

ویژگی‌های پیشنهادی برای نسخه‌های آینده:
- فیلترهای پیشرفته‌تر برای مخاطبین
- Export به فرمت‌های مختلف (CSV, PDF)
- گزارش‌های آماری پیشرفته
- Dashboard با نمودارهای تعاملی
