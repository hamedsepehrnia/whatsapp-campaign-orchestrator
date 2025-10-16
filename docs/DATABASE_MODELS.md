# 🗄️ مدل‌های پایگاه داده

توضیح کامل مدل‌های Prisma و ساختار پایگاه داده

## 📊 نمای کلی

سیستم از پایگاه داده MySQL با ORM Prisma استفاده می‌کند. تمام مدل‌ها در فایل `prisma/schema.prisma` تعریف شده‌اند.

## 👤 مدل User (کاربر)

### ساختار جدول
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
  age INT,
  address VARCHAR(500),
  avatar VARCHAR(500),
  subscriptionActive BOOLEAN DEFAULT FALSE,
  subscriptionExpiresAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### فیلدها
- **id**: شناسه یکتا (Primary Key)
- **name**: نام کامل کاربر
- **username**: نام کاربری (اختیاری، یکتا)
- **email**: ایمیل (یکتا، الزامی)
- **phone**: شماره تلفن (یکتا، الزامی)
- **password**: رمز عبور (هش شده)
- **role**: نقش کاربر (USER, ADMIN, SUPER_ADMIN)
- **status**: وضعیت کاربر (ACTIVE, INACTIVE, BANNED)
- **age**: سن (اختیاری)
- **address**: آدرس (اختیاری)
- **avatar**: آواتار (اختیاری)
- **subscriptionActive**: وضعیت اشتراک فعال
- **subscriptionExpiresAt**: تاریخ انقضای اشتراک
- **createdAt**: تاریخ ایجاد
- **updatedAt**: تاریخ آخرین به‌روزرسانی

### روابط
- **purchasedPackages**: پکیج‌های خریداری شده
- **campaigns**: کمپین‌های کاربر
- **orders**: سفارشات کاربر
- **refreshTokens**: توکن‌های تازه‌سازی

## 🎯 مدل Campaign (کمپین)

### ساختار جدول
```sql
CREATE TABLE campaigns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  title VARCHAR(255),
  message TEXT NOT NULL,
  interval ENUM('FIVE_SECONDS', 'TEN_SECONDS', 'TWENTY_SECONDS') DEFAULT 'TEN_SECONDS',
  isScheduled BOOLEAN DEFAULT FALSE,
  scheduledAt DATETIME,
  timezone VARCHAR(50) DEFAULT 'Asia/Tehran',
  sendType ENUM('IMMEDIATE', 'SCHEDULED') DEFAULT 'IMMEDIATE',
  status ENUM('DRAFT', 'READY', 'RUNNING', 'COMPLETED', 'PAUSED', 'FAILED') DEFAULT 'DRAFT',
  isConnected BOOLEAN DEFAULT FALSE,
  qrCode TEXT,
  sessionId VARCHAR(255),
  lastActivity DATETIME,
  totalRecipients INT DEFAULT 0,
  sentCount INT DEFAULT 0,
  failedCount INT DEFAULT 0,
  deliveredCount INT DEFAULT 0,
  startedAt DATETIME,
  completedAt DATETIME,
  totalMessages INT,
  successfulMessages INT,
  failedMessages INT,
  deliveryRate FLOAT,
  averageDeliveryTime FLOAT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### فیلدها
- **id**: شناسه یکتا
- **userId**: شناسه کاربر (Foreign Key)
- **title**: عنوان کمپین
- **message**: متن پیام
- **interval**: فاصله ارسال (5s, 10s, 20s)
- **isScheduled**: آیا زمان‌بندی شده
- **scheduledAt**: زمان برنامه‌ریزی شده
- **timezone**: منطقه زمانی
- **sendType**: نوع ارسال (فوری، زمان‌بندی)
- **status**: وضعیت کمپین
- **isConnected**: وضعیت اتصال WhatsApp
- **qrCode**: کد QR
- **sessionId**: شناسه جلسه
- **lastActivity**: آخرین فعالیت
- **totalRecipients**: تعداد کل مخاطبین
- **sentCount**: تعداد ارسال شده
- **failedCount**: تعداد ناموفق
- **deliveredCount**: تعداد تحویل شده
- **startedAt**: زمان شروع
- **completedAt**: زمان تکمیل
- **totalMessages**: تعداد کل پیام‌ها
- **successfulMessages**: پیام‌های موفق
- **failedMessages**: پیام‌های ناموفق
- **deliveryRate**: نرخ تحویل
- **averageDeliveryTime**: میانگین زمان تحویل

### روابط
- **user**: کاربر مالک کمپین
- **recipients**: مخاطبین کمپین
- **attachments**: پیوست‌های کمپین

## 📞 مدل Recipient (مخاطب)

### ساختار جدول
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

### فیلدها
- **id**: شناسه یکتا
- **campaignId**: شناسه کمپین (Foreign Key)
- **phone**: شماره تلفن
- **name**: نام مخاطب (اختیاری)
- **status**: وضعیت ارسال
- **sentAt**: زمان ارسال
- **error**: پیام خطا (در صورت ناموفق بودن)

### روابط
- **campaign**: کمپین مربوطه

## 📎 مدل Attachment (پیوست)

### ساختار جدول
```sql
CREATE TABLE attachments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  campaignId INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  originalName VARCHAR(255) NOT NULL,
  mimetype VARCHAR(100) NOT NULL,
  size INT NOT NULL,
  path VARCHAR(500) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaignId) REFERENCES campaigns(id) ON DELETE CASCADE
);
```

### فیلدها
- **id**: شناسه یکتا
- **campaignId**: شناسه کمپین (Foreign Key)
- **filename**: نام فایل ذخیره شده
- **originalName**: نام اصلی فایل
- **mimetype**: نوع MIME فایل
- **size**: حجم فایل (بایت)
- **path**: مسیر فایل
- **createdAt**: تاریخ ایجاد

### روابط
- **campaign**: کمپین مربوطه

## 📦 مدل Package (پکیج)

### ساختار جدول
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

### فیلدها
- **id**: شناسه یکتا
- **title**: عنوان پکیج
- **description**: توضیحات
- **price**: قیمت (تومان)
- **duration**: مدت اعتبار (روز)
- **category**: دسته‌بندی
- **status**: وضعیت (فعال، غیرفعال)
- **messageLimit**: محدودیت پیام
- **createdAt**: تاریخ ایجاد
- **updatedAt**: تاریخ آخرین به‌روزرسانی

### روابط
- **users**: کاربران خریداری کننده
- **orders**: سفارشات مربوطه

## 🛒 مدل Order (سفارش)

### ساختار جدول
```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  packageId INT NOT NULL,
  status ENUM('PENDING', 'PAID', 'CANCELLED') DEFAULT 'PENDING',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (packageId) REFERENCES packages(id)
);
```

### فیلدها
- **id**: شناسه یکتا
- **userId**: شناسه کاربر (Foreign Key)
- **packageId**: شناسه پکیج (Foreign Key)
- **status**: وضعیت سفارش
- **createdAt**: تاریخ ایجاد
- **updatedAt**: تاریخ آخرین به‌روزرسانی

### روابط
- **user**: کاربر سفارش دهنده
- **package**: پکیج سفارش شده
- **transaction**: تراکنش مربوطه

## 💳 مدل Transaction (تراکنش)

### ساختار جدول
```sql
CREATE TABLE transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderId INT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
  gateway ENUM('ZARINPAL', 'MOCK', 'OTHER') NOT NULL,
  authority VARCHAR(255),
  refId VARCHAR(255),
  gatewayData JSON DEFAULT '{}',
  paymentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
);
```

### فیلدها
- **id**: شناسه یکتا
- **orderId**: شناسه سفارش (Foreign Key, یکتا)
- **amount**: مبلغ (تومان)
- **status**: وضعیت تراکنش
- **gateway**: درگاه پرداخت
- **authority**: کد مرجع درگاه
- **refId**: شناسه مرجع
- **gatewayData**: داده‌های درگاه (JSON)
- **paymentDate**: تاریخ پرداخت
- **createdAt**: تاریخ ایجاد
- **updatedAt**: تاریخ آخرین به‌روزرسانی

### روابط
- **order**: سفارش مربوطه

## 🔐 مدل OTP (کد یکبار مصرف)

### ساختار جدول
```sql
CREATE TABLE otps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  target VARCHAR(255) NOT NULL,
  channel ENUM('SMS', 'EMAIL') NOT NULL,
  purpose ENUM('REGISTER') NOT NULL,
  hashedCode VARCHAR(255) NOT NULL,
  expiresAt DATETIME NOT NULL,
  attempts INT DEFAULT 0,
  maxAttempts INT DEFAULT 5,
  verified BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_target_channel_purpose (target, channel, purpose)
);
```

### فیلدها
- **id**: شناسه یکتا
- **target**: هدف (شماره تلفن یا ایمیل)
- **channel**: کانال ارسال (SMS, EMAIL)
- **purpose**: هدف (REGISTER)
- **hashedCode**: کد هش شده
- **expiresAt**: تاریخ انقضا
- **attempts**: تعداد تلاش‌ها
- **maxAttempts**: حداکثر تلاش‌ها
- **verified**: وضعیت تایید
- **createdAt**: تاریخ ایجاد
- **updatedAt**: تاریخ آخرین به‌روزرسانی

## 🔄 مدل RefreshToken (توکن تازه‌سازی)

### ساختار جدول
```sql
CREATE TABLE refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expiresAt DATETIME NOT NULL,
  isRevoked BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### فیلدها
- **id**: شناسه یکتا
- **userId**: شناسه کاربر (Foreign Key)
- **token**: توکن تازه‌سازی (یکتا)
- **expiresAt**: تاریخ انقضا
- **isRevoked**: وضعیت لغو
- **createdAt**: تاریخ ایجاد
- **updatedAt**: تاریخ آخرین به‌روزرسانی

### روابط
- **user**: کاربر مالک توکن

## 🔍 ایندکس‌ها

### ایندکس‌های مهم
```sql
-- ایندکس‌های جدول users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ایندکس‌های جدول campaigns
CREATE INDEX idx_campaigns_user_status ON campaigns(userId, status);
CREATE INDEX idx_campaigns_session ON campaigns(sessionId);
CREATE INDEX idx_campaigns_user_title ON campaigns(userId, title);
CREATE INDEX idx_campaigns_user_created ON campaigns(userId, createdAt);

-- ایندکس‌های جدول recipients
CREATE INDEX idx_recipients_campaign ON recipients(campaignId);
CREATE INDEX idx_recipients_phone ON recipients(phone);

-- ایندکس‌های جدول attachments
CREATE INDEX idx_attachments_campaign ON attachments(campaignId);

-- ایندکس‌های جدول orders
CREATE INDEX idx_orders_user ON orders(userId);
CREATE INDEX idx_orders_package ON orders(packageId);
CREATE INDEX idx_orders_status ON orders(status);

-- ایندکس‌های جدول transactions
CREATE INDEX idx_transactions_order ON transactions(orderId);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_gateway ON transactions(gateway);

-- ایندکس‌های جدول otps
CREATE INDEX idx_otps_expires ON otps(expiresAt);

-- ایندکس‌های جدول refresh_tokens
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(userId);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expiresAt);
```

## 🔄 روابط بین جداول

### نمودار روابط
```
users (1) ──→ (n) campaigns
users (1) ──→ (n) orders
users (1) ──→ (n) refresh_tokens
users (n) ──→ (n) packages (many-to-many)

campaigns (1) ──→ (n) recipients
campaigns (1) ──→ (n) attachments

orders (1) ──→ (1) transactions
orders (n) ──→ (1) packages
orders (n) ──→ (1) users
```

## 🛠️ عملیات CRUD

### نمونه کوئری‌ها

#### ایجاد کاربر
```javascript
const user = await prisma.user.create({
  data: {
    name: 'علی احمدی',
    username: 'ali_ahmadi',
    email: 'ali@example.com',
    phone: '09123456789',
    password: hashedPassword
  }
});
```

#### ایجاد کمپین
```javascript
const campaign = await prisma.campaign.create({
  data: {
    userId: 1,
    title: 'کمپین تست',
    message: 'سلام! این یک پیام تست است.',
    interval: 'TEN_SECONDS'
  }
});
```

#### جستجوی کمپین‌ها
```javascript
const campaigns = await prisma.campaign.findMany({
  where: {
    userId: 1,
    status: 'RUNNING'
  },
  include: {
    recipients: true,
    attachments: true
  }
});
```

#### آمار کمپین
```javascript
const stats = await prisma.campaign.aggregate({
  where: { userId: 1 },
  _count: { id: true },
  _sum: { sentCount: true, failedCount: true }
});
```

## 🔒 امنیت

### محدودیت‌های دسترسی
- کاربران فقط به کمپین‌های خود دسترسی دارند
- ادمین‌ها به تمام کمپین‌ها دسترسی دارند
- حذف آبشاری برای حفظ یکپارچگی

### رمزنگاری
- رمز عبور با bcrypt هش می‌شود
- توکن‌ها با JWT رمزنگاری می‌شوند
- داده‌های حساس در پایگاه داده رمزنگاری می‌شوند

---

**نکته**: این مدل‌ها به‌روزرسانی می‌شوند. لطفاً آخرین نسخه را بررسی کنید.
