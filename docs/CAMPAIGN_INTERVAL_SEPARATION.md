# ⏱️ Campaign Interval Separation

## جداسازی فیلد Interval از مرحله اول ایجاد کمپین

### **📋 تغییرات انجام شده:**

#### **1. 🗃️ مدل Campaign:**
- ✅ فیلد `interval` دوباره اضافه شد
- ✅ Default value: `10s`
- ✅ Valid values: `['5s', '10s', '20s']`

#### **2. 🎮 کنترلر Campaign:**
- ✅ حذف `interval` از `createCampaign`
- ✅ اضافه کردن `setCampaignInterval` function
- ✅ Validation برای interval values
- ✅ حذف `interval` از campaign details response

#### **3. 🛣️ Routes:**
- ✅ اضافه کردن `PUT /api/campaigns/:campaignId/interval`
- ✅ Import `setCampaignInterval` function

#### **4. 📚 مستندات API:**
- ✅ حذف `interval` از create campaign request
- ✅ اضافه کردن endpoint جدید برای set interval
- ✅ به‌روزرسانی examples

#### **5. 📮 Postman Collection:**
- ✅ حذف `interval` از create campaign request
- ✅ حذف `campaign_interval` از environment variables
- ✅ به‌روزرسانی documentation

### **🔧 فیلدهای Campaign:**

```javascript
{
  user: ObjectId,           // کاربر صاحب کمپین
  message: String,          // متن پیام (اجباری)
  recipients: Array,       // لیست گیرندگان
  attachment: Object,      // فایل ضمیمه
  interval: String,         // فاصله ارسال (5s, 10s, 20s) - جداگانه تنظیم می‌شود
  status: String,          // وضعیت کمپین
  whatsappSession: Object,  // اطلاعات اتصال WhatsApp
  progress: Object,        // پیشرفت ارسال
  startedAt: Date,         // زمان شروع
  completedAt: Date,       // زمان تکمیل
  report: Object          // گزارش نهایی
}
```

### **📝 مثال‌های جدید API:**

#### **1. ایجاد کمپین (فقط پیام):**
```json
POST /api/campaigns
{
  "message": "سلام! پیشنهاد ویژه برای شما..."
}
```

#### **2. تنظیم فاصله ارسال:**
```json
PUT /api/campaigns/:campaignId/interval
{
  "interval": "10s"
}
```

#### **3. پاسخ تنظیم فاصله:**
```json
{
  "message": "Campaign interval updated successfully",
  "campaign": {
    "id": "507f1f77bcf86cd799439011",
    "interval": "10s",
    "status": "draft"
  }
}
```

### **🎯 فاصله‌های معتبر:**

| مقدار | توضیح | مدت زمان |
|-------|-------|----------|
| `5s` | 5 ثانیه | 5 seconds |
| `10s` | 10 ثانیه | 10 seconds |
| `20s` | 20 ثانیه | 20 seconds |

### **📱 فرآیند جدید ایجاد کمپین:**

#### **مرحله 1: ایجاد کمپین**
```bash
POST /api/campaigns
{
  "message": "سلام! پیشنهاد ویژه برای شما..."
}
```

#### **مرحله 2: تنظیم فاصله ارسال**
```bash
PUT /api/campaigns/:campaignId/interval
{
  "interval": "10s"
}
```

#### **مرحله 3: آپلود گیرندگان**
```bash
POST /api/campaigns/:campaignId/recipients
# multipart/form-data with Excel file
```

#### **مرحله 4: آپلود ضمیمه (اختیاری)**
```bash
POST /api/campaigns/:campaignId/attachment
# multipart/form-data with file
```

#### **مرحله 5: تولید QR کد**
```bash
POST /api/campaigns/:campaignId/qr-code
```

#### **مرحله 6: شروع کمپین**
```bash
POST /api/campaigns/:campaignId/start
```

### **✅ مزایای جداسازی Interval:**

1. **سادگی:** مرحله اول فقط پیام می‌گیرد
2. **انعطاف:** کاربر می‌تواند فاصله را بعداً تغییر دهد
3. **UI بهتر:** فرآیند مرحله‌ای و منطقی
4. **کنترل:** امکان تغییر فاصله قبل از شروع

### **🧪 تست کردن تغییرات:**

```bash
# تست جداسازی interval
node test-campaign-interval-separation.js

# تست API endpoints
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message":"سلام!"}'

curl -X PUT http://localhost:3000/api/campaigns/CAMPAIGN_ID/interval \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"interval":"10s"}'
```

### **📁 فایل‌های تغییر یافته:**

1. **`src/models/Campaign.js`** - اضافه کردن interval field
2. **`src/controllers/campaignController.js`** - حذف interval از create، اضافه کردن setInterval
3. **`src/routes/campaignRoutes.js`** - اضافه کردن PUT route
4. **`API_DOCUMENTATION.md`** - به‌روزرسانی مستندات
5. **`WhatsApp-Campaign-API.postman_collection.json`** - حذف interval از create
6. **`WhatsApp-Campaign-Environment.postman_environment.json`** - حذف campaign_interval
7. **`POSTMAN_SETUP.md`** - به‌روزرسانی documentation

### **📁 فایل‌های جدید ایجاد شده:**

1. **`test-campaign-interval-separation.js`** - تست جداسازی interval
2. **`CAMPAIGN_INTERVAL_SEPARATION.md`** - این مستندات

### **🎯 نتیجه:**

- ✅ فیلد `interval` از مرحله اول حذف شد
- ✅ Endpoint جدید برای تنظیم interval اضافه شد
- ✅ Validation برای interval values اضافه شد
- ✅ فرآیند مرحله‌ای و منطقی شد
- ✅ UI می‌تواند فاصله را در مراحل بعدی تنظیم کند

**🎉 کمپین‌ها حالا با فرآیند مرحله‌ای و منطقی‌تر ایجاد می‌شوند!**
