# 🧪 راهنمای تست کامل WhatsApp QR Code

## 🎯 هدف

تست کامل فرآیند WhatsApp QR Code از ورود تا اتصال

## 📋 مراحل تست

### 1. ورود کاربر
- API: `POST /api/auth/login`
- پارامترها: `email`, `password`
- پاسخ: `token`, `user.id`

### 2. ایجاد کمپین
- API: `POST /api/campaigns`
- هدر: `Authorization: Bearer {token}`
- پارامترها: `title`, `message`, `recipients`
- پاسخ: `campaign.id`

### 3. تولید QR Code
- API: `POST /api/campaigns/{campaignId}/qr-code`
- هدر: `Authorization: Bearer {token}`
- WebSocket: `ws://localhost:3000/ws/campaigns?campaignId={id}&userId={id}`

### 4. دریافت QR Code
- WebSocket Event: `qr_code`
- داده: QR Code خام یا تصویری

### 5. اسکن QR Code
- با گوشی WhatsApp اسکن کنید
- Settings > Linked Devices > Link a Device

### 6. بررسی اتصال
- API: `GET /api/campaigns/{campaignId}/connection`
- پاسخ: `isConnected`, `lastActivity`

## 🚀 اجرای تست

### روش 1: تست وب (پیشنهادی)

```bash
# 1. سرور را اجرا کنید
npm start

# 2. فایل تست را باز کنید
open public/whatsapp-qr-test.html
```

### روش 2: تست کنسول

```bash
# 1. نصب وابستگی‌ها
npm install axios ws

# 2. اجرای تست
node scripts/test-whatsapp-qr.js
```

### روش 3: تست خودکار

```bash
# Windows
scripts/run-qr-test.bat

# Linux/Mac
chmod +x scripts/run-qr-test.sh
./scripts/run-qr-test.sh
```

## 📱 تست در مرورگر

### 1. باز کردن فایل تست
```
http://localhost:3000/whatsapp-qr-test.html
```

### 2. مراحل تست
1. **ورود**: ایمیل و رمز عبور وارد کنید
2. **ایجاد کمپین**: عنوان و پیام وارد کنید
3. **تولید QR Code**: دکمه "تولید QR Code" کلیک کنید
4. **اسکن**: QR Code را با گوشی اسکن کنید
5. **بررسی**: وضعیت اتصال را بررسی کنید

### 3. بررسی نتایج
- لاگ‌ها را بررسی کنید
- وضعیت اتصال را چک کنید
- QR Code را تست کنید

## 🔧 تست API

### 1. تست ورود

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. تست ایجاد کمپین

```bash
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"تست","message":"پیام تست","recipients":[{"phone":"989123456789","name":"تست"}]}'
```

### 3. تست تولید QR Code

```bash
curl -X POST http://localhost:3000/api/campaigns/CAMPAIGN_ID/qr-code \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. تست بررسی اتصال

```bash
curl -X GET http://localhost:3000/api/campaigns/CAMPAIGN_ID/connection \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔍 عیب‌یابی

### مشکلات رایج

1. **خطای ورود**
   - بررسی ایمیل و رمز عبور
   - بررسی وجود کاربر در دیتابیس

2. **خطای ایجاد کمپین**
   - بررسی توکن معتبر
   - بررسی پارامترهای کمپین

3. **خطای QR Code**
   - بررسی WebSocket اتصال
   - بررسی Chrome/Chromium نصب

4. **خطای اتصال**
   - بررسی QR Code اسکن شده
   - بررسی وضعیت WhatsApp

### لاگ‌های مفید

```javascript
// فعال‌سازی لاگ‌های تفصیلی
console.log('📱 QR Code:', qr);
console.log('🔌 WebSocket:', socket.readyState);
console.log('📊 Status:', status);
```

## 📊 نتایج مورد انتظار

### موفق
- ✅ ورود موفق
- ✅ کمپین ایجاد شد
- ✅ QR Code تولید شد
- ✅ QR Code اسکن شد
- ✅ اتصال برقرار شد

### ناموفق
- ❌ خطای ورود
- ❌ خطای ایجاد کمپین
- ❌ خطای تولید QR Code
- ❌ QR Code اسکن نشد
- ❌ اتصال برقرار نشد

## 🎯 نکات مهم

1. **سرور باید اجرا باشد**
2. **Chrome/Chromium نصب باشد**
3. **دیتابیس متصل باشد**
4. **WebSocket فعال باشد**
5. **QR Code فوراً اسکن شود**

## 📝 گزارش تست

### اطلاعات مورد نیاز
- نسخه Node.js
- نسخه npm
- سیستم عامل
- مرورگر
- نتایج تست

### فرمت گزارش
```
تست WhatsApp QR Code
===================

تاریخ: [تاریخ]
زمان: [زمان]
نسخه: [نسخه]

نتایج:
- ورود: ✅/❌
- کمپین: ✅/❌
- QR Code: ✅/❌
- اتصال: ✅/❌

خطاها:
[لیست خطاها]

پیشنهادات:
[پیشنهادات]
```

---

**نکته**: این تست کامل فرآیند WhatsApp QR Code را پوشش می‌دهد و مشکلات احتمالی را شناسایی می‌کند.
