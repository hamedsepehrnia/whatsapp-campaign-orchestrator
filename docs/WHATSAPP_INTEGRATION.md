# 📱 یکپارچگی WhatsApp

راهنمای کامل اتصال و استفاده از WhatsApp در سیستم

## 🔧 تنظیمات اولیه

### پیش‌نیازها
- **Chrome/Chromium**: برای اجرای Puppeteer
- **Node.js**: نسخه 16 یا بالاتر
- **WhatsApp Web**: حساب واتساپ فعال

### نصب Chrome
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install google-chrome-stable

# CentOS/RHEL
sudo yum install google-chrome-stable

# macOS
brew install --cask google-chrome
```

### تنظیم متغیر محیطی
```env
CHROME_PATH="/usr/bin/google-chrome"
```

## 🔐 اتصال WhatsApp

### 1. تولید QR Code

```http
POST /api/campaigns/:campaignId/qr-code
```

**Response:**
```json
{
  "message": "QR code generation initiated",
  "sessionId": "uuid-session-id",
  "instructions": "WhatsApp session is being prepared. QR code will be sent via WebSocket."
}
```

### 2. دریافت QR Code از WebSocket

```javascript
const socket = new WebSocket('ws://localhost:3000/ws/campaigns?campaignId=1&userId=1');

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'qr_code') {
    // نمایش QR Code به کاربر
    displayQRCode(data.data.qrCode);
  }
};
```

### 3. اسکن QR Code
- QR Code را با گوشی خود اسکن کنید
- در گوشی، WhatsApp > Settings > Linked Devices > Link a Device
- QR Code را اسکن کنید

### 4. تایید اتصال

```http
GET /api/campaigns/:campaignId/connection
```

**Response:**
```json
{
  "isConnected": true,
  "lastActivity": "2024-01-01T10:00:00Z",
  "hasActiveSession": true,
  "sessionId": "uuid-session-id"
}
```

## 📤 ارسال پیام

### شروع کمپین
```http
POST /api/campaigns/:campaignId/start
```

### نظارت بر پیشرفت
```javascript
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'progress_update':
      // به‌روزرسانی پیشرفت ارسال
      updateProgress(data.data.progress);
      break;
      
    case 'status_update':
      // به‌روزرسانی وضعیت
      updateStatus(data.data.status, data.data.message);
      break;
      
    case 'error_update':
      // نمایش خطاها
      showError(data.data.error);
      break;
  }
};
```

## 🔄 مدیریت جلسات

### بررسی جلسات فعال
```javascript
// در سرویس WhatsApp
const activeSessions = whatsappService.getActiveUserSessions(userId);
console.log(`Active sessions: ${activeSessions}`);
```

### پاکسازی جلسه
```http
POST /api/campaigns/:campaignId/cleanup-session
```

### بررسی وضعیت جلسه
```javascript
const hasSession = whatsappService.hasActiveSession(campaignId);
if (hasSession) {
  console.log('Campaign has active session');
}
```

## 📊 رویدادهای WhatsApp

### رویدادهای کلاینت
```javascript
client.on('qr', (qr) => {
  console.log('QR Code generated');
  // ارسال QR Code از طریق WebSocket
});

client.on('ready', () => {
  console.log('WhatsApp client ready');
  // به‌روزرسانی وضعیت اتصال
});

client.on('disconnected', (reason) => {
  console.log('WhatsApp disconnected:', reason);
  // پاکسازی جلسه
});
```

### رویدادهای پیام
```javascript
client.on('message', (message) => {
  console.log('Message received:', message.body);
  // پردازش پیام دریافتی
});

client.on('message_ack', (message, ack) => {
  console.log('Message acknowledged:', ack);
  // به‌روزرسانی وضعیت تحویل
});
```

## 🛠️ تنظیمات پیشرفته

### تنظیمات Puppeteer
```javascript
const client = new Client({
  authStrategy: new LocalAuth({ 
    clientId: `session-${userId}-${campaignId}` 
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ],
    executablePath: process.env.CHROME_PATH || undefined,
  }
});
```

### تنظیمات LocalAuth
```javascript
const authStrategy = new LocalAuth({
  clientId: `session-${userId}-${campaignId}`,
  dataPath: './whatsapp-sessions'
});
```

## 🔒 امنیت

### محدودیت‌های اتصال
- هر کاربر حداکثر 3 جلسه فعال
- جلسات بعد از 24 ساعت منقضی می‌شوند
- QR Code بعد از 5 دقیقه منقضی می‌شود

### پاکسازی خودکار
```javascript
// پاکسازی جلسات منقضی شده
setInterval(() => {
  whatsappService.cleanupExpiredSessions();
}, 60000); // هر دقیقه
```

### محدودیت‌های ارسال
- حداکثر 100 پیام در دقیقه
- فاصله حداقل 5 ثانیه بین پیام‌ها
- محدودیت بر اساس پکیج کاربر

## 📱 مدیریت پیام‌ها

### ارسال پیام متنی
```javascript
const numberId = `${phone}@c.us`;
await client.sendMessage(numberId, message);
```

### ارسال پیام با پیوست
```javascript
const media = MessageMedia.fromFilePath(filePath);
await client.sendMessage(numberId, media);
```

### ارسال پیام ترکیبی
```javascript
// ابتدا متن
await client.sendMessage(numberId, message);

// سپس پیوست
if (attachment) {
  const media = MessageMedia.fromFilePath(attachment.path);
  await client.sendMessage(numberId, media);
}
```

## 🔍 نظارت و عیب‌یابی

### لاگ‌های سیستم
```javascript
// فعال‌سازی لاگ‌های تفصیلی
client.on('qr', (qr) => {
  console.log('📱 QR Code generated for campaign', campaignId);
});

client.on('ready', () => {
  console.log('✅ WhatsApp client ready for campaign', campaignId);
});

client.on('disconnected', (reason) => {
  console.log('❌ WhatsApp disconnected:', reason);
});
```

### بررسی وضعیت اتصال
```javascript
const isConnected = client.info ? true : false;
const clientInfo = client.info ? {
  number: client.info.wid.user,
  name: client.info.pushname
} : null;
```

### مدیریت خطاها
```javascript
try {
  await client.sendMessage(numberId, message);
} catch (error) {
  console.error('Failed to send message:', error);
  
  // به‌روزرسانی وضعیت مخاطب
  await updateRecipientStatus(recipientId, 'FAILED', error.message);
}
```

## ⚡ بهینه‌سازی عملکرد

### مدیریت حافظه
```javascript
// پاکسازی منابع
client.destroy().then(() => {
  console.log('Client destroyed successfully');
});
```

### مدیریت اتصالات
```javascript
// محدودیت اتصالات همزمان
const maxConnections = 3;
if (activeConnections >= maxConnections) {
  throw new Error('Maximum connections reached');
}
```

### بهینه‌سازی ارسال
```javascript
// ارسال دسته‌ای
const batchSize = 10;
const batches = chunkArray(recipients, batchSize);

for (const batch of batches) {
  await Promise.all(batch.map(recipient => 
    sendMessage(recipient)
  ));
  
  // فاصله بین دسته‌ها
  await sleep(intervalMs);
}
```

## 🔄 بازیابی از خطا

### اتصال مجدد
```javascript
client.on('disconnected', async (reason) => {
  console.log('Disconnected:', reason);
  
  // تلاش برای اتصال مجدد
  setTimeout(async () => {
    try {
      await client.initialize();
    } catch (error) {
      console.error('Reconnection failed:', error);
    }
  }, 5000);
});
```

### بازیابی جلسه
```javascript
// بررسی وجود جلسه ذخیره شده
const sessionPath = `./whatsapp-sessions/session-${userId}-${campaignId}`;
if (fs.existsSync(sessionPath)) {
  console.log('Existing session found');
}
```

## 📊 آمار و گزارش‌گیری

### آمار ارسال
```javascript
const stats = {
  total: recipients.length,
  sent: sentCount,
  failed: failedCount,
  delivered: deliveredCount,
  deliveryRate: (sentCount / recipients.length) * 100
};
```

### گزارش خطاها
```javascript
const errors = recipients
  .filter(r => r.status === 'FAILED')
  .map(r => ({
    phone: r.phone,
    error: r.error,
    timestamp: r.sentAt
  }));
```

## 🚨 محدودیت‌ها و نکات مهم

### محدودیت‌های WhatsApp
- حداکثر 100 پیام در دقیقه
- فاصله حداقل 5 ثانیه بین پیام‌ها
- عدم ارسال پیام‌های اسپم
- رعایت قوانین WhatsApp

### نکات امنیتی
- عدم ذخیره اطلاعات حساس
- رمزنگاری جلسات
- محدودیت دسترسی
- نظارت بر فعالیت‌ها

### بهترین شیوه‌ها
- استفاده از فاصله مناسب
- ارسال پیام‌های مفید
- رعایت قوانین WhatsApp
- نظارت بر عملکرد

---

**نکته**: این راهنما به‌روزرسانی می‌شود. لطفاً آخرین نسخه را بررسی کنید.
