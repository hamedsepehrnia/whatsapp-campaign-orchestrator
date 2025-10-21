// تست ساده QR Code - مشابه کد تست شما
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');

console.log('🔄 شروع تست QR Code...');

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'test-session'
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let latestQr = null;
let qrTimestamp = null;

client.on('qr', async (qr) => {
    console.log('📱 QR Code دریافت شد!');
    latestQr = qr;
    qrTimestamp = Date.now();
    
    try {
        // تولید تصویر QR Code مثل کد تست
        const dataUrl = await QRCode.toDataURL(qr, { 
            errorCorrectionLevel: 'M', 
            margin: 1, 
            width: 300 
        });
        
        console.log('✅ QR Code تصویر تولید شد');
        console.log('📊 طول QR Code:', qr.length);
        console.log('🕐 زمان تولید:', new Date(qrTimestamp).toLocaleString());
        
        // ذخیره در فایل برای تست
        const fs = require('fs');
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync('test-qr-code.png', base64Data, 'base64');
        console.log('💾 QR Code در فایل test-qr-code.png ذخیره شد');
        
    } catch (error) {
        console.error('❌ خطا در تولید تصویر QR Code:', error);
    }
});

client.on('ready', () => {
    console.log('✅ WhatsApp client آماده است');
    process.exit(0); // خروج بعد از اتصال موفق
});

client.on('authenticated', () => {
    console.log('🔐 احراز هویت موفق');
});

client.on('auth_failure', (msg) => {
    console.error('❌ خطا در احراز هویت:', msg);
});

client.on('disconnected', (reason) => {
    console.log('❌ اتصال قطع شد:', reason);
});

// شروع کلاینت
client.initialize();

// Timeout بعد از 60 ثانیه
setTimeout(() => {
    console.log('⏰ Timeout - خروج از برنامه');
    process.exit(1);
}, 60000);
