# 🔑 Token Expiry Configuration Update

## 📅 **تغییرات انجام شده:**

### **✅ JWT Access Token:**
- **قبل**: 24 ساعت (1 روز)
- **بعد**: 30 روز
- **فایل**: `src/controllers/userController.js` و `src/controllers/authController.js`

### **✅ Refresh Token:**
- **قبل**: 30 روز
- **بعد**: 60 روز
- **فایل**: `src/controllers/authController.js`

### **✅ OTP Token:**
- **مدت اعتبار**: 5 دقیقه (بدون تغییر)
- **تعداد تلاش**: 5 بار (بدون تغییر)

---

## 🔄 **نحوه کار Token ها:**

### **سناریو 1: 0-30 روز**
- کاربر می‌تواند از API ها استفاده کند
- نیازی به refresh token نیست
- JWT token معتبر است

### **سناریو 2: 30-60 روز**
- JWT token منقضی می‌شود
- کاربر باید از refresh token استفاده کند:
```javascript
POST /api/refresh/refresh
{
  "refreshToken": "refresh_token_string"
}
```

### **سناریو 3: بعد از 60 روز**
- هم JWT و هم refresh token منقضی می‌شوند
- کاربر باید دوباره login کند

---

## 📱 **برای WhatsApp Campaign:**

### **مزایای تغییر:**
- **کمپین‌های طولانی**: کاربران می‌توانند کمپین‌های چند روزه اجرا کنند
- **تجربه بهتر**: کمتر نیاز به login مجدد
- **پایداری**: اتصال WhatsApp برای مدت طولانی‌تر حفظ می‌شود

### **مثال استفاده:**
```javascript
// کاربر می‌تواند 30 روز بدون login مجدد از API ها استفاده کند
const response = await fetch('/api/campaigns', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// بعد از 30 روز، از refresh token استفاده کنید
const refreshResponse = await fetch('/api/refresh/refresh', {
  method: 'POST',
  body: JSON.stringify({ refreshToken })
});
```

---

## ⚙️ **فایل‌های تغییر یافته:**

### **1. src/controllers/userController.js**
```javascript
// قبل
{ expiresIn: "1d" }

// بعد
{ expiresIn: "30d" }
```

### **2. src/controllers/authController.js**
```javascript
// قبل
{ expiresIn: '15m' } // 15 دقیقه

// بعد
{ expiresIn: '30d' } // 30 روز

// قبل
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 روز

// بعد
const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 روز
```

---

## 🧪 **تست تغییرات:**

### **1. تست JWT Token:**
```bash
node test-token-expiry.js
```

### **2. تست Login:**
```javascript
POST /api/user/login
{
  "email": "user@example.com",
  "password": "password"
}
```

### **3. تست Refresh Token:**
```javascript
POST /api/refresh/refresh
{
  "refreshToken": "refresh_token_string"
}
```

---

## 📊 **خلاصه تغییرات:**

| Token Type | قبل | بعد | فایل |
|------------|-----|-----|------|
| **JWT Access Token** | 24 ساعت | 30 روز | userController.js, authController.js |
| **Refresh Token** | 30 روز | 60 روز | authController.js |
| **OTP Token** | 5 دقیقه | 5 دقیقه | بدون تغییر |
| **Verification Token** | 5 دقیقه | 5 دقیقه | بدون تغییر |

---

## 🎯 **نتیجه:**

**حالا کاربران می‌توانند 30 روز بدون login مجدد از سیستم استفاده کنند!**

- ✅ **JWT Token**: 30 روز
- ✅ **Refresh Token**: 60 روز
- ✅ **WhatsApp Campaign**: پشتیبانی از کمپین‌های طولانی
- ✅ **User Experience**: تجربه بهتر کاربری
- ✅ **Security**: امنیت حفظ شده

**🚀 تغییرات اعمال شد و سیستم آماده استفاده است!**
