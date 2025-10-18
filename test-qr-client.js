const WebSocket = require('ws');

// تنظیمات
const CAMPAIGN_ID = 1;
const USER_ID = 4;
const WS_URL = `ws://localhost:3000/ws/campaigns?campaignId=${CAMPAIGN_ID}&userId=${USER_ID}`;

console.log('🔌 اتصال به WebSocket...');
console.log(`URL: ${WS_URL}`);

const ws = new WebSocket(WS_URL);

ws.on('open', function() {
    console.log('✅ WebSocket متصل شد');
    console.log('📱 در انتظار QR کد...');
});

ws.on('message', function(data) {
    try {
        const message = JSON.parse(data);
        console.log('\n📨 پیام دریافت شد:');
        console.log(`نوع: ${message.type}`);
        console.log(`زمان: ${new Date().toLocaleString('fa-IR')}`);
        
        if (message.type === 'qr_code') {
            console.log('\n🎯 QR کد دریافت شد!');
            console.log('QR Code:', message.qrCode);
            console.log('\n💡 این QR کد را با WhatsApp موبایل خود اسکن کنید');
            console.log('📱 پس از اسکن، اتصال برقرار خواهد شد\n');
        } else if (message.type === 'status_update') {
            console.log(`📊 وضعیت: ${message.message}`);
        } else if (message.type === 'error') {
            console.log(`❌ خطا: ${message.message}`);
        } else {
            console.log('📨 پیام:', message);
        }
    } catch (error) {
        console.log('❌ خطا در پردازش پیام:', error.message);
    }
});

ws.on('close', function() {
    console.log('🔌 WebSocket قطع شد');
});

ws.on('error', function(error) {
    console.log('❌ خطا در WebSocket:', error.message);
});

// خروج تمیز
process.on('SIGINT', function() {
    console.log('\n🛑 در حال خروج...');
    ws.close();
    process.exit(0);
});

console.log('💡 برای خروج Ctrl+C را فشار دهید');
