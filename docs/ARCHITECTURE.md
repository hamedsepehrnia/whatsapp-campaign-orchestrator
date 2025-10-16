# 🏗️ معماری سیستم

بررسی کامل معماری و ساختار سیستم مدیریت کمپین‌های واتساپ

## 📐 نمای کلی معماری

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   WhatsApp      │
│   (React/Vue)   │◄──►│   (Express.js)  │◄──►│   Web.js        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Database      │
                       │   (MySQL)       │
                       └─────────────────┘
```

## 🏛️ لایه‌های سیستم

### 1. Presentation Layer (لایه نمایش)
- **Frontend**: رابط کاربری وب
- **API Gateway**: نقطه ورود تمام درخواست‌ها
- **WebSocket**: ارتباط لحظه‌ای

### 2. Business Logic Layer (لایه منطق کسب‌وکار)
- **Controllers**: کنترلرهای API
- **Services**: سرویس‌های کسب‌وکار
- **Middlewares**: میدل‌ویرهای امنیتی

### 3. Data Access Layer (لایه دسترسی به داده)
- **Models**: مدل‌های Prisma
- **Database**: پایگاه داده MySQL
- **File Storage**: ذخیره فایل‌ها

## 🔧 ساختار پروژه

```
src/
├── app.js                 # تنظیمات اصلی Express
├── config/               # تنظیمات سیستم
│   ├── db.js            # تنظیمات پایگاه داده
│   ├── passport.js      # تنظیمات احراز هویت
│   └── prisma.js        # تنظیمات Prisma
├── controllers/         # کنترلرهای API
│   ├── authController.js
│   ├── campaignController.js
│   ├── userController.js
│   ├── adminController.js
│   └── ...
├── middlewares/         # میدل‌ویرها
│   ├── auth.js         # احراز هویت
│   ├── validate.js     # اعتبارسنجی
│   └── subscription.js # بررسی اشتراک
├── models/             # مدل‌های داده
│   └── index.js       # Prisma Client
├── routes/            # مسیرهای API
│   ├── authRoutes.js
│   ├── campaignRoutes.js
│   ├── userRoutes.js
│   └── ...
├── services/          # سرویس‌های کسب‌وکار
│   ├── whatsappService.js
│   ├── websocketService.js
│   ├── otpService.js
│   └── paymentService.js
├── utils/            # ابزارهای کمکی
│   ├── logger.js
│   ├── mailer.js
│   └── sms.js
└── validators/       # اعتبارسنجی ورودی‌ها
    └── schemas.js
```

## 🗄️ مدل‌های پایگاه داده

### User (کاربر)
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('USER', 'ADMIN', 'SUPER_ADMIN') DEFAULT 'USER',
  status ENUM('ACTIVE', 'INACTIVE', 'BANNED') DEFAULT 'ACTIVE',
  subscriptionActive BOOLEAN DEFAULT FALSE,
  subscriptionExpiresAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Campaign (کمپین)
```sql
CREATE TABLE campaigns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  title VARCHAR(255),
  message TEXT NOT NULL,
  interval ENUM('FIVE_SECONDS', 'TEN_SECONDS', 'TWENTY_SECONDS') DEFAULT 'TEN_SECONDS',
  status ENUM('DRAFT', 'READY', 'RUNNING', 'COMPLETED', 'PAUSED', 'FAILED') DEFAULT 'DRAFT',
  isConnected BOOLEAN DEFAULT FALSE,
  totalRecipients INT DEFAULT 0,
  sentCount INT DEFAULT 0,
  failedCount INT DEFAULT 0,
  deliveredCount INT DEFAULT 0,
  startedAt DATETIME,
  completedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### Recipient (مخاطب)
```sql
CREATE TABLE recipients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  campaignId INT NOT NULL,
  phone VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  status ENUM('PENDING', 'SENT', 'FAILED', 'DELIVERED') DEFAULT 'PENDING',
  sentAt DATETIME,
  error TEXT,
  FOREIGN KEY (campaignId) REFERENCES campaigns(id) ON DELETE CASCADE
);
```

### Package (پکیج)
```sql
CREATE TABLE packages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration INT NOT NULL,
  category VARCHAR(255),
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  messageLimit INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🔄 جریان داده‌ها

### 1. ایجاد کمپین
```
User Request → Campaign Controller → Campaign Service → Database
     ↓
WebSocket Update → Frontend
```

### 2. ارسال پیام
```
Campaign Start → WhatsApp Service → WhatsApp Web.js → WhatsApp API
     ↓
Progress Update → WebSocket → Frontend
     ↓
Status Update → Database
```

### 3. احراز هویت
```
Login Request → Auth Controller → User Model → JWT Token
     ↓
Session Storage → Future Requests
```

## 🔐 امنیت

### 1. احراز هویت
- **JWT Tokens**: توکن‌های امن
- **Session Management**: مدیریت جلسات
- **Password Hashing**: bcrypt برای رمز عبور

### 2. مجوزدهی
- **Role-based Access**: دسترسی بر اساس نقش
- **Resource Ownership**: مالکیت منابع
- **API Rate Limiting**: محدودیت نرخ درخواست

### 3. اعتبارسنجی
- **Input Validation**: اعتبارسنجی ورودی‌ها
- **File Upload Security**: امنیت آپلود فایل
- **SQL Injection Prevention**: جلوگیری از SQL Injection

## 🌐 ارتباطات

### 1. HTTP APIs
- **RESTful Design**: طراحی REST
- **JSON Format**: فرمت JSON
- **Error Handling**: مدیریت خطاها

### 2. WebSocket
- **Real-time Updates**: به‌روزرسانی لحظه‌ای
- **Campaign Progress**: پیشرفت کمپین
- **Connection Management**: مدیریت اتصالات

### 3. External Services
- **WhatsApp Web.js**: اتصال به واتساپ
- **SMS Service**: سرویس پیامک
- **Email Service**: سرویس ایمیل

## 📊 مانیتورینگ

### 1. Logging
- **Request Logging**: لاگ درخواست‌ها
- **Error Logging**: لاگ خطاها
- **Performance Logging**: لاگ عملکرد

### 2. Metrics
- **Campaign Statistics**: آمار کمپین‌ها
- **User Activity**: فعالیت کاربران
- **System Performance**: عملکرد سیستم

### 3. Health Checks
- **Database Health**: سلامت پایگاه داده
- **Service Health**: سلامت سرویس‌ها
- **External Dependencies**: وابستگی‌های خارجی

## 🚀 بهینه‌سازی

### 1. Database
- **Indexing**: ایندکس‌گذاری
- **Query Optimization**: بهینه‌سازی کوئری‌ها
- **Connection Pooling**: مدیریت اتصالات

### 2. Caching
- **Session Caching**: کش جلسات
- **Query Caching**: کش کوئری‌ها
- **File Caching**: کش فایل‌ها

### 3. Performance
- **Async Operations**: عملیات ناهمزمان
- **Batch Processing**: پردازش دسته‌ای
- **Resource Optimization**: بهینه‌سازی منابع

## 🔧 توسعه

### 1. Code Organization
- **Modular Structure**: ساختار ماژولار
- **Separation of Concerns**: جداسازی نگرانی‌ها
- **Reusable Components**: کامپوننت‌های قابل استفاده مجدد

### 2. Testing
- **Unit Tests**: تست‌های واحد
- **Integration Tests**: تست‌های یکپارچگی
- **API Tests**: تست‌های API

### 3. Documentation
- **API Documentation**: مستندات API
- **Code Comments**: کامنت‌های کد
- **Architecture Diagrams**: نمودارهای معماری

## 📈 مقیاس‌پذیری

### 1. Horizontal Scaling
- **Load Balancing**: توزیع بار
- **Database Sharding**: پارتیشن‌بندی پایگاه داده
- **Microservices**: معماری میکروسرویس

### 2. Vertical Scaling
- **Resource Upgrading**: ارتقای منابع
- **Performance Tuning**: تنظیم عملکرد
- **Memory Optimization**: بهینه‌سازی حافظه

### 3. Caching Strategy
- **Redis Caching**: کش Redis
- **CDN Integration**: یکپارچگی CDN
- **Static Asset Optimization**: بهینه‌سازی فایل‌های استاتیک

---

**نکته**: این معماری برای پشتیبانی از هزاران کاربر و میلیون‌ها پیام طراحی شده است.
