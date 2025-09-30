# 📮 Postman Collection Updates - Title Removal

## به‌روزرسانی فایل‌های Postman پس از حذف فیلد Title

### **📁 فایل‌های به‌روزرسانی شده:**

#### **1. WhatsApp-Campaign-API.postman_collection.json:**
- ✅ حذف `title` از request body در "Create Campaign"
- ✅ به‌روزرسانی example request body
- ✅ حذف `title` از response examples

#### **2. WhatsApp-Campaign-Environment.postman_environment.json:**
- ✅ حذف متغیر `campaign_title`
- ✅ حذف مقدار `کمپین فروش ویژه`
- ✅ به‌روزرسانی environment variables

#### **3. POSTMAN_SETUP.md:**
- ✅ حذف `campaign_title` از جدول متغیرها
- ✅ حذف `title` از response examples
- ✅ به‌روزرسانی مستندات

### **🔧 تغییرات انجام شده:**

#### **A. Collection File (WhatsApp-Campaign-API.postman_collection.json):**
```json
// قبل از تغییر:
{
  "title": "کمپین فروش ویژه",
  "message": "سلام! پیشنهاد ویژه برای شما...",
  "interval": "10s"
}

// بعد از تغییر:
{
  "message": "سلام! پیشنهاد ویژه برای شما...",
  "interval": "10s"
}
```

#### **B. Environment File (WhatsApp-Campaign-Environment.postman_environment.json):**
```json
// حذف شده:
{
  "key": "campaign_title",
  "value": "کمپین فروش ویژه",
  "enabled": true
}
```

#### **C. Setup Documentation (POSTMAN_SETUP.md):**
```markdown
// حذف شده:
| `campaign_title` | Campaign title | `کمپین فروش ویژه` |

// Response example به‌روزرسانی شده:
{
  "campaign": {
    "id": "campaign_id",
    "status": "draft",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### **📋 متغیرهای Environment باقی‌مانده:**

| متغیر | توضیح | مقدار |
|-------|-------|-------|
| `base_url` | آدرس سرور | `http://localhost:3000` |
| `access_token` | توکن دسترسی | Auto-set |
| `refresh_token` | توکن رفرش | Auto-set |
| `campaign_id` | شناسه کمپین | Auto-set |
| `package_id` | شناسه پکیج | Auto-set |
| `user_id` | شناسه کاربر | Auto-set |
| `verification_token` | توکن تایید | Auto-set |
| `otp_code` | کد OTP | `123456` |
| `phone_number` | شماره تلفن | `09120000000` |
| `email` | ایمیل | `ali@example.com` |
| `password` | رمز عبور | `Passw0rd123!` |
| `campaign_message` | پیام کمپین | `سلام! پیشنهاد ویژه...` |
| `campaign_interval` | فاصله ارسال | `10s` |
| `websocket_url` | آدرس WebSocket | `ws://localhost:3000/ws/campaigns` |

### **🧪 تست کردن تغییرات:**

#### **1. تست Collection:**
```bash
# تست ایجاد کمپین بدون title
node test-postman-campaign-without-title.js
```

#### **2. تست Postman:**
1. Import collection: `WhatsApp-Campaign-API.postman_collection.json`
2. Import environment: `WhatsApp-Campaign-Environment.postman_environment.json`
3. Run "Create Campaign" request
4. Verify no title field in request/response

### **📱 مثال‌های جدید Postman:**

#### **Create Campaign Request:**
```json
POST /api/campaigns
{
  "message": "سلام! پیشنهاد ویژه برای شما...",
  "interval": "10s"
}
```

#### **Create Campaign Response:**
```json
{
  "message": "Campaign created successfully",
  "campaign": {
    "id": "507f1f77bcf86cd799439011",
    "status": "draft"
  }
}
```

#### **Campaign Details Response:**
```json
{
  "campaign": {
    "id": "507f1f77bcf86cd799439011",
    "message": "سلام! پیشنهاد ویژه برای شما...",
    "status": "draft",
    "interval": "10s",
    "progress": {
      "total": 0,
      "sent": 0,
      "failed": 0
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### **✅ مزایای به‌روزرسانی:**

1. **سازگاری:** Postman collection با API جدید سازگار است
2. **سادگی:** درخواست‌ها ساده‌تر و سریع‌تر شدند
3. **دقت:** تمام مثال‌ها به‌روزرسانی شدند
4. **تست:** تست‌های خودکار آماده شدند

### **🎯 نتیجه:**

- ✅ Collection به‌روزرسانی شد
- ✅ Environment variables به‌روزرسانی شد
- ✅ Documentation به‌روزرسانی شد
- ✅ Test files آماده شدند
- ✅ تمام مثال‌ها بدون title کار می‌کنند

**🎉 فایل‌های Postman کاملاً به‌روزرسانی شدند!**
