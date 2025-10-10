# WhatsApp Campaign API

یک API کامل برای مدیریت کمپین‌های WhatsApp با قابلیت‌های پیشرفته.

## 🆕 Migration Notice
**این پروژه از MongoDB به MySQL با Prisma مهاجرت کرده است!**

- ✅ **Database**: MongoDB → MySQL
- ✅ **ORM**: Mongoose → Prisma  
- ✅ **Performance**: بهبود قابل توجه در سرعت
- ✅ **Consistency**: تضمین یکپارچگی داده‌ها

[راهنمای کامل Migration](README_MIGRATION.md) | [Migration Guide](MIGRATION_GUIDE.md)

## 📁 ساختار پروژه

```
whatsapp-messager/
├── src/                    # کد اصلی برنامه
│   ├── controllers/        # کنترلرهای API
│   ├── models/            # مدل‌های دیتابیس
│   ├── routes/            # مسیرهای API
│   ├── services/          # سرویس‌های کسب‌وکار
│   ├── middlewares/       # میدل‌ویرها
│   ├── config/            # تنظیمات
│   ├── utils/             # ابزارهای کمکی
│   ├── validators/        # اعتبارسنجی‌ها
│   └── uploads/           # فایل‌های آپلود شده
├── tests/                 # فایل‌های تست
├── docs/                  # مستندات
├── scripts/               # اسکریپت‌های کمکی
├── postman/               # فایل‌های Postman
└── server.js              # نقطه ورود برنامه
```

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها
- Node.js (v16 یا بالاتر)
- MySQL 8.0+
- npm یا yarn

### نصب
```bash
# کلون کردن پروژه
git clone <repository-url>
cd whatsapp-messager

# نصب وابستگی‌ها
npm install

# تنظیم متغیرهای محیطی
cp .env.example .env
# فایل .env را ویرایش کنید

# راه‌اندازی دیتابیس MySQL
mysql -u root -p
CREATE DATABASE whatsapp_campaign_db;

# اجرای migration ها
npm run db:generate
npm run db:migrate

# راه‌اندازی سرور
npm start
```

## 🔧 اسکریپت‌های کمکی

### دیتابیس
```bash
npm run db:generate    # تولید Prisma client
npm run db:migrate     # اجرای migration ها
npm run db:deploy      # deploy در production
npm run db:studio      # باز کردن Prisma Studio
npm run db:seed        # اجرای seed script
```

### تست‌ها
```bash
npm run test           # اجرای همه تست‌ها
npm run test:all       # اجرای تست‌های کامل
npm run test:campaign  # تست کمپین‌ها
npm run test:whatsapp  # تست WhatsApp
```

### بررسی محیط
```bash
node scripts/check-env.js
```

### ایجاد ادمین
```bash
node scripts/make-admin.js
```

## 📚 مستندات

- [مستندات API](docs/API_DOCUMENTATION.md)
- [راهنمای Migration](README_MIGRATION.md)
- [Migration Guide](MIGRATION_GUIDE.md)
- [راهنمای WhatsApp Integration](docs/WHATSAPP_INTEGRATION.md)
- [نتایج تست‌ها](docs/FINAL_TEST_RESULTS.md)

## 🧪 تست‌ها

همه فایل‌های تست در پوشه `tests/` قرار دارند:

- `test-apis.js` - تست‌های اصلی API
- `test-campaign-apis.js` - تست‌های کمپین
- `test-whatsapp-integration.js` - تست‌های WhatsApp
- `test-bug-fixes.js` - تست‌های رفع باگ

## 📦 Postman

فایل‌های Postman در پوشه `postman/` قرار دارند:
- `WhatsApp-Campaign-API.postman_collection.json`
- `WhatsApp-Campaign-Environment.postman_environment.json`

## 🔒 امنیت

- احراز هویت JWT
- اعتبارسنجی ورودی‌ها
- محدودیت نرخ درخواست
- رمزگذاری پسوردها

## 📊 ویژگی‌ها

- ✅ مدیریت کاربران و احراز هویت
- ✅ ایجاد و مدیریت کمپین‌ها
- ✅ آپلود فایل Excel برای مخاطبین
- ✅ ارسال پیام‌های WhatsApp
- ✅ گزارش‌گیری و آمار
- ✅ مدیریت بسته‌ها و پرداخت
- ✅ WebSocket برای به‌روزرسانی‌های real-time

## 🐛 گزارش باگ

اگر باگی پیدا کردید، لطفاً در بخش Issues گزارش دهید.

## 📄 مجوز

این پروژه تحت مجوز MIT منتشر شده است.
