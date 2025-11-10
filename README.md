# WhatsApp Campaign API

Enterprise-grade API for orchestrating WhatsApp messaging campaigns with scheduling, analytics, and billing.

[![Persian](https://img.shields.io/badge/lang-persian-blue?style=for-the-badge)](#فارسی)
[![English](https://img.shields.io/badge/lang-English-green?style=for-the-badge)](#english)

## Funding

<a href="https://www.coffeebede.com/hamesep">
  <img src="https://coffeebede.ir/DashboardTemplateV2/app-assets/images/banner/default-yellow.svg" alt="Buy Me A Coffee" height="60">
</a>

<a href="https://nowpayments.io/donation?api_key=19623fa3-605a-436a-97cd-b5859356b41d" target="_blank">
  <img src="https://img.shields.io/badge/Donate-Crypto-blue?style=for-the-badge&logo=bitcoin&logoColor=white" alt="Donate with Crypto" height="50">
</a>

## English

### Overview
WhatsApp Campaign API delivers a backend service for managing bulk WhatsApp outreach, integrating campaign orchestration, contact management, payment handling, and real-time progress monitoring.

### Features
- **Campaign Management**: create targeted campaigns, schedule dispatch windows, attach media assets, and monitor delivery status.
- **Contact Operations**: import recipients from spreadsheets, validate data, and deduplicate contact lists.
- **Messaging Automation**: integrate with WhatsApp Web sessions, maintain QR-based login, and stream message status events via WebSocket.
- **Access and Security**: authenticate with OTP and JWT, enforce role-based permissions, rate limiting, and structured request validation.
- **Billing and Packages**: define subscription tiers, process payments, and reconcile transactions.
- **Observability**: capture structured logs, expose operational metrics, and export campaign reports to Excel.

### Technology Stack
| Component | Technology |
| --- | --- |
| Runtime | Node.js 18 LTS |
| Framework | Express 5 |
| Database | MySQL 8 + Prisma ORM |
| Messaging Integration | whatsapp-web.js |
| Realtime Channel | WebSocket (ws) |
| Authentication | Passport, JWT, OTP |
| Validation | Zod |
| Utilities | Multer, Nodemailer, Axios |

### Installation
1. Clone the repository: `git clone <repository-url>` and `cd whatsapp-messager`.
2. Install dependencies: `npm install`.
3. Configure environment: copy `.env.example` if available or create `.env` based on the configuration section.
4. Generate Prisma client: `npm run db:generate`.
5. Apply database migrations: `npm run db:migrate`.
6. Start the development server: `npm run dev`.

### Project Structure
```
src/
├── app.js
├── config/
├── controllers/
├── middlewares/
├── routes/
├── services/
├── utils/
└── validators/
```

### Configuration
Set environment variables in `.env`:
- `DATABASE_URL` for the MySQL connection string.
- `JWT_SECRET` and `JWT_REFRESH_SECRET` for token issuance.
- `SESSION_SECRET` for session handling.
- `PORT` and `NODE_ENV` for server runtime.
- `FRONTEND_URL` to allow CORS.
- `KAVENEGAR_API_KEY`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` for SMS and email providers.

### Contributing
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/<name>`.
3. Commit with clear messages: `git commit -m "Describe change"`.
4. Push the branch: `git push origin feature/<name>`.
5. Open a pull request describing the change and testing performed.

### License
This project is licensed under the MIT License.

### Support
- Report issues via the repository issue tracker.
- Contact support at `support@example.com`.
- Sponsor development through the funding links above.

## فارسی

### معرفی
WhatsApp Campaign API یک سرویس پشتیبان برای مدیریت کمپین‌های انبوه واتساپ است که امکان برنامه‌ریزی ارسال، مدیریت مخاطبان، کنترل پرداخت و پایش لحظه‌ای پیشرفت را فراهم می‌کند.

### ویژگی‌ها
- **مدیریت کمپین**: ایجاد کمپین هدفمند، زمان‌بندی ارسال، پیوست فایل و پایش وضعیت تحویل.
- **عملیات مخاطبان**: وارد کردن مخاطبان از فایل‌های صفحه‌گسترده، اعتبارسنجی داده و حذف تکراری‌ها.
- **اتوماسیون پیام**: اتصال به نشست واتساپ، ورود با QR، و انتشار رویدادهای وضعیت از طریق WebSocket.
- **دسترسی و امنیت**: احراز هویت OTP و JWT، کنترل نقش، محدودیت نرخ و اعتبارسنجی ساختارمند درخواست‌ها.
- **صورتحساب و پکیج‌ها**: تعریف سطوح اشتراک، پردازش پرداخت و تطبیق تراکنش‌ها.
- **قابلیت مشاهده**: ثبت لاگ ساخت‌یافته، ارائه شاخص‌های عملکرد و خروجی گزارش کمپین به Excel.

### پشته فناوری
| مولفه | فناوری |
| --- | --- |
| زمان اجرا | Node.js 18 LTS |
| فریم‌ورک | Express 5 |
| پایگاه داده | MySQL 8 + Prisma ORM |
| یکپارچه‌سازی پیام | whatsapp-web.js |
| کانال بلادرنگ | WebSocket (ws) |
| احراز هویت | Passport، JWT، OTP |
| اعتبارسنجی | Zod |
| ابزارها | Multer، Nodemailer، Axios |

### نصب
1. مخزن را کلون کنید: `git clone <repository-url>` سپس `cd whatsapp-messager`.
2. وابستگی‌ها را نصب کنید: `npm install`.
3. متغیرهای محیطی را در فایل `.env` مطابق بخش پیکربندی تنظیم کنید.
4. کلاینت Prisma را تولید کنید: `npm run db:generate`.
5. مایگریشن‌های پایگاه داده را اجرا کنید: `npm run db:migrate`.
6. سرویس توسعه را اجرا کنید: `npm run dev`.

### ساختار پروژه
```
src/
├── app.js
├── config/
├── controllers/
├── middlewares/
├── routes/
├── services/
├── utils/
└── validators/
```

### پیکربندی
متغیرهای زیر را در `.env` مقداردهی کنید:
- `DATABASE_URL` برای اتصال MySQL.
- `JWT_SECRET` و `JWT_REFRESH_SECRET` برای صدور توکن.
- `SESSION_SECRET` برای مدیریت نشست.
- `PORT` و `NODE_ENV` برای اجرای سرور.
- `FRONTEND_URL` جهت فعال‌سازی CORS.
- `KAVENEGAR_API_KEY`، `EMAIL_HOST`، `EMAIL_PORT`، `EMAIL_USER`، `EMAIL_PASS` برای سرویس پیامک و ایمیل.

### مشارکت
1. مخزن را Fork کنید.
2. شاخه ویژگی بسازید: `git checkout -b feature/<name>`.
3. با پیام شفاف Commit بزنید: `git commit -m "Describe change"`.
4. شاخه را Push کنید: `git push origin feature/<name>`.
5. Pull Request با توضیح تغییرات و تست‌ها ثبت کنید.

### مجوز
این پروژه تحت مجوز MIT منتشر شده است.

### پشتیبانی
- گزارش اشکال از طریق Issue Tracker مخزن.
- ارتباط ایمیلی با `support@example.com`.
- حمایت مالی از طریق لینک‌های بخش حمایت مالی.

<div align="center">

*Version* 1.0.0 | *Node.js* 18.x | *Language* JavaScript

<img src="https://img.shields.io/badge/Node.js-18.x-339933?style=flat-square&logo=node.js&logoColor=white">
<img src="https://img.shields.io/badge/Express-5-black?style=flat-square&logo=express&logoColor=white">
<img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white">

---

© 2025 WhatsApp Campaign API

</div>
