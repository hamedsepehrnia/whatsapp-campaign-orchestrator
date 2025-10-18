const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testQRCode() {
    try {
        console.log('🚀 Testing QR Code Generation...\n');

        // 1. Login
        console.log('1️⃣ Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/api/user/login`, {
            email: 'ali@example.com',
            password: 'password123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // 2. Create Campaign
        console.log('\n2️⃣ Creating campaign...');
        const campaignResponse = await axios.post(`${BASE_URL}/api/campaigns`, {
            title: 'Test Campaign',
            message: 'Test message',
            interval: '10s'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const campaignId = campaignResponse.data.campaign.id;
        console.log(`✅ Campaign created: ${campaignId}`);

        // 3. Generate QR Code
        console.log('\n3️⃣ Generating QR Code...');
        const qrResponse = await axios.post(`${BASE_URL}/api/campaigns/${campaignId}/qr-code`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ QR Code generation initiated');
        console.log('📱 Session ID:', qrResponse.data.sessionId);
        console.log('💡 Instructions:', qrResponse.data.instructions);

        // 4. Check Connection Status
        console.log('\n4️⃣ Checking connection status...');
        const connectionResponse = await axios.get(`${BASE_URL}/api/campaigns/${campaignId}/connection`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('📊 Connection status:', connectionResponse.data);

        console.log('\n🎉 Test completed!');
        console.log('📱 Note: QR code will be sent via WebSocket');
        console.log('🔌 Connect to: ws://localhost:3000/ws/campaigns?campaignId=' + campaignId + '&userId=4');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testQRCode();
