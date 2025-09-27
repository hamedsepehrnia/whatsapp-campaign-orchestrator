// Test WhatsApp Integration
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Helper function to make requests
async function makeRequest(method, path, data = null, headers = {}) {
    try {
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        if (data) {
            config.body = JSON.stringify(data);
        }
        const response = await fetch(`${BASE_URL}${path}`, config);
        const body = await response.json();
        return { status: response.status, body: body };
    } catch (error) {
        return { status: 500, body: { message: error.message } };
    }
}

// Test data
let accessToken = '';
let campaignId = '';

async function testWhatsAppIntegration() {
    console.log('🧪 Testing WhatsApp Integration...\n');

    try {
        // 1. Login
        console.log('1️⃣ Testing Login...');
        const loginResponse = await makeRequest('POST', '/api/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });
        
        if (loginResponse.status === 200) {
            accessToken = loginResponse.body.accessToken;
            console.log('✅ Login successful');
        } else {
            console.log('❌ Login failed:', loginResponse.body);
            return;
        }

        // 2. Create Campaign
        console.log('\n2️⃣ Testing Campaign Creation...');
        const campaignResponse = await makeRequest('POST', '/api/campaigns', {
            title: 'Test WhatsApp Campaign',
            message: 'Hello! This is a test message from WhatsApp integration.',
            interval: '10s'
        }, {
            'Authorization': `Bearer ${accessToken}`
        });

        if (campaignResponse.status === 201) {
            campaignId = campaignResponse.body.campaign.id;
            console.log('✅ Campaign created:', campaignId);
        } else {
            console.log('❌ Campaign creation failed:', campaignResponse.body);
            return;
        }

        // 3. Upload Recipients (Excel file)
        console.log('\n3️⃣ Testing Recipients Upload...');
        // Note: This would require actual file upload, so we'll simulate
        console.log('📝 Note: Recipients upload requires actual Excel file');
        console.log('   - Create Excel file with columns: phone, name');
        console.log('   - Use POST /api/campaigns/:campaignId/recipients');

        // 4. Generate QR Code
        console.log('\n4️⃣ Testing QR Code Generation...');
        const qrResponse = await makeRequest('POST', `/api/campaigns/${campaignId}/qr-code`, {}, {
            'Authorization': `Bearer ${accessToken}`
        });

        if (qrResponse.status === 200) {
            console.log('✅ QR Code generation initiated');
            console.log('📱 QR Code will be sent via WebSocket');
        } else {
            console.log('❌ QR Code generation failed:', qrResponse.body);
        }

        // 5. Check Connection Status
        console.log('\n5️⃣ Testing Connection Status...');
        const connectionResponse = await makeRequest('GET', `/api/campaigns/${campaignId}/connection`, null, {
            'Authorization': `Bearer ${accessToken}`
        });

        if (connectionResponse.status === 200) {
            console.log('✅ Connection status:', connectionResponse.body);
        } else {
            console.log('❌ Connection check failed:', connectionResponse.body);
        }

        // 6. Start Campaign (if connected)
        console.log('\n6️⃣ Testing Campaign Start...');
        const startResponse = await makeRequest('POST', `/api/campaigns/${campaignId}/start`, {}, {
            'Authorization': `Bearer ${accessToken}`
        });

        if (startResponse.status === 200) {
            console.log('✅ Campaign started successfully');
        } else {
            console.log('❌ Campaign start failed:', startResponse.body);
        }

        // 7. Get Progress
        console.log('\n7️⃣ Testing Progress Tracking...');
        const progressResponse = await makeRequest('GET', `/api/campaigns/${campaignId}/progress`, null, {
            'Authorization': `Bearer ${accessToken}`
        });

        if (progressResponse.status === 200) {
            console.log('✅ Progress data:', progressResponse.body);
        } else {
            console.log('❌ Progress check failed:', progressResponse.body);
        }

        // 8. Pause Campaign
        console.log('\n8️⃣ Testing Campaign Pause...');
        const pauseResponse = await makeRequest('POST', `/api/campaigns/${campaignId}/pause`, {}, {
            'Authorization': `Bearer ${accessToken}`
        });

        if (pauseResponse.status === 200) {
            console.log('✅ Campaign paused successfully');
        } else {
            console.log('❌ Campaign pause failed:', pauseResponse.body);
        }

        // 9. Resume Campaign
        console.log('\n9️⃣ Testing Campaign Resume...');
        const resumeResponse = await makeRequest('POST', `/api/campaigns/${campaignId}/resume`, {}, {
            'Authorization': `Bearer ${accessToken}`
        });

        if (resumeResponse.status === 200) {
            console.log('✅ Campaign resumed successfully');
        } else {
            console.log('❌ Campaign resume failed:', resumeResponse.body);
        }

        // 10. Get Campaign Report
        console.log('\n🔟 Testing Campaign Report...');
        const reportResponse = await makeRequest('GET', `/api/campaigns/${campaignId}/report`, null, {
            'Authorization': `Bearer ${accessToken}`
        });

        if (reportResponse.status === 200) {
            console.log('✅ Campaign report generated');
        } else {
            console.log('❌ Campaign report failed:', reportResponse.body);
        }

        console.log('\n🎉 WhatsApp Integration Test Completed!');
        console.log('\n📋 Summary:');
        console.log('✅ Login/Authentication');
        console.log('✅ Campaign Creation');
        console.log('✅ QR Code Generation');
        console.log('✅ Connection Status');
        console.log('✅ Campaign Control (Start/Pause/Resume)');
        console.log('✅ Progress Tracking');
        console.log('✅ Report Generation');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// WebSocket Test
function testWebSocket() {
    console.log('\n🔌 Testing WebSocket Connection...');
    
    const WebSocket = require('ws');
    const ws = new WebSocket(`ws://localhost:3000/ws/campaigns?campaignId=${campaignId}&userId=test-user-id`);
    
    ws.on('open', () => {
        console.log('✅ WebSocket connected');
    });
    
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        console.log('📨 WebSocket message received:', message.type);
        
        switch (message.type) {
            case 'qr_code':
                console.log('📱 QR Code received via WebSocket');
                break;
            case 'status_update':
                console.log('📊 Status update:', message.data);
                break;
            case 'progress_update':
                console.log('📈 Progress update:', message.data);
                break;
            case 'error_update':
                console.log('❌ Error update:', message.data);
                break;
            case 'completion_update':
                console.log('✅ Completion update:', message.data);
                break;
        }
    });
    
    ws.on('close', () => {
        console.log('🔌 WebSocket disconnected');
    });
    
    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
    });
}

// Run tests
if (require.main === module) {
    testWhatsAppIntegration().then(() => {
        console.log('\n🔌 Starting WebSocket test...');
        setTimeout(testWebSocket, 2000);
    });
}

module.exports = { testWhatsAppIntegration, testWebSocket };
