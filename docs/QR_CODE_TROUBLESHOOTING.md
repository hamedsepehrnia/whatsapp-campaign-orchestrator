# 🔧 عیب‌یابی QR Code WhatsApp

## 🎯 مشکل: "Couldn't Load Link"

وقتی QR Code را با گوشی اسکن می‌کنید، پیام "Couldn't Load Link" دریافت می‌کنید.

## 🔍 علل احتمالی

### 1. فرمت نادرست QR Code
QR Code باید به فرمت صحیح تولید شود.

### 2. مشکل در URL
URL تولید شده ممکن است نادرست باشد.

### 3. مشکل در کتابخانه
کتابخانه `whatsapp-web.js` ممکن است QR Code نادرست تولید کند.

## ✅ راه‌حل‌ها

### 1. تست فرمت‌های مختلف QR Code

```javascript
// فرمت 1: Raw QR Code (پیشنهادی)
const rawQR = '2@ybohIfUse1nhF4ZIsFqKSILiWXQR7Lxq1R76RMkflFa0pwgZkfeiXeLRPZjmQ5DZHj9Ji5VkMj0U9oBximpwLMgqLmlBVvzx6FM=,MK+YZoJ3Sqj0MUr5eATdyJry1pgFuMSx8sB65Dxg4CE=,Wm3zKDJb3FD79eRFtqkLDFeKI499gSImU1zKmJPlIT8=,HHWC4kkzzNuWIMaI8NNvVI4nvajuvxap/FmZ8ldLflY=,1';

// فرمت 2: با URL
const urlQR = `https://wa.me/settings/linked_devices#${rawQR}`;

// فرمت 3: WhatsApp Web
const webQR = `https://web.whatsapp.com/#${rawQR}`;
```

### 2. بررسی QR Code در کد

```javascript
// در whatsappService.js
client.on('qr', async (qr) => {
    console.log('📱 Raw QR Code:', qr);
    console.log('📱 QR Code length:', qr.length);
    console.log('📱 QR Code type:', typeof qr);
    
    // تست فرمت‌های مختلف
    const formats = {
        raw: qr,
        url: `https://wa.me/settings/linked_devices#${qr}`,
        web: `https://web.whatsapp.com/#${qr}`
    };
    
    console.log('📱 QR Code formats:', formats);
});
```

### 3. تست در مرورگر

فایل `public/test-qr-code.html` را باز کنید و QR Code های مختلف را تست کنید.

## 🔧 تغییرات انجام شده

### 1. تغییر در `whatsappService.js`

```javascript
// قبل از تغییر
const whatsappQRUrl = `https://wa.me/settings/linked_devices#${qr}`;

// بعد از تغییر
const whatsappQRUrl = qr; // استفاده از QR Code خام
```

### 2. تولید QR Code تصویری

```javascript
// تولید QR Code تصویری
const qrCodeData = {
    raw: qr,
    url: whatsappQRUrl,
    image: await this.generateQRCodeImage(qr)
};
```

### 3. تابع تولید QR Code

```javascript
async generateQRCodeImage(qrData) {
    try {
        const QRCode = require('qrcode');
        const qrImage = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        return qrImage;
    } catch (error) {
        console.error('Error generating QR code image:', error);
        return null;
    }
}
```

## 📱 تست QR Code

### 1. تست در مرورگر

```bash
# باز کردن فایل تست
open public/test-qr-code.html
```

### 2. تست با گوشی

1. QR Code را با گوشی اسکن کنید
2. ببینید کدام فرمت کار می‌کند
3. نتایج را گزارش دهید

### 3. تست با WhatsApp

1. WhatsApp را در گوشی باز کنید
2. Settings > Linked Devices > Link a Device
3. QR Code را اسکن کنید

## 🔍 عیب‌یابی پیشرفته

### 1. بررسی لاگ‌ها

```javascript
// فعال‌سازی لاگ‌های تفصیلی
client.on('qr', (qr) => {
    console.log('📱 QR Code received:', {
        length: qr.length,
        type: typeof qr,
        preview: qr.substring(0, 50) + '...'
    });
});
```

### 2. بررسی اتصال

```javascript
// بررسی وضعیت اتصال
client.on('ready', () => {
    console.log('✅ WhatsApp client ready');
    console.log('📱 Client info:', client.info);
});
```

### 3. بررسی خطاها

```javascript
// بررسی خطاهای اتصال
client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp disconnected:', reason);
});
```

## 🚀 راه‌حل نهایی

### 1. استفاده از QR Code خام

```javascript
// ارسال QR Code خام به فرانت‌اند
await websocketService.sendQRCode(campaignId, qr, userId);
```

### 2. تولید QR Code تصویری در فرانت‌اند

```javascript
// در فرانت‌اند
function displayQRCode(qrData) {
    if (typeof QRCode !== 'undefined') {
        new QRCode(container, {
            text: qrData,
            width: 300,
            height: 300,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}
```

### 3. تست کامل

```bash
# تست QR Code
node -e "
const qr = '2@ybohIfUse1nhF4ZIsFqKSILiWXQR7Lxq1R76RMkflFa0pwgZkfeiXeLRPZjmQ5DZHj9Ji5VkMj0U9oBximpwLMgqLmlBVvzx6FM=,MK+YZoJ3Sqj0MUr5eATdyJry1pgFuMSx8sB65Dxg4CE=,Wm3zKDJb3FD79eRFtqkLDFeKI499gSImU1zKmJPlIT8=,HHWC4kkzzNuWIMaI8NNvVI4nvajuvxap/FmZ8ldLflY=,1';
console.log('QR Code:', qr);
console.log('Length:', qr.length);
"
```

## 📋 چک‌لیست عیب‌یابی

- [ ] QR Code به فرمت صحیح تولید می‌شود
- [ ] QR Code در فرانت‌اند نمایش داده می‌شود
- [ ] QR Code با گوشی اسکن می‌شود
- [ ] WhatsApp اتصال را تشخیص می‌دهد
- [ ] اتصال برقرار می‌شود
- [ ] پیام‌ها ارسال می‌شوند

## 🎯 نتیجه

با این تغییرات، QR Code باید به درستی کار کند و مشکل "Couldn't Load Link" حل شود.

---

**نکته**: اگر مشکل همچنان پابرجاست، لاگ‌های سرور را بررسی کنید و نتایج تست را گزارش دهید.
