# 🔧 رفع مشکل "Failed to fetch" در ورود

## 🎯 مشکل

خطای "Failed to fetch" در هنگام ورود به دلیل مسیر نادرست API.

## ❌ مسیر اشتباه

```javascript
// اشتباه
POST /api/auth/login
```

## ✅ مسیر صحیح

```javascript
// درست
POST /api/user/login
```

## 🔧 تغییرات انجام شده

### 1. فایل `public/whatsapp-qr-test.html`
```javascript
// قبل از تغییر
const response = await fetch('/api/auth/login', {

// بعد از تغییر
const response = await fetch('/api/user/login', {
```

### 2. فایل `scripts/quick-login-test.js`
```javascript
// قبل از تغییر
const response = await axios.post('http://localhost:3000/api/auth/login', {

// بعد از تغییر
const response = await axios.post('http://localhost:3000/api/user/login', {
```

### 3. فایل `scripts/test-whatsapp-qr.js`
```javascript
// قبل از تغییر
const response = await axios.post(`${this.baseURL}/api/auth/login`, {

// بعد از تغییر
const response = await axios.post(`${this.baseURL}/api/user/login`, {
```

## 📋 مسیرهای صحیح API

### احراز هویت
- `POST /api/user/login` - ورود
- `POST /api/user/register` - ثبت‌نام
- `POST /api/user/register-simple` - ثبت‌نام ساده

### OTP
- `POST /api/auth/request-otp` - درخواست OTP
- `POST /api/auth/verify-otp` - تایید OTP

### کمپین‌ها
- `POST /api/campaigns` - ایجاد کمپین
- `POST /api/campaigns/{id}/qr-code` - تولید QR Code
- `GET /api/campaigns/{id}/connection` - بررسی اتصال

## 🚀 تست موفق

### نتایج تست
```
🔐 تست ورود با اطلاعات پیش‌فرض...
✅ ورود موفق!
📊 اطلاعات کاربر:
   - ID: 4
   - Email: ali@example.com
   - Role: undefined
   - Token: eyJhbGciOiJIUzI1NiIs...

🎉 تست ورود موفق بود!
```

## 📱 نحوه تست

### 1. تست وب
```
http://localhost:3000/whatsapp-qr-test.html
```

### 2. تست کنسول
```bash
node scripts/quick-login-test.js
```

### 3. تست کامل
```bash
node scripts/test-whatsapp-qr.js
```

## 🔍 عیب‌یابی

### مشکلات رایج
1. **مسیر نادرست**: استفاده از `/api/auth/login` به جای `/api/user/login`
2. **سرور اجرا نشده**: بررسی `npm start`
3. **کاربر وجود ندارد**: بررسی دیتابیس

### بررسی مسیرها
```bash
# تست مسیر صحیح
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ali@example.com","password":"password123"}'
```

## ✅ نتیجه

مشکل "Failed to fetch" حل شد و ورود با موفقیت کار می‌کند.

---

**نکته**: همیشه مسیرهای API را از مستندات بررسی کنید.
