const axios = require('axios');
const WebSocket = require('ws');

const BASE_URL = 'http://localhost:3000';

async function testCompleteFlow() {
    let ws;
    
    try {
        console.log('🚀 Starting Complete WhatsApp Flow Test...\n');

        // 1. Login
        console.log('1️⃣ Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/api/user/login`, {
            email: 'ali@example.com',
            password: 'Passw0rd123!'
        });

        const token = loginResponse.data.token;
        const userId = loginResponse.data.user.id;
        console.log('✅ Login successful, User ID:', userId);

        // 2. Create Campaign
        console.log('\n2️⃣ Creating campaign...');
        const campaignResponse = await axios.post(`${BASE_URL}/api/campaigns`, {
            title: 'Complete Test Campaign',
            message: 'Hello from test campaign!',
            interval: '10s'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const campaignId = campaignResponse.data.campaign.id;
        console.log(`✅ Campaign created: ${campaignId}`);

        // 3. Connect to WebSocket
        console.log('\n3️⃣ Connecting to WebSocket...');
        ws = new WebSocket(`ws://localhost:3000/ws/campaigns?campaignId=${campaignId}&userId=${userId}`);
        
        ws.on('open', () => {
            console.log('✅ WebSocket connected');
        });
        
        ws.on('message', (data) => {
            const parsed = JSON.parse(data);
            console.log(`📨 WebSocket message: ${parsed.type}`);
            
            if (parsed.type === 'qr_code') {
                console.log('🎯 QR CODE RECEIVED!');
                console.log('QR Code:', parsed.data.qrCode);
                console.log('💡 Scan this QR code with WhatsApp');
            }
        });

        // Wait a bit for WebSocket connection
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 4. Generate QR Code
        console.log('\n4️⃣ Generating QR Code...');
        const qrResponse = await axios.post(`${BASE_URL}/api/campaigns/${campaignId}/qr-code`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ QR Code generation initiated');
        console.log('📱 Session ID:', qrResponse.data.sessionId);

        // 5. Wait for QR code via WebSocket
        console.log('\n5️⃣ Waiting for QR code via WebSocket...');
        console.log('⏳ Please wait for QR code to appear...');

        // Keep running to receive WebSocket messages
        await new Promise(resolve => {
            const timeout = setTimeout(() => {
                console.log('⏰ Timeout reached, stopping test');
                resolve();
            }, 30000); // 30 seconds timeout

            ws.on('message', (data) => {
                const parsed = JSON.parse(data);
                if (parsed.type === 'qr_code') {
                    clearTimeout(timeout);
                    console.log('🎯 QR CODE RECEIVED VIA WEBSOCKET!');
                    console.log('QR Code:', parsed.data.qrCode);
                    resolve();
                }
            });
        });

        // 6. Check Connection Status
        console.log('\n6️⃣ Checking connection status...');
        const connectionResponse = await axios.get(`${BASE_URL}/api/campaigns/${campaignId}/connection`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('📊 Connection status:', connectionResponse.data);

        console.log('\n🎉 Complete flow test finished!');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    } finally {
        if (ws) {
            ws.close();
        }
    }
}

testCompleteFlow();