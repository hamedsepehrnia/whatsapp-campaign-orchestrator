# 📱 Campaign 7-Steps Implementation

## پیاده‌سازی کامل فرآیند 7 مرحله‌ای کمپین

### **🎯 مراحل کمپین:**

#### **مرحله 1: تعریف کمپین و متن پیام**
- ✅ **API:** `POST /api/campaigns`
- ✅ **وضعیت:** `draft`
- ✅ **فیلدها:** `message` (اجباری)

#### **مرحله 2: آپلود فایل اکسل**
- ✅ **API:** `POST /api/campaigns/:campaignId/recipients`
- ✅ **وضعیت:** `ready`
- ✅ **فیلدها:** `recipientsFile` (Excel file)

#### **مرحله 3: افزودن فایل ضمیمه (اختیاری)**
- ✅ **API:** `POST /api/campaigns/:campaignId/attachment`
- ✅ **وضعیت:** `ready`
- ✅ **فیلدها:** `attachment` (image, PDF, etc.)

#### **مرحله 4: تنظیمات وقفه ارسال**
- ✅ **API:** `PUT /api/campaigns/:campaignId/interval`
- ✅ **وضعیت:** `ready`
- ✅ **فیلدها:** `interval` (5s, 10s, 20s)

#### **مرحله 5: اتصال حساب WhatsApp**
- ✅ **API:** `POST /api/campaigns/:campaignId/qr-code`
- ✅ **API:** `GET /api/campaigns/:campaignId/connection`
- ✅ **وضعیت:** `ready`
- ✅ **فیلدها:** `whatsappSession.isConnected`

#### **مرحله 6: ارسال پیام‌ها**
- ✅ **API:** `POST /api/campaigns/:campaignId/start`
- ✅ **API:** `GET /api/campaigns/:campaignId/progress`
- ✅ **وضعیت:** `running`
- ✅ **فیلدها:** `progress` (real-time updates)

#### **مرحله 7: گزارش نهایی**
- ✅ **API:** `GET /api/campaigns/:campaignId/report`
- ✅ **API:** `GET /api/campaigns/:campaignId/report/download`
- ✅ **وضعیت:** `completed`
- ✅ **فیلدها:** `report` (final statistics)

---

## 🔧 API Endpoints:

### **Step Status Tracking:**
```bash
GET /api/campaigns/:campaignId/steps
```

**Response:**
```json
{
  "campaign": {
    "id": "campaign_id",
    "status": "draft",
    "currentStep": 1,
    "stepStatus": {
      "step1": { "completed": true, "title": "تعریف کمپین و متن پیام" },
      "step2": { "completed": false, "title": "آپلود فایل اکسل" },
      "step3": { "completed": false, "title": "افزودن فایل ضمیمه" },
      "step4": { "completed": false, "title": "تنظیمات وقفه ارسال" },
      "step5": { "completed": false, "title": "اتصال حساب WhatsApp" },
      "step6": { "completed": false, "title": "ارسال پیام‌ها" },
      "step7": { "completed": false, "title": "گزارش نهایی" }
    },
    "message": "سلام! پیشنهاد ویژه برای شما...",
    "interval": "10s",
    "recipientsCount": 0,
    "hasAttachment": false,
    "whatsappConnected": false
  }
}
```

---

## 📊 وضعیت‌های کمپین:

| وضعیت | توضیح | مرحله | API |
|-------|-------|--------|-----|
| `draft` | کمپین ایجاد شده | 1 | `POST /api/campaigns` |
| `ready` | گیرندگان آپلود شدند | 2 | `POST /api/campaigns/:id/recipients` |
| `ready` | ضمیمه آپلود شد | 3 | `POST /api/campaigns/:id/attachment` |
| `ready` | وقفه تنظیم شد | 4 | `PUT /api/campaigns/:id/interval` |
| `ready` | WhatsApp متصل شد | 5 | `POST /api/campaigns/:id/qr-code` |
| `running` | در حال ارسال | 6 | `POST /api/campaigns/:id/start` |
| `completed` | تکمیل شده | 7 | `GET /api/campaigns/:id/report` |

---

## 🎮 UI Flow Implementation:

### **صفحه 1: تعریف کمپین**
```javascript
// API Call
POST /api/campaigns
{
  "message": "سلام! پیشنهاد ویژه برای شما..."
}

// UI Elements
- Textarea for message
- Button: "ادامه"
```

### **صفحه 2: آپلود گیرندگان**
```javascript
// API Call
POST /api/campaigns/:campaignId/recipients
// multipart/form-data with Excel file

// UI Elements
- File upload for Excel
- Preview of recipients
- Button: "ادامه"
```

### **صفحه 3: ضمیمه (اختیاری)**
```javascript
// API Call
POST /api/campaigns/:campaignId/attachment
// multipart/form-data with file

// UI Elements
- File upload for attachment
- Button: "ادامه" or "رد کردن"
```

### **صفحه 4: تنظیم وقفه**
```javascript
// API Call
PUT /api/campaigns/:campaignId/interval
{
  "interval": "10s"
}

// UI Elements
- Radio buttons: 5s, 10s, 20s
- Button: "ادامه"
```

### **صفحه 5: اتصال WhatsApp**
```javascript
// API Call
POST /api/campaigns/:campaignId/qr-code
GET /api/campaigns/:campaignId/connection

// UI Elements
- QR Code display
- Connection status
- Button: "بررسی اتصال"
```

### **صفحه 6: ارسال**
```javascript
// API Call
POST /api/campaigns/:campaignId/start
GET /api/campaigns/:campaignId/progress

// UI Elements
- Progress bar
- Real-time statistics
- Button: "توقف" (optional)
```

### **صفحه 7: گزارش**
```javascript
// API Call
GET /api/campaigns/:campaignId/report
GET /api/campaigns/:campaignId/report/download

// UI Elements
- Final statistics
- Download report button
- Button: "کمپین جدید"
```

---

## 🔄 WebSocket Events:

### **مرحله 5: QR Code**
```json
{
  "type": "qr_code",
  "campaignId": "campaign_id",
  "qrCode": "data:image/png;base64,..."
}
```

### **مرحله 6: پیشرفت**
```json
{
  "type": "progress",
  "campaignId": "campaign_id",
  "data": {
    "sent": 45,
    "total": 150,
    "current": "09120000000"
  }
}
```

### **مرحله 7: تکمیل**
```json
{
  "type": "completion",
  "campaignId": "campaign_id",
  "data": {
    "status": "completed",
    "totalSent": 148,
    "totalFailed": 2
  }
}
```

---

## 🧪 تست کردن:

```bash
# تست فرآیند 7 مرحله‌ای
node test-campaign-7-steps-flow.js

# تست step status
curl -X GET http://localhost:3000/api/campaigns/CAMPAIGN_ID/steps \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ مزایای این پیاده‌سازی:

1. **منطقی:** هر مرحله وابسته به مرحله قبل است
2. **کاربرپسند:** UI ساده و قابل فهم
3. **انعطاف:** امکان بازگشت به مراحل قبل
4. **کنترل:** کاربر کنترل کامل دارد
5. **شفاف:** وضعیت کمپین همیشه مشخص است
6. **Real-time:** پیشرفت live نمایش داده می‌شود
7. **گزارش:** آمار کامل و دقیق

---

## 🎯 نتیجه:

فرآیند 7 مرحله‌ای کاملاً پیاده‌سازی شده و آماده استفاده است!
