// Complete API Testing
const BASE_URL = 'http://localhost:3000';

// Test results
const results = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

// Helper function
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

function logTest(testName, result, details = '') {
    results.total++;
    if (result) {
        results.passed++;
        console.log(`✅ ${testName}`);
    } else {
        results.failed++;
        console.log(`❌ ${testName} - ${details}`);
    }
    results.details.push({ testName, result, details });
}

// Test data
let accessToken = '';
let refreshToken = '';
let campaignId = '';
let userId = '';
let verificationToken = '';

async function testAllAPIs() {
    console.log('🧪 Testing All WhatsApp APIs...\n');
    console.log('='.repeat(60));

    // Wait for server to start
    console.log('⏳ Waiting for server to start...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
        // 1. Test Authentication APIs
        console.log('\n🔐 Testing Authentication APIs...\n');
        
        // Request OTP
        console.log('1. Testing Request OTP...');
        const otpResponse = await makeRequest('POST', '/api/auth/request-otp', {
            channel: 'sms',
            target: '09120000000'
        });
        logTest('Request OTP', otpResponse.status === 200, otpResponse.body.message);

        // Verify OTP
        console.log('\n2. Testing Verify OTP...');
        const verifyResponse = await makeRequest('POST', '/api/auth/verify-otp', {
            channel: 'sms',
            target: '09120000000',
            code: '123456'
        });
        if (verifyResponse.status === 200) {
            verificationToken = verifyResponse.body.verificationToken;
        }
        logTest('Verify OTP', verifyResponse.status === 200, verifyResponse.body.message);

        // Register User
        console.log('\n3. Testing User Registration...');
        const registerResponse = await makeRequest('POST', '/api/user/register', {
            name: 'علی احمدی',
            email: 'ali@example.com',
            phone: '09120000000',
            password: 'Passw0rd123!',
            verificationToken: verificationToken || 'test-token'
        });
        if (registerResponse.status === 201) {
            userId = registerResponse.body.user.id;
        }
        logTest('User Registration', registerResponse.status === 201, registerResponse.body.message);

        // Login
        console.log('\n4. Testing Login...');
        const loginResponse = await makeRequest('POST', '/api/user/login', {
            email: 'ali@example.com',
            password: 'Passw0rd123!'
        });
        if (loginResponse.status === 200) {
            accessToken = loginResponse.body.accessToken;
            refreshToken = loginResponse.body.refreshToken;
        }
        logTest('Login', loginResponse.status === 200, loginResponse.body.message);

        // 2. Test Campaign APIs
        console.log('\n📱 Testing Campaign APIs...\n');

        // Get Subscription Info
        console.log('5. Testing Get Subscription Info...');
        const subscriptionResponse = await makeRequest('GET', '/api/campaigns/subscription', null, {
            'Authorization': `Bearer ${accessToken || 'test-token'}`
        });
        logTest('Get Subscription Info', subscriptionResponse.status === 200, subscriptionResponse.body.message);

        // Create Campaign
        console.log('\n6. Testing Create Campaign...');
        const campaignResponse = await makeRequest('POST', '/api/campaigns', {
            title: 'کمپین تست WhatsApp',
            message: 'سلام! این یک پیام تست از سیستم WhatsApp Campaign است.',
            interval: '10s'
        }, {
            'Authorization': `Bearer ${accessToken || 'test-token'}`
        });
        if (campaignResponse.status === 201) {
            campaignId = campaignResponse.body.campaign.id;
        }
        logTest('Create Campaign', campaignResponse.status === 201, campaignResponse.body.message);

        // Generate QR Code
        console.log('\n7. Testing Generate QR Code...');
        const qrResponse = await makeRequest('POST', `/api/campaigns/${campaignId || 'test-campaign-id'}/qr-code`, {}, {
            'Authorization': `Bearer ${accessToken || 'test-token'}`
        });
        logTest('Generate QR Code', qrResponse.status === 200, qrResponse.body.message);

        // Check Connection
        console.log('\n8. Testing Check WhatsApp Connection...');
        const connectionResponse = await makeRequest('GET', `/api/campaigns/${campaignId || 'test-campaign-id'}/connection`, null, {
            'Authorization': `Bearer ${accessToken || 'test-token'}`
        });
        logTest('Check WhatsApp Connection', connectionResponse.status === 200, connectionResponse.body.message);

        // Start Campaign
        console.log('\n9. Testing Start Campaign...');
        const startResponse = await makeRequest('POST', `/api/campaigns/${campaignId || 'test-campaign-id'}/start`, {}, {
            'Authorization': `Bearer ${accessToken || 'test-token'}`
        });
        logTest('Start Campaign', startResponse.status === 200, startResponse.body.message);

        // Get Progress
        console.log('\n10. Testing Get Campaign Progress...');
        const progressResponse = await makeRequest('GET', `/api/campaigns/${campaignId || 'test-campaign-id'}/progress`, null, {
            'Authorization': `Bearer ${accessToken || 'test-token'}`
        });
        logTest('Get Campaign Progress', progressResponse.status === 200, progressResponse.body.message);

        // Pause Campaign
        console.log('\n11. Testing Pause Campaign...');
        const pauseResponse = await makeRequest('POST', `/api/campaigns/${campaignId || 'test-campaign-id'}/pause`, {}, {
            'Authorization': `Bearer ${accessToken || 'test-token'}`
        });
        logTest('Pause Campaign', pauseResponse.status === 200, pauseResponse.body.message);

        // Resume Campaign
        console.log('\n12. Testing Resume Campaign...');
        const resumeResponse = await makeRequest('POST', `/api/campaigns/${campaignId || 'test-campaign-id'}/resume`, {}, {
            'Authorization': `Bearer ${accessToken || 'test-token'}`
        });
        logTest('Resume Campaign', resumeResponse.status === 200, resumeResponse.body.message);

        // Get My Campaigns
        console.log('\n13. Testing Get My Campaigns...');
        const campaignsResponse = await makeRequest('GET', '/api/campaigns?status=running&page=1&limit=10', null, {
            'Authorization': `Bearer ${accessToken || 'test-token'}`
        });
        logTest('Get My Campaigns', campaignsResponse.status === 200, campaignsResponse.body.message);

        // Generate Report
        console.log('\n14. Testing Generate Campaign Report...');
        const reportResponse = await makeRequest('GET', `/api/campaigns/${campaignId || 'test-campaign-id'}/report`, null, {
            'Authorization': `Bearer ${accessToken || 'test-token'}`
        });
        logTest('Generate Campaign Report', reportResponse.status === 200, reportResponse.body.message);

        // 3. Test Refresh Token APIs
        console.log('\n🔄 Testing Refresh Token APIs...\n');

        // Refresh Access Token
        console.log('15. Testing Refresh Access Token...');
        const refreshResponse = await makeRequest('POST', '/api/refresh/refresh', {
            refreshToken: refreshToken || 'test-refresh-token'
        });
        if (refreshResponse.status === 200) {
            accessToken = refreshResponse.body.accessToken;
        }
        logTest('Refresh Access Token', refreshResponse.status === 200, refreshResponse.body.message);

        // Logout
        console.log('\n16. Testing Logout...');
        const logoutResponse = await makeRequest('POST', '/api/refresh/logout', {}, {
            'Authorization': `Bearer ${accessToken || 'test-token'}`
        });
        logTest('Logout', logoutResponse.status === 200, logoutResponse.body.message);

        // Logout All
        console.log('\n17. Testing Logout All...');
        const logoutAllResponse = await makeRequest('POST', '/api/refresh/logout-all', {}, {
            'Authorization': `Bearer ${accessToken || 'test-token'}`
        });
        logTest('Logout All', logoutAllResponse.status === 200, logoutAllResponse.body.message);

        // 4. Test WebSocket
        console.log('\n🔌 Testing WebSocket Connection...\n');
        
        console.log('18. Testing WebSocket Connection...');
        try {
            const WebSocket = require('ws');
            const ws = new WebSocket(`ws://localhost:3000/ws/campaigns?campaignId=${campaignId || 'test-campaign-id'}&userId=${userId || 'test-user-id'}`);
            
            let connected = false;
            
            ws.on('open', () => {
                connected = true;
                console.log('✅ WebSocket connected');
                ws.close();
            });

            ws.on('error', (error) => {
                console.log('❌ WebSocket error:', error.message);
            });

            // Wait for connection
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            logTest('WebSocket Connection', connected, connected ? 'Connected successfully' : 'Connection failed');
        } catch (error) {
            logTest('WebSocket Connection', false, error.message);
        }

        // 5. Test Additional APIs
        console.log('\n📋 Testing Additional APIs...\n');

        // Delete Campaign
        console.log('19. Testing Delete Campaign...');
        const deleteResponse = await makeRequest('DELETE', `/api/campaigns/${campaignId || 'test-campaign-id'}`, {}, {
            'Authorization': `Bearer ${accessToken || 'test-token'}`
        });
        logTest('Delete Campaign', deleteResponse.status === 200, deleteResponse.body.message);

        // Test Profile APIs
        console.log('\n20. Testing Profile APIs...');
        const profileResponse = await makeRequest('GET', '/api/user/profile', null, {
            'Authorization': `Bearer ${accessToken || 'test-token'}`
        });
        logTest('Get Profile', profileResponse.status === 200, profileResponse.body.message);

        // Print Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 Test Summary:');
        console.log(`✅ Passed: ${results.passed}`);
        console.log(`❌ Failed: ${results.failed}`);
        console.log(`📈 Total: ${results.total}`);
        console.log(`🎯 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

        if (results.failed > 0) {
            console.log('\n❌ Failed Tests:');
            results.details
                .filter(test => !test.result)
                .forEach(test => {
                    console.log(`   - ${test.testName}: ${test.details}`);
                });
        }

        console.log('\n🎉 All API tests completed!');
        console.log('\n📱 WhatsApp Integration Features:');
        console.log('• Real WhatsApp connection via QR code');
        console.log('• Bulk message sending with intervals');
        console.log('• File attachment support');
        console.log('• Real-time progress tracking');
        console.log('• Campaign control (start/pause/resume/stop)');
        console.log('• Excel report generation');
        console.log('• Subscription limit validation');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run tests
if (require.main === module) {
    testAllAPIs();
}

module.exports = { testAllAPIs };
