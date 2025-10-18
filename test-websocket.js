const WebSocket = require('ws');

const campaignId = 1; // شناسه کمپین شما
const userId = 4;      // شناسه کاربر شما

console.log('🔌 Connecting to WebSocket...');
console.log(`URL: ws://localhost:3000/ws/campaigns?campaignId=${campaignId}&userId=${userId}`);

const ws = new WebSocket(`ws://localhost:3000/ws/campaigns?campaignId=${campaignId}&userId=${userId}`);

ws.on('open', function open() {
    console.log('✅ WebSocket connected successfully');
    console.log('📱 Waiting for QR code...');
});

ws.on('message', function message(data) {
    const parsed = JSON.parse(data);
    
    console.log('\n📨 Received message:');
    console.log('Type:', parsed.type);
    console.log('Campaign ID:', parsed.campaignId);
    console.log('Timestamp:', parsed.data.timestamp);
    
    switch(parsed.type) {
        case 'qr_code':
            console.log('🎯 QR CODE RECEIVED!');
            console.log('QR Code:', parsed.data.qrCode);
            console.log('💡 Scan this QR code with WhatsApp to connect');
            break;
            
        case 'status_update':
            console.log('📊 Status Update:');
            console.log('Status:', parsed.data.status);
            console.log('Message:', parsed.data.message);
            break;
            
        case 'progress_update':
            console.log('📈 Progress Update:');
            console.log('Progress:', parsed.data.progress);
            break;
            
        case 'error_update':
            console.log('❌ Error Update:');
            console.log('Error:', parsed.data.error);
            break;
            
        case 'completion_update':
            console.log('✅ Completion Update:');
            console.log('Report:', parsed.data.report);
            break;
            
        default:
            console.log('📋 Other message:', parsed);
    }
});

ws.on('error', function error(err) {
    console.error('❌ WebSocket error:', err);
});

ws.on('close', function close() {
    console.log('🔌 WebSocket connection closed');
});

// Keep the script running
process.on('SIGINT', () => {
    console.log('\n👋 Closing WebSocket connection...');
    ws.close();
    process.exit(0);
});
