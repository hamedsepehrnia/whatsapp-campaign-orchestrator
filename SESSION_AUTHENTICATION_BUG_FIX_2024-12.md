# 🔧 Session Authentication Bug Fix - December 2024

## 📋 **مشکل گزارش شده:**

### **🎯 مشکل اصلی:**
فرانت کار (Moein) گزارش داد که پس از دریافت فایل‌های جدید بک‌اند:

1. **توکن منقضی شده** و مجبور به لاگین مجدد شده بود
2. با **حذف هدر Authorization**، خطای زیر دریافت می‌کرد:
   ```json
   {
       "message": "Authorization token missing",
       "hint": "Provide token in Authorization header or ensure user is logged in via session"
   }
   ```

### **🔍 علت مشکل:**
- تمام route های محافظت شده از `authenticateJwt` استفاده می‌کردند
- `authenticateJwt` فقط توکن را از **Authorization header** می‌خواند
- **Session cookie** نادیده گرفته می‌شد
- فرانت کار مجبور بود برای هر درخواست هدر Authorization ارسال کند

---

## ✅ **راه‌حل پیاده‌سازی شده:**

### **1. 🔄 تغییر Middleware در تمام Route ها:**

#### **فایل‌های تغییر یافته:**
- ✅ `src/routes/campaignRoutes.js`
- ✅ `src/routes/orderRoutes.js`
- ✅ `src/routes/packageRoutes.js`
- ✅ `src/routes/paymentRoutes.js`
- ✅ `src/routes/adminRoutes.js`
- ✅ `src/routes/refreshRoutes.js`

#### **تغییر انجام شده:**
```javascript
// ❌ قبل (مشکل)
const { authenticateJwt } = require('../middlewares/auth');
router.use(authenticateJwt);

// ✅ بعد (تصحیح)
const { authenticateSession } = require('../middlewares/auth');
router.use(authenticateSession);
```

### **2. 🛠️ بهبود Middleware `authenticateSession`:**

#### **قابلیت‌های جدید:**
- ✅ **خواندن توکن از session:** `req.session.token` و `req.session.jwt`
- ✅ **Fallback به Authorization header:** در صورت عدم وجود session
- ✅ **مدیریت خطای Database:** در صورت عدم دسترسی به MongoDB
- ✅ **ذخیره اطلاعات کاربر در session:** برای درخواست‌های بعدی

#### **نحوه کارکرد:**
```javascript
// 1. ابتدا session را بررسی می‌کند
if (req.session && req.session.userId) {
    const user = await User.findById(req.session.userId);
    if (user) {
        req.user = user;
        return next(); // ✅ کاربر شناسایی شد
    }
}

// 2. سپس توکن را از session می‌خواند
const token = extractToken(req); // از session یا header
```

### **3. 🔍 بهبود `extractToken`:**

#### **قبل (مشکل):**
```javascript
const extractToken = (req) => {
    // فقط Authorization header را می‌خواند
    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }
    // session نادیده گرفته می‌شد!
    return null;
};
```

#### **بعد (تصحیح):**
```javascript
const extractToken = (req) => {
    // 1. ابتدا Authorization header
    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }
    
    // 2. سپس session cookie
    if (req.session && req.session.token) {
        return req.session.token; // ✅ حالا خوانده می‌شود
    }
    
    if (req.session && req.session.jwt) {
        return req.session.jwt; // ✅ حالا خوانده می‌شود
    }
    
    return null;
};
```

---

## 🎯 **Route های پشتیبانی شده:**

### **📱 Campaign Routes:**
- ✅ `GET /api/campaigns` - لیست کمپین‌ها
- ✅ `POST /api/campaigns` - ایجاد کمپین
- ✅ `PUT /api/campaigns/:id/message` - تنظیم پیام
- ✅ `POST /api/campaigns/:id/recipients` - آپلود Excel
- ✅ `POST /api/campaigns/:id/attachment` - آپلود ضمیمه
- ✅ `PUT /api/campaigns/:id/interval` - تنظیم فاصله
- ✅ `POST /api/campaigns/:id/whatsapp/connect` - اتصال WhatsApp
- ✅ `GET /api/campaigns/:id/preview` - پیش‌نمایش
- ✅ `POST /api/campaigns/:id/confirm-and-start` - تایید و شروع

### **📦 Order Routes:**
- ✅ `POST /api/orders` - ایجاد سفارش
- ✅ `GET /api/orders/me` - سفارشات من

### **📋 Package Routes:**
- ✅ `POST /api/packages` - ایجاد پکیج (Admin)
- ✅ `PUT /api/packages/:id` - ویرایش پکیج (Admin)
- ✅ `DELETE /api/packages/:id` - حذف پکیج (Admin)

### **💳 Payment Routes:**
- ✅ `POST /api/payments/start` - شروع پرداخت
- ✅ `POST /api/payments/confirm` - تایید پرداخت

### **👑 Admin Routes:**
- ✅ `GET /api/admin/users` - لیست کاربران
- ✅ `PATCH /api/admin/users/:id/role` - تغییر نقش کاربر
- ✅ `PATCH /api/admin/users/:id/status` - تغییر وضعیت کاربر

### **🔄 Refresh Routes:**
- ✅ `POST /api/refresh/logout-all` - خروج از همه دستگاه‌ها

---

## 🎯 **نحوه استفاده برای فرانت کار:**

### **1. 🔐 لاگین (بدون تغییر):**
```javascript
// لاگین عادی - توکن در session ذخیره می‌شود
const response = await fetch('/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // مهم: برای session
    body: JSON.stringify({
        email: 'user@example.com',
        password: 'password123'
    })
});
```

### **2. 📡 درخواست‌های محافظت شده (بدون هدر Authorization):**
```javascript
// نیازی به هدر Authorization نیست!
const response = await fetch('/api/campaigns', {
    method: 'GET',
    credentials: 'include' // مهم: برای session
});

// یا برای POST requests
const response = await fetch('/api/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // مهم: برای session
    body: JSON.stringify({
        message: 'سلام'
    })
});
```

### **3. 🔄 Fallback به Authorization Header:**
```javascript
// اگر session کار نکرد، می‌توانید از Authorization header استفاده کنید
const response = await fetch('/api/campaigns', {
    method: 'GET',
    headers: {
        'Authorization': 'Bearer your-jwt-token'
    },
    credentials: 'include'
});
```

---

## 🎯 **مزایای جدید:**

### **1. 🚀 راحتی استفاده:**
- ✅ **بدون هدر Authorization:** نیازی به مدیریت دستی توکن نیست
- ✅ **Session خودکار:** توکن در session ذخیره می‌شود
- ✅ **Fallback هوشمند:** در صورت عدم وجود session، از header استفاده می‌کند

### **2. 🔒 امنیت:**
- ✅ **Session-based:** توکن در کوکی httpOnly ذخیره می‌شود
- ✅ **JWT validation:** توکن همچنان اعتبارسنجی می‌شود
- ✅ **Database fallback:** در صورت عدم دسترسی به DB، از session استفاده می‌کند

### **3. 🛠️ سازگاری:**
- ✅ **Backward compatible:** API های قدیمی همچنان کار می‌کنند
- ✅ **Header support:** همچنان از Authorization header پشتیبانی می‌کند
- ✅ **Session support:** از session cookie پشتیبانی می‌کند

---

## 📝 **آپدیت فایل‌های مستندات:**

### **1. 📚 API Documentation:**
- ✅ **آپدیت `docs/API_DOCUMENTATION.md`**
- ✅ **اضافه کردن بخش Session-Based Authentication**
- ✅ **نمونه کدهای فرانت کار**
- ✅ **مقایسه روش‌های احراز هویت**

### **2. 📮 Postman Collection:**
- ✅ **آپدیت `postman/WhatsApp-Campaign-API.postman_collection.json`**
- ✅ **اضافه کردن request های Session-Based**
- ✅ **اضافه کردن تست‌های احراز هویت**
- ✅ **نمونه‌های استفاده**

---

## 🧪 **تست شده:**

### **✅ Session Authentication:**
- ✅ لاگین و دریافت session cookie
- ✅ دسترسی به route های محافظت شده با session
- ✅ Fallback به Authorization header
- ✅ مدیریت خطای Database

### **✅ Route Coverage:**
- ✅ تمام Campaign routes
- ✅ تمام Order routes  
- ✅ تمام Package routes
- ✅ تمام Payment routes
- ✅ تمام Admin routes
- ✅ تمام Refresh routes

---

## 📝 **نکات مهم برای فرانت کار:**

### **1. 🔑 همیشه `credentials: 'include'` استفاده کنید:**
```javascript
// ✅ درست
fetch('/api/campaigns', {
    credentials: 'include'
});

// ❌ اشتباه
fetch('/api/campaigns');
```

### **2. 🍪 Session Cookie:**
- Session cookie به صورت خودکار در مرورگر ذخیره می‌شود
- نیازی به مدیریت دستی کوکی نیست
- کوکی `httpOnly` است و از JavaScript قابل دسترسی نیست

### **3. 🔄 Fallback Strategy:**
- ابتدا session بررسی می‌شود
- در صورت عدم وجود session، از Authorization header استفاده می‌شود
- در صورت خطای Database، از session data استفاده می‌شود

---

## 🎯 **خلاصه:**

### **🔍 مشکل حل شده:**
- ✅ **Session authentication** به عنوان روش اصلی پیاده‌سازی شد
- ✅ **Fallback** به Authorization header در صورت نیاز
- ✅ **تمام route ها** از session authentication پشتیبانی می‌کنند
- ✅ **مستندات و Postman** آپدیت شدند

### **🚀 نتیجه:**
**فرانت کار حالا می‌تواند:**
1. **بدون هدر Authorization** درخواست بفرستد
2. **Session cookie** به صورت خودکار مدیریت می‌شود  
3. **Fallback** به Authorization header در صورت نیاز
4. **تمام API ها** از session authentication پشتیبانی می‌کنند

**دیگر نیازی به مدیریت دستی توکن نیست!** ✨

---

## 📅 **تاریخ حل:**
**December 2024** - Session Authentication Bug Fix

**وضعیت:** ✅ **حل شده و تست شده**
