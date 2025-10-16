# 🚀 راهنمای نصب و راه‌اندازی

راهنمای کامل نصب و پیکربندی سیستم مدیریت کمپین‌های واتساپ

## 📋 پیش‌نیازها

### نرم‌افزارهای مورد نیاز
- **Node.js**: نسخه 16 یا بالاتر
- **MySQL**: نسخه 8.0 یا بالاتر
- **npm**: نسخه 7 یا بالاتر
- **Git**: برای کلون کردن پروژه

### سخت‌افزار پیشنهادی
- **RAM**: حداقل 4GB (پیشنهادی 8GB)
- **CPU**: 2 هسته (پیشنهادی 4 هسته)
- **فضای ذخیره**: حداقل 10GB

## 🔧 نصب و راه‌اندازی

### 1. کلون کردن پروژه

```bash
git clone <repository-url>
cd whatsapp-messager
```

### 2. نصب وابستگی‌ها

```bash
npm install
```

### 3. تنظیم متغیرهای محیطی

فایل `.env` را در ریشه پروژه ایجاد کنید:

```env
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/whatsapp_campaign"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"

# Session Configuration
SESSION_SECRET="your-super-secret-session-key-here"

# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"

# SMS Service (Kavenegar)
KAVENEGAR_API_KEY="your-kavenegar-api-key"

# Email Configuration
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-email-password"

# Chrome Path (Optional)
CHROME_PATH="/usr/bin/google-chrome"
```

### 4. راه‌اندازی پایگاه داده

#### ایجاد پایگاه داده MySQL
```sql
CREATE DATABASE whatsapp_campaign CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### اجرای مایگریشن‌ها
```bash
# تولید Prisma Client
npm run db:generate

# اجرای مایگریشن‌ها
npm run db:migrate

# (اختیاری) مشاهده پایگاه داده
npm run db:studio
```

### 5. بررسی تنظیمات

```bash
# بررسی متغیرهای محیطی
npm run check-env
```

### 6. اجرای پروژه

```bash
# حالت توسعه
npm run dev

# حالت تولید
npm start
```

## 🔐 ایجاد کاربر ادمین

```bash
# ایجاد کاربر ادمین
npm run make-admin
```

## 🧪 تست سیستم

### اجرای تست‌های کامل
```bash
npm run test:all
```

### تست‌های خاص
```bash
# تست API های کمپین
npm run test:campaign

# تست یکپارچگی WhatsApp
npm run test:whatsapp

# تست API های عمومی
npm test
```

## 📱 تنظیمات WhatsApp

### 1. نصب Chrome/Chromium
```bash
# Ubuntu/Debian
sudo apt-get install google-chrome-stable

# CentOS/RHEL
sudo yum install google-chrome-stable

# macOS
brew install --cask google-chrome
```

### 2. تنظیم متغیر CHROME_PATH
```env
CHROME_PATH="/usr/bin/google-chrome"
```

## 🔧 پیکربندی پیشرفته

### تنظیمات پایگاه داده

#### MySQL Configuration
```ini
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
```

#### Connection Pool
```javascript
// در فایل src/config/db.js
const poolConfig = {
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};
```

### تنظیمات امنیتی

#### Rate Limiting
```javascript
// در فایل src/app.js
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200 // limit each IP to 200 requests per windowMs
}));
```

#### CORS Configuration
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 🚀 استقرار در محیط تولید

### 1. تنظیمات تولید

```env
NODE_ENV=production
DATABASE_URL="mysql://user:pass@host:port/db"
JWT_SECRET="strong-production-secret"
SESSION_SECRET="strong-session-secret"
```

### 2. بهینه‌سازی

```bash
# نصب وابستگی‌های تولید
npm install --production

# اجرای مایگریشن‌ها
npm run db:deploy

# شروع سرویس
npm start
```

### 3. استفاده از PM2

```bash
# نصب PM2
npm install -g pm2

# شروع با PM2
pm2 start server.js --name "whatsapp-campaign"

# تنظیم auto-restart
pm2 startup
pm2 save
```

## 🔍 عیب‌یابی

### مشکلات رایج

#### 1. خطای اتصال به پایگاه داده
```bash
# بررسی وضعیت MySQL
sudo systemctl status mysql

# بررسی اتصال
mysql -u username -p -h localhost
```

#### 2. خطای WhatsApp
```bash
# بررسی Chrome
google-chrome --version

# بررسی Puppeteer
node -e "console.log(require('puppeteer').executablePath())"
```

#### 3. خطای WebSocket
```bash
# بررسی پورت
netstat -tulpn | grep :3000
```

### لاگ‌ها

```bash
# مشاهده لاگ‌های سیستم
tail -f logs/app.log

# لاگ‌های PM2
pm2 logs whatsapp-campaign
```

## 📊 مانیتورینگ

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

### 2. Database Status
```bash
npm run db:studio
```

### 3. System Resources
```bash
# CPU و Memory
htop

# Disk Usage
df -h
```

## 🔄 به‌روزرسانی

### 1. Backup
```bash
# Backup Database
mysqldump -u username -p whatsapp_campaign > backup.sql

# Backup Files
tar -czf backup.tar.gz src/ uploads/
```

### 2. Update
```bash
git pull origin main
npm install
npm run db:migrate
pm2 restart whatsapp-campaign
```

## 📞 پشتیبانی

برای مشکلات و سوالات:
- ایمیل: support@example.com
- تلگرام: @support_bot
- GitHub Issues: [لینک مخزن]

---

**نکته**: این راهنما به‌روزرسانی می‌شود. لطفاً آخرین نسخه را بررسی کنید.
