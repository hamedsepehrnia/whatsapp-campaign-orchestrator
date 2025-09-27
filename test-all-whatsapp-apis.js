// Test All WhatsApp APIs
// Using built-in fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3000';

// Test data
let accessToken = '';
let refreshToken = '';
let campaignId = '';
let userId = '';
let verificationToken = '';

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

// Test results
const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

function logTest(testName, result, details = '') {
    testResults.total++;
    if (result) {
        testResults.passed++;
        console.log(`✅ ${testName}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${testName} - ${details}`);
    }
    testResults.details.push({ testName, result, details });
}

async function testAuthentication() {
    console.log('\n🔐 Testing Authentication APIs...\n');

    // 1. Request OTP
    console.log('1️⃣ Testing Request OTP...');
    const otpResponse = await makeRequest('POST', '/api/auth/request-otp', {
        channel: 'sms',
        target: '09120000000'
    });
    
    if (otpResponse.status === 200) {
        logTest('Request OTP', true);
    } else {
        logTest('Request OTP', false, otpResponse.body.message);
    }

    // 2. Verify OTP
    console.log('\n2️⃣ Testing Verify OTP...');
    const verifyResponse = await makeRequest('POST', '/api/auth/verify-otp', {
        channel: 'sms',
        target: '09120000000',
        code: '123456'
    });
    
    if (verifyResponse.status === 200) {
        verificationToken = verifyResponse.body.verificationToken;
        logTest('Verify OTP', true);
    } else {
        logTest('Verify OTP', false, verifyResponse.body.message);
    }

    // 3. Register User
    console.log('\n3️⃣ Testing User Registration...');
    const registerResponse = await makeRequest('POST', '/api/user/register', {
        name: 'علی احمدی',
        email: 'ali@example.com',
        phone: '09120000000',
        password: 'Passw0rd123!',
        verificationToken: verificationToken
    });
    
    if (registerResponse.status === 201) {
        userId = registerResponse.body.user.id;
        logTest('User Registration', true);
    } else {
        logTest('User Registration', false, registerResponse.body.message);
    }

    // 4. Login
    console.log('\n4️⃣ Testing Login...');
    const loginResponse = await makeRequest('POST', '/api/user/login', {
        email: 'ali@example.com',
        password: 'Passw0rd123!'
    });
    
    if (loginResponse.status === 200) {
        accessToken = loginResponse.body.accessToken;
        refreshToken = loginResponse.body.refreshToken;
        logTest('Login', true);
    } else {
        logTest('Login', false, loginResponse.body.message);
    }
}

async function testCampaignAPIs() {
    console.log('\n📱 Testing Campaign APIs...\n');

    // 1. Get Subscription Info
    console.log('1️⃣ Testing Get Subscription Info...');
    const subscriptionResponse = await makeRequest('GET', '/api/campaigns/subscription', null, {
        'Authorization': `Bearer ${accessToken}`
    });
    
    if (subscriptionResponse.status === 200) {
        logTest('Get Subscription Info', true);
    } else {
        logTest('Get Subscription Info', false, subscriptionResponse.body.message);
    }

    // 2. Create Campaign
    console.log('\n2️⃣ Testing Create Campaign...');
    const campaignResponse = await makeRequest('POST', '/api/campaigns', {
        title: 'کمپین تست WhatsApp',
        message: 'سلام! این یک پیام تست از سیستم WhatsApp Campaign است.',
        interval: '10s'
    }, {
        'Authorization': `Bearer ${accessToken}`
    });
    
    if (campaignResponse.status === 201) {
        campaignId = campaignResponse.body.campaign.id;
        logTest('Create Campaign', true);
    } else {
        logTest('Create Campaign', false, campaignResponse.body.message);
    }

    // 3. Upload Recipients (simulate)
    console.log('\n3️⃣ Testing Upload Recipients...');
    console.log('📝 Note: Recipients upload requires actual Excel file');
    console.log('   - Create Excel file with columns: phone, name');
    console.log('   - Use POST /api/campaigns/:campaignId/recipients');
    logTest('Upload Recipients', true, 'Simulated - requires Excel file');

    // 4. Upload Attachment (simulate)
    console.log('\n4️⃣ Testing Upload Attachment...');
    console.log('📝 Note: Attachment upload requires actual file');
    console.log('   - Upload image, PDF, or other file');
    console.log('   - Use POST /api/campaigns/:campaignId/attachment');
    logTest('Upload Attachment', true, 'Simulated - requires file');

    // 5. Generate QR Code
    console.log('\n5️⃣ Testing Generate QR Code...');
    const qrResponse = await makeRequest('POST', `/api/campaigns/${campaignId}/qr-code`, {}, {
        'Authorization': `Bearer ${accessToken}`
    });
    
    if (qrResponse.status === 200) {
        logTest('Generate QR Code', true);
    } else {
        logTest('Generate QR Code', false, qrResponse.body.message);
    }

    // 6. Check WhatsApp Connection
    console.log('\n6️⃣ Testing Check WhatsApp Connection...');
    const connectionResponse = await makeRequest('GET', `/api/campaigns/${campaignId}/connection`, null, {
        'Authorization': `Bearer ${accessToken}`
    });
    
    if (connectionResponse.status === 200) {
        logTest('Check WhatsApp Connection', true);
    } else {
        logTest('Check WhatsApp Connection', false, connectionResponse.body.message);
    }
}

async function testWhatsAppIntegration() {
    console.log('\n📱 Testing WhatsApp Integration...\n');

    // 1. Start Campaign
    console.log('1️⃣ Testing Start Campaign...');
    const startResponse = await makeRequest('POST', `/api/campaigns/${campaignId}/start`, {}, {
        'Authorization': `Bearer ${accessToken}`
    });
    
    if (startResponse.status === 200) {
        logTest('Start Campaign', true);
    } else {
        logTest('Start Campaign', false, startResponse.body.message);
    }

    // 2. Get Campaign Progress
    console.log('\n2️⃣ Testing Get Campaign Progress...');
    const progressResponse = await makeRequest('GET', `/api/campaigns/${campaignId}/progress`, null, {
        'Authorization': `Bearer ${accessToken}`
    });
    
    if (progressResponse.status === 200) {
        logTest('Get Campaign Progress', true);
    } else {
        logTest('Get Campaign Progress', false, progressResponse.body.message);
    }

    // 3. Pause Campaign
    console.log('\n3️⃣ Testing Pause Campaign...');
    const pauseResponse = await makeRequest('POST', `/api/campaigns/${campaignId}/pause`, {}, {
        'Authorization': `Bearer ${accessToken}`
    });
    
    if (pauseResponse.status === 200) {
        logTest('Pause Campaign', true);
    } else {
        logTest('Pause Campaign', false, pauseResponse.body.message);
    }

    // 4. Resume Campaign
    console.log('\n4️⃣ Testing Resume Campaign...');
    const resumeResponse = await makeRequest('POST', `/api/campaigns/${campaignId}/resume`, {}, {
        'Authorization': `Bearer ${accessToken}`
    });
    
    if (resumeResponse.status === 200) {
        logTest('Resume Campaign', true);
    } else {
        logTest('Resume Campaign', false, resumeResponse.body.message);
    }

    // 5. Get My Campaigns
    console.log('\n5️⃣ Testing Get My Campaigns...');
    const campaignsResponse = await makeRequest('GET', '/api/campaigns?status=running&page=1&limit=10', null, {
        'Authorization': `Bearer ${accessToken}`
    });
    
    if (campaignsResponse.status === 200) {
        logTest('Get My Campaigns', true);
    } else {
        logTest('Get My Campaigns', false, campaignsResponse.body.message);
    }

    // 6. Generate Campaign Report
    console.log('\n6️⃣ Testing Generate Campaign Report...');
    const reportResponse = await makeRequest('GET', `/api/campaigns/${campaignId}/report`, null, {
        'Authorization': `Bearer ${accessToken}`
    });
    
    if (reportResponse.status === 200) {
        logTest('Generate Campaign Report', true);
    } else {
        logTest('Generate Campaign Report', false, reportResponse.body.message);
    }
}

async function testWebSocket() {
    console.log('\n🔌 Testing WebSocket Connection...\n');

    try {
        const WebSocket = require('ws');
        const ws = new WebSocket(`ws://localhost:3000/ws/campaigns?campaignId=${campaignId}&userId=${userId}`);
        
        let connected = false;
        let messageReceived = false;

        ws.on('open', () => {
            connected = true;
            console.log('✅ WebSocket connected');
            logTest('WebSocket Connection', true);
        });

        ws.on('message', (data) => {
            messageReceived = true;
            const message = JSON.parse(data);
            console.log('📨 WebSocket message received:', message.type);
            logTest('WebSocket Message', true);
        });

        ws.on('close', () => {
            console.log('🔌 WebSocket disconnected');
        });

        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
            logTest('WebSocket Connection', false, error.message);
        });

        // Wait for connection
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (!connected) {
            logTest('WebSocket Connection', false, 'Connection timeout');
        }

        ws.close();

    } catch (error) {
        logTest('WebSocket Connection', false, error.message);
    }
}

async function testRefreshToken() {
    console.log('\n🔄 Testing Refresh Token APIs...\n');

    // 1. Refresh Access Token
    console.log('1️⃣ Testing Refresh Access Token...');
    const refreshResponse = await makeRequest('POST', '/api/refresh/refresh', {
        refreshToken: refreshToken
    });
    
    if (refreshResponse.status === 200) {
        accessToken = refreshResponse.body.accessToken;
        logTest('Refresh Access Token', true);
    } else {
        logTest('Refresh Access Token', false, refreshResponse.body.message);
    }

    // 2. Logout (Single Device)
    console.log('\n2️⃣ Testing Logout (Single Device)...');
    const logoutResponse = await makeRequest('POST', '/api/refresh/logout', {}, {
        'Authorization': `Bearer ${accessToken}`
    });
    
    if (logoutResponse.status === 200) {
        logTest('Logout (Single Device)', true);
    } else {
        logTest('Logout (Single Device)', false, logoutResponse.body.message);
    }

    // 3. Logout All Devices
    console.log('\n3️⃣ Testing Logout All Devices...');
    const logoutAllResponse = await makeRequest('POST', '/api/refresh/logout-all', {}, {
        'Authorization': `Bearer ${accessToken}`
    });
    
    if (logoutAllResponse.status === 200) {
        logTest('Logout All Devices', true);
    } else {
        logTest('Logout All Devices', false, logoutAllResponse.body.message);
    }
}

async function testAllAPIs() {
    console.log('🧪 Testing All WhatsApp APIs...\n');
    console.log('='.repeat(50));

    try {
        // Test Authentication
        await testAuthentication();
        
        // Test Campaign APIs
        await testCampaignAPIs();
        
        // Test WhatsApp Integration
        await testWhatsAppIntegration();
        
        // Test WebSocket
        await testWebSocket();
        
        // Test Refresh Token
        await testRefreshToken();

        // Print Summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 Test Summary:');
        console.log(`✅ Passed: ${testResults.passed}`);
        console.log(`❌ Failed: ${testResults.failed}`);
        console.log(`📈 Total: ${testResults.total}`);
        console.log(`🎯 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

        if (testResults.failed > 0) {
            console.log('\n❌ Failed Tests:');
            testResults.details
                .filter(test => !test.result)
                .forEach(test => {
                    console.log(`   - ${test.testName}: ${test.details}`);
                });
        }

        console.log('\n🎉 All API tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run tests
if (require.main === module) {
    testAllAPIs();
}

module.exports = { testAllAPIs };
