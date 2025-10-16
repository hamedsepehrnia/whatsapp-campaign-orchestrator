# 🚀 راهنمای استقرار

راهنمای کامل استقرار سیستم در محیط تولید

## 🏗️ آماده‌سازی محیط تولید

### پیش‌نیازها
- **Server**: Ubuntu 20.04+ یا CentOS 8+
- **Node.js**: نسخه 16 یا بالاتر
- **MySQL**: نسخه 8.0 یا بالاتر
- **Nginx**: برای reverse proxy
- **PM2**: برای مدیریت process
- **SSL Certificate**: برای HTTPS

### تنظیمات سرور
```bash
# به‌روزرسانی سیستم
sudo apt update && sudo apt upgrade -y

# نصب Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# نصب MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# نصب Nginx
sudo apt install nginx -y

# نصب PM2
sudo npm install -g pm2
```

## 🔧 تنظیمات پایگاه داده

### ایجاد پایگاه داده
```sql
-- ورود به MySQL
sudo mysql -u root -p

-- ایجاد پایگاه داده
CREATE DATABASE whatsapp_campaign_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ایجاد کاربر
CREATE USER 'whatsapp_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON whatsapp_campaign_prod.* TO 'whatsapp_user'@'localhost';
FLUSH PRIVILEGES;
```

### تنظیمات MySQL
```ini
# /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_log_buffer_size = 64M
query_cache_size = 64M
query_cache_limit = 2M
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

## 📦 استقرار کد

### کلون کردن پروژه
```bash
# ایجاد دایرکتوری
sudo mkdir -p /var/www/whatsapp-campaign
sudo chown -R $USER:$USER /var/www/whatsapp-campaign

# کلون کردن پروژه
cd /var/www/whatsapp-campaign
git clone <repository-url> .

# نصب وابستگی‌ها
npm install --production
```

### تنظیمات محیطی
```bash
# ایجاد فایل .env
sudo nano /var/www/whatsapp-campaign/.env
```

```env
# Production Environment
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL="mysql://whatsapp_user:strong_password@localhost:3306/whatsapp_campaign_prod"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"

# Session
SESSION_SECRET="your-super-secret-session-key-here"

# Frontend
FRONTEND_URL="https://yourdomain.com"

# SMS Service
KAVENEGAR_API_KEY="your-kavenegar-api-key"

# Email
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-email-password"

# Chrome Path
CHROME_PATH="/usr/bin/google-chrome"
```

### اجرای مایگریشن‌ها
```bash
# تولید Prisma Client
npm run db:generate

# اجرای مایگریشن‌ها
npm run db:deploy
```

## 🔧 تنظیمات PM2

### فایل PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'whatsapp-campaign',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### شروع سرویس
```bash
# شروع با PM2
pm2 start ecosystem.config.js

# تنظیم auto-restart
pm2 startup
pm2 save

# مشاهده وضعیت
pm2 status
pm2 logs whatsapp-campaign
```

## 🌐 تنظیمات Nginx

### فایل Configuration
```nginx
# /etc/nginx/sites-available/whatsapp-campaign
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=upload:10m rate=1r/s;
    
    # API Routes
    location /api {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # File Upload
    location /api/campaigns/ {
        limit_req zone=upload burst=5 nodelay;
        client_max_body_size 20M;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static Files
    location /uploads {
        alias /var/www/whatsapp-campaign/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Frontend
    location / {
        root /var/www/whatsapp-campaign/frontend;
        try_files $uri $uri/ /index.html;
    }
}
```

### فعال‌سازی Configuration
```bash
# ایجاد symbolic link
sudo ln -s /etc/nginx/sites-available/whatsapp-campaign /etc/nginx/sites-enabled/

# تست configuration
sudo nginx -t

# راه‌اندازی مجدد Nginx
sudo systemctl restart nginx
```

## 🔒 تنظیمات SSL

### نصب Let's Encrypt
```bash
# نصب Certbot
sudo apt install certbot python3-certbot-nginx -y

# دریافت SSL Certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# تنظیم auto-renewal
sudo crontab -e
# اضافه کردن خط زیر:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 تنظیمات فایروال

### UFW Configuration
```bash
# فعال‌سازی UFW
sudo ufw enable

# تنظیمات پایه
sudo ufw default deny incoming
sudo ufw default allow outgoing

# اجازه SSH
sudo ufw allow ssh

# اجازه HTTP و HTTPS
sudo ufw allow 80
sudo ufw allow 443

# مشاهده وضعیت
sudo ufw status
```

## 📊 مانیتورینگ

### تنظیمات Logrotate
```bash
# ایجاد فایل logrotate
sudo nano /etc/logrotate.d/whatsapp-campaign
```

```
/var/www/whatsapp-campaign/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

### مانیتورینگ سیستم
```bash
# نصب htop
sudo apt install htop -y

# نصب iotop
sudo apt install iotop -y

# مانیتورینگ با PM2
pm2 monit
```

## 🔄 به‌روزرسانی

### اسکریپت به‌روزرسانی
```bash
#!/bin/bash
# update.sh

echo "Starting update process..."

# Backup database
mysqldump -u whatsapp_user -p whatsapp_campaign_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup files
tar -czf files_backup_$(date +%Y%m%d_%H%M%S).tar.gz uploads/

# Pull latest code
git pull origin main

# Install dependencies
npm install --production

# Run migrations
npm run db:deploy

# Restart PM2
pm2 restart whatsapp-campaign

echo "Update completed successfully!"
```

### اجرای به‌روزرسانی
```bash
chmod +x update.sh
./update.sh
```

## 🚨 Backup و Recovery

### Backup Script
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/whatsapp-campaign"
DATE=$(date +%Y%m%d_%H%M%S)

# ایجاد دایرکتوری backup
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u whatsapp_user -p whatsapp_campaign_prod > $BACKUP_DIR/database_$DATE.sql

# Backup files
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/whatsapp-campaign/uploads/

# Backup code
tar -czf $BACKUP_DIR/code_$DATE.tar.gz /var/www/whatsapp-campaign/ --exclude=node_modules

# حذف backup های قدیمی (بیش از 30 روز)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### تنظیمات Cron
```bash
# اضافه کردن به crontab
crontab -e

# Backup روزانه در ساعت 2 صبح
0 2 * * * /var/www/whatsapp-campaign/backup.sh

# Log rotation هفتگی
0 3 * * 0 /usr/sbin/logrotate /etc/logrotate.d/whatsapp-campaign
```

## 🔍 عیب‌یابی

### بررسی وضعیت سرویس‌ها
```bash
# وضعیت PM2
pm2 status
pm2 logs whatsapp-campaign

# وضعیت Nginx
sudo systemctl status nginx
sudo nginx -t

# وضعیت MySQL
sudo systemctl status mysql
sudo mysql -u root -p -e "SHOW PROCESSLIST;"

# بررسی پورت‌ها
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
```

### بررسی لاگ‌ها
```bash
# لاگ‌های PM2
pm2 logs whatsapp-campaign --lines 100

# لاگ‌های Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# لاگ‌های MySQL
sudo tail -f /var/log/mysql/error.log
```

## 📈 بهینه‌سازی

### تنظیمات Node.js
```bash
# تنظیمات حافظه
export NODE_OPTIONS="--max-old-space-size=1024"

# تنظیمات PM2
pm2 start ecosystem.config.js --max-memory-restart 1G
```

### تنظیمات MySQL
```sql
-- بهینه‌سازی MySQL
SET GLOBAL innodb_buffer_pool_size = 1073741824; -- 1GB
SET GLOBAL max_connections = 200;
SET GLOBAL query_cache_size = 67108864; -- 64MB
```

## 🔐 امنیت

### تنظیمات امنیتی
```bash
# غیرفعال کردن root login
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no

# تنظیمات فایروال
sudo ufw deny 22
sudo ufw allow from YOUR_IP to any port 22

# تنظیمات MySQL
sudo mysql -u root -p
# ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'new_password';
```

### تنظیمات SSL
```nginx
# تنظیمات SSL پیشرفته
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

---

**نکته**: این راهنما به‌روزرسانی می‌شود. لطفاً آخرین نسخه را بررسی کنید.
