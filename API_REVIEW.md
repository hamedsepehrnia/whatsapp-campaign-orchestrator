# 🔍 بررسی و تحلیل API های پروژه

## 📊 خلاصه

**تعداد کل Endpoint ها:** 64  
**Endpoint های تکراری:** 4  
**Endpoint های اضافی/غیرضروری:** 6  
**Endpoint های نیازمند بازبینی:** 3

---

## ❌ API های تکراری (Duplicate Endpoints)

### 1. **Logout - 3 نسخه مختلف!**

#### 🔴 مشکل: 3 endpoint مختلف برای logout

1. **`POST /api/user/logout`** (userRoutes.js:41)
   - استفاده از `isAuthenticated` middleware
   - فقط session را پاک می‌کند
   - **Controller:** `userController.logoutUser`

2. **`POST /api/refresh/logout`** (refreshRoutes.js:11)
   - استفاده از `authenticateSession` middleware
   - Refresh token را revoke می‌کند
   - **Controller:** `authController.logout`

3. **`POST /api/refresh/logout-all`** (refreshRoutes.js:14)
   - همه refresh token های کاربر را revoke می‌کند
   - **Controller:** `authController.logoutAll`

**💡 پیشنهاد:**
- حذف `/api/user/logout` (قدیمی و فقط session-based)
- نگه داشتن `/api/refresh/logout` (برای logout از یک دستگاه)
- نگه داشتن `/api/refresh/logout-all` (برای logout از همه دستگاه‌ها)

---

### 2. **Excel Template Download - 2 نسخه**

#### 🔴 مشکل: 2 endpoint برای دانلود template

1. **`GET /api/campaigns/excel-template/download`** (campaignRoutes.js:47)
   - Public route (بدون authentication)
   - **Controller:** `adminController.downloadExcelTemplate`

2. **`GET /api/admin/excel-template/download`** (adminRoutes.js:47)
   - نیاز به admin authentication
   - **Controller:** `adminController.downloadExcelTemplate` (همان)

**💡 پیشنهاد:**
- حذف `/api/campaigns/excel-template/download`
- نگه داشتن فقط `/api/admin/excel-template/download` (اگر فقط admin باید template را آپلود کند)
- یا اگر کاربران عادی هم باید template را دانلود کنند، فقط public route را نگه دارید

---

## 🗑️ API های اضافی/غیرضروری

### 3. **Test QR Code Endpoint**

#### 🔴 `POST /api/campaigns/test-qr-code` (campaignRoutes.js:50-75)

**مشکل:**
- این endpoint فقط برای تست است
- در production نباید وجود داشته باشد
- هیچ authentication ندارد
- فقط یک mock response برمی‌گرداند

**💡 پیشنهاد:**
- **حذف کامل** این endpoint
- یا اگر نیاز به تست دارید، فقط در development mode فعال کنید

```javascript
if (process.env.NODE_ENV === 'development') {
    router.post('/test-qr-code', ...);
}
```

---

### 4. **Subscription Endpoint در Campaign Routes**

#### 🟡 `GET /api/campaigns/subscription` (campaignRoutes.js:81)

**مشکل:**
- Subscription مربوط به **User** است نه Campaign
- قرار دادن آن در `/api/campaigns/` منطقی نیست
- بهتر است در `/api/user/subscription` باشد

**💡 پیشنهاد:**
- انتقال به `/api/user/subscription`
- یا ایجاد `/api/subscription` جداگانه

---

### 5. **Wizard Navigation Endpoints - پیچیده و اضافی**

#### 🟡 چند endpoint برای navigation که ممکن است اضافی باشند:

1. **`GET /api/campaigns/:campaignId/steps`** (campaignRoutes.js:118)
2. **`POST /api/campaigns/:campaignId/navigate`** (campaignRoutes.js:119)
3. **`POST /api/campaigns/:campaignId/go-back`** (campaignRoutes.js:120)
4. **`POST /api/campaigns/:campaignId/reset`** (campaignRoutes.js:121)

**مشکل:**
- این endpoint ها برای wizard navigation هستند
- اگر frontend از state management استفاده می‌کند، ممکن است نیازی به این endpoint ها نباشد
- پیچیدگی اضافی برای backend

**💡 پیشنهاد:**
- بررسی کنید که آیا frontend واقعاً از این endpoint ها استفاده می‌کند
- اگر استفاده نمی‌شود، حذف کنید
- یا می‌توانید همه را در یک endpoint ترکیب کنید: `POST /api/campaigns/:campaignId/wizard`

---

### 6. **Temp File Management - پیچیده**

#### 🟡 چند endpoint برای مدیریت فایل‌های موقت:

1. **`POST /api/campaigns/:campaignId/attachment/temp`** (campaignRoutes.js:109)
2. **`POST /api/campaigns/:campaignId/attachment/confirm`** (campaignRoutes.js:110)
3. **`GET /api/campaigns/temp-files/:filename`** (campaignRoutes.js:111)
4. **`POST /api/campaigns/cleanup-temp`** (campaignRoutes.js:112)

**مشکل:**
- این flow دو مرحله‌ای (temp upload + confirm) پیچیده است
- اگر frontend می‌تواند مستقیماً فایل را آپلود کند، نیازی به temp نیست

**💡 پیشنهاد:**
- بررسی کنید که آیا این flow واقعاً لازم است
- اگر frontend می‌تواند مستقیماً آپلود کند، فقط `POST /api/campaigns/:campaignId/attachment` را نگه دارید
- یا اگر نیاز به preview قبل از confirm دارید، این flow را نگه دارید

---

### 7. **Campaign Preview - ممکن است اضافی باشد**

#### 🟡 `GET /api/campaigns/:campaignId/preview` (campaignRoutes.js:115)

**مشکل:**
- این endpoint احتمالاً همان اطلاعات `GET /api/campaigns/:campaignId` را برمی‌گرداند
- اگر تفاوتی ندارد، اضافی است

**💡 پیشنهاد:**
- بررسی کنید که آیا این endpoint اطلاعات متفاوتی از `getCampaignDetails` برمی‌گرداند
- اگر نه، حذف کنید

---

## ⚠️ API های نیازمند بازبینی

### 8. **Search Campaigns**

#### 🟡 `GET /api/campaigns/search` (campaignRoutes.js:89)

**مشکل:**
- این endpoint جدا از `GET /api/campaigns` است
- معمولاً search را می‌توان با query parameters در همان endpoint انجام داد

**💡 پیشنهاد:**
- ترکیب با `GET /api/campaigns?q=searchTerm`
- یا اگر search پیچیده است (filters زیاد)، نگه دارید

---

### 9. **Multiple Report Download**

#### 🟡 `POST /api/campaigns/reports/download-multiple` (campaignRoutes.js:136)

**مشکل:**
- این endpoint برای دانلود چند گزارش به صورت zip است
- بررسی کنید که آیا واقعاً استفاده می‌شود

**💡 پیشنهاد:**
- اگر استفاده نمی‌شود، حذف کنید
- یا اگر نیاز است، نگه دارید

---

### 10. **Campaign Status Endpoint**

#### 🟡 بررسی کنید که آیا endpoint جداگانه برای status وجود دارد

**مشکل:**
- `GET /api/campaigns/:campaignId` احتمالاً status را هم برمی‌گرداند
- اگر endpoint جداگانه `GET /api/campaigns/:campaignId/status` دارید، ممکن است اضافی باشد

**💡 پیشنهاد:**
- بررسی کنید که آیا endpoint جداگانه وجود دارد
- اگر وجود دارد و فقط status را برمی‌گرداند، حذف کنید

---

## 📋 لیست کامل API های پیشنهادی برای حذف

### اولویت بالا (حذف فوری):

1. ❌ `POST /api/campaigns/test-qr-code` - فقط برای تست
2. ❌ `POST /api/user/logout` - تکراری با `/api/refresh/logout`
3. ❌ `GET /api/campaigns/excel-template/download` - تکراری با admin route

### اولویت متوسط (بررسی و حذف در صورت عدم استفاده):

4. ⚠️ `GET /api/campaigns/:campaignId/steps` - wizard navigation
5. ⚠️ `POST /api/campaigns/:campaignId/navigate` - wizard navigation
6. ⚠️ `POST /api/campaigns/:campaignId/go-back` - wizard navigation
7. ⚠️ `POST /api/campaigns/:campaignId/reset` - wizard navigation
8. ⚠️ `GET /api/campaigns/:campaignId/preview` - اگر همان details است
9. ⚠️ `POST /api/campaigns/reports/download-multiple` - اگر استفاده نمی‌شود

### اولویت پایین (بازبینی و بهبود):

10. 🔄 `GET /api/campaigns/subscription` - انتقال به `/api/user/subscription`
11. 🔄 `GET /api/campaigns/search` - ترکیب با `GET /api/campaigns?q=`
12. 🔄 Temp file endpoints - ساده‌سازی flow

---

## ✅ API های ضروری (نگه دارید)

### Authentication:
- ✅ `POST /api/auth/request-otp`
- ✅ `POST /api/auth/verify-otp`
- ✅ `POST /api/user/login`
- ✅ `POST /api/user/register`
- ✅ `POST /api/user/register-simple`
- ✅ `POST /api/refresh/token`
- ✅ `POST /api/refresh/logout` (یکی از logout ها)
- ✅ `POST /api/refresh/logout-all`

### User:
- ✅ `GET /api/user/profile`
- ✅ `POST /api/user/profile` (edit)

### Campaigns (Core):
- ✅ `POST /api/campaigns` (create)
- ✅ `GET /api/campaigns` (list)
- ✅ `GET /api/campaigns/:campaignId` (details)
- ✅ `DELETE /api/campaigns/:campaignId` (delete)
- ✅ `POST /api/campaigns/:campaignId/recipients` (upload)
- ✅ `POST /api/campaigns/:campaignId/attachment` (upload)
- ✅ `POST /api/campaigns/:campaignId/qr-code` (generate)
- ✅ `GET /api/campaigns/:campaignId/connection` (check)
- ✅ `POST /api/campaigns/:campaignId/start` (start)
- ✅ `POST /api/campaigns/:campaignId/pause` (pause)
- ✅ `POST /api/campaigns/:campaignId/resume` (resume)
- ✅ `GET /api/campaigns/:campaignId/report` (generate)
- ✅ `GET /api/campaigns/:campaignId/report/download` (download)
- ✅ `GET /api/campaigns/:campaignId/recipients` (list)

### Packages:
- ✅ `GET /api/packages` (list)
- ✅ `GET /api/packages/:id` (details)
- ✅ `POST /api/packages` (admin - create)
- ✅ `PUT /api/packages/:id` (admin - update)
- ✅ `DELETE /api/packages/:id` (admin - delete)

### Orders:
- ✅ `POST /api/orders` (create)
- ✅ `GET /api/orders/me` (list)

### Payments:
- ✅ `POST /api/payments/start`
- ✅ `POST /api/payments/confirm`
- ✅ `GET /api/payments/callback`

### Admin:
- ✅ `GET /api/admin/users`
- ✅ `PATCH /api/admin/users/:userId/role`
- ✅ `PATCH /api/admin/users/:userId/status`
- ✅ `GET /api/admin/transactions`
- ✅ `GET /api/admin/dashboard`
- ✅ `POST /api/admin/excel-template` (upload)
- ✅ `GET /api/admin/excel-template/download`
- ✅ `GET /api/admin/excel-template/info`

---

## 🎯 خلاصه پیشنهادات

### حذف فوری (3 endpoint):
1. `POST /api/campaigns/test-qr-code`
2. `POST /api/user/logout`
3. `GET /api/campaigns/excel-template/download`

### بررسی و حذف در صورت عدم استفاده (6 endpoint):
4. Wizard navigation endpoints (4 endpoint)
5. `GET /api/campaigns/:campaignId/preview`
6. `POST /api/campaigns/reports/download-multiple`

### بازبینی و بهبود (3 endpoint):
7. `GET /api/campaigns/subscription` → انتقال به `/api/user/subscription`
8. `GET /api/campaigns/search` → ترکیب با main endpoint
9. Temp file endpoints → ساده‌سازی

---

## 📊 آمار نهایی

- **کل Endpoint ها:** 64
- **پیشنهاد حذف:** 9 endpoint (14%)
- **پیشنهاد بازبینی:** 3 endpoint (5%)
- **Endpoint های ضروری:** 52 endpoint (81%)

---

**تاریخ بررسی:** $(date)  
**بررسی کننده:** AI Code Reviewer

