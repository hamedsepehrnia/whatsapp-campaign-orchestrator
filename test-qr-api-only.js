const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testQRCodeAPI() {
    try {
        console.log('🚀 Testing QR Code API Only...\n');

        // 1. Login
        console.log('1️⃣ Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/api/user/login`, {
            email: 'ali@example.com',
            password: 'password123'
        });

        const token = loginResponse.data.token;
        const userId = loginResponse.data.user.id;
        console.log('✅ Login successful, User ID:', userId);

        // 2. Create Campaign
        console.log('\n2️⃣ Creating campaign...');
        const campaignResponse = await axios.post(`${BASE_URL}/api/campaigns`, {
            title: 'QR Test Campaign',
            message: 'Test message for QR',
            interval: '10s'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const campaignId = campaignResponse.data.campaign.id;
        console.log(`✅ Campaign created: ${campaignId}`);

        // 3. Generate QR Code (API only)
        console.log('\n3️⃣ Generating QR Code via API...');
        const qrResponse = await axios.post(`${BASE_URL}/api/campaigns/${campaignId}/qr-code`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ QR Code API Response:');
        console.log('📱 Message:', qrResponse.data.message);
        console.log('🆔 Session ID:', qrResponse.data.sessionId);
        console.log('📋 Instructions:', qrResponse.data.instructions);

        // 4. Check Connection Status
        console.log('\n4️⃣ Checking connection status...');
        const connectionResponse = await axios.get(`${BASE_URL}/api/campaigns/${campaignId}/connection`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('📊 Connection status:', connectionResponse.data);

        console.log('\n🎉 QR Code API test completed!');
        console.log('💡 Note: QR code will be sent via WebSocket when WhatsApp client is ready');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testQRCodeAPI();
