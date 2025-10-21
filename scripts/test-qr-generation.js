// Test QR Code Generation
const WebSocket = require('ws');

async function testQRGeneration() {
    const campaignId = 1;
    const userId = 1;

    console.log('🔄 تست تولید QR Code...');

    try {
        // 1. تولید QR Code
        const response = await fetch(`http://localhost:3000/api/campaigns/${campaignId}/qr-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('✅ پاسخ API:', data);

        // 2. اتصال به WebSocket
        console.log('🔌 اتصال به WebSocket...');
        const ws = new WebSocket(`ws://localhost:3000/ws/campaigns?campaignId=${campaignId}&userId=${userId}`);

        ws.on('open', () => {
            console.log('✅ WebSocket متصل شد');
        });

        ws.on('message', (data) => {
            const message = JSON.parse(data);
            console.log('📨 پیام دریافت شد:', message.type);

            if (message.type === 'qr_code') {
                console.log('📱 QR Code دریافت شد!');
                console.log('🔗 QR Code Data:', JSON.stringify(message.data.qrCode, null, 2));
                
                // بررسی نوع QR Code
                if (message.data.qrCode.image) {
                    console.log('🖼️ QR Code Image موجود است');
                    // ذخیره QR Code در فایل
                    const fs = require('fs');
                    const base64Data = message.data.qrCode.image.replace(/^data:image\/png;base64,/, '');
                    fs.writeFileSync('qr-code.png', base64Data, 'base64');
                    console.log('💾 QR Code در فایل qr-code.png ذخیره شد');
                }
                
                if (message.data.qrCode.raw) {
                    console.log('📝 Raw QR Code:', message.data.qrCode.raw.substring(0, 50) + '...');
                }
                
                if (message.data.qrCode.url) {
                    console.log('🔗 WhatsApp URL:', message.data.qrCode.url);
                }
            }
        });

        ws.on('close', () => {
            console.log('❌ WebSocket قطع شد');
        });

        ws.on('error', (error) => {
            console.error('❌ خطای WebSocket:', error);
        });

    } catch (error) {
        console.error('❌ خطا:', error);
    }
}

// اجرای تست
testQRGeneration();
