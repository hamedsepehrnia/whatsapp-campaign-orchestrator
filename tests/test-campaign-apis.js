// const axios = require('axios'); // Commented out for testing without installation

const BASE_URL = 'http://localhost:3000';

// Helper function to make requests using fetch (built-in)
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
        
        return {
            status: response.status,
            body: body
        };
    } catch (error) {
        return {
            status: 500,
            body: { message: error.message }
        };
    }
}

async function testCampaignAPIs() {
    console.log('🚀 Starting Campaign API Tests...\n');
    
    let authToken = '';
    let campaignId = '';
    
    try {
        // Test 1: Register User
        console.log('1️⃣ Testing User Registration...');
        const registerResponse = await makeRequest('POST', '/api/user/register', {
            name: 'تست کمپین',
            email: 'campaign@test.com',
            phone: '09120000001',
            password: 'Test123!',
            verificationToken: 'test-token'
        });
        console.log('Status:', registerResponse.status);
        console.log('Response:', registerResponse.body);
        console.log('');
        
        // Test 2: Login User
        console.log('2️⃣ Testing User Login...');
        const loginResponse = await makeRequest('POST', '/api/user/login', {
            email: 'campaign@test.com',
            password: 'Test123!'
        });
        console.log('Status:', loginResponse.status);
        console.log('Response:', loginResponse.body);
        
        if (loginResponse.status === 200) {
            authToken = loginResponse.body.token;
            console.log('✅ Login successful, token obtained');
        } else {
            console.log('❌ Login failed');
            return;
        }
        console.log('');
        
        // Test 3: Create Campaign
        console.log('3️⃣ Testing Create Campaign...');
        const createCampaignResponse = await makeRequest('POST', '/api/campaigns', {
            title: 'کمپین تست',
            message: 'سلام! این یک پیام تست است.',
            interval: '10s'
        }, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', createCampaignResponse.status);
        console.log('Response:', createCampaignResponse.body);
        
        if (createCampaignResponse.status === 201) {
            campaignId = createCampaignResponse.body.campaign.id;
            console.log('✅ Campaign created successfully');
        } else {
            console.log('❌ Campaign creation failed');
            return;
        }
        console.log('');
        
        // Test 4: Get Campaign Details
        console.log('4️⃣ Testing Get Campaign Details...');
        const getDetailsResponse = await makeRequest('GET', `/api/campaigns/${campaignId}`, null, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', getDetailsResponse.status);
        console.log('Response:', getDetailsResponse.body);
        if (getDetailsResponse.status === 200) {
            console.log('✅ Campaign details retrieved');
        } else {
            console.log('❌ Failed to get campaign details');
        }
        console.log('');
        
        // Test 5: Generate QR Code
        console.log('5️⃣ Testing Generate QR Code...');
        const qrResponse = await makeRequest('POST', `/api/campaigns/${campaignId}/qr-code`, null, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', qrResponse.status);
        console.log('Response:', qrResponse.body);
        if (qrResponse.status === 200) {
            console.log('✅ QR code generated successfully');
        } else {
            console.log('❌ QR code generation failed');
        }
        console.log('');
        
        // Test 6: Check Connection Status
        console.log('6️⃣ Testing Check Connection...');
        const connectionResponse = await makeRequest('GET', `/api/campaigns/${campaignId}/connection`, null, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', connectionResponse.status);
        console.log('Response:', connectionResponse.body);
        if (connectionResponse.status === 200) {
            console.log('✅ Connection status checked');
        } else {
            console.log('❌ Failed to check connection');
        }
        console.log('');
        
        // Test 7: Get My Campaigns
        console.log('7️⃣ Testing Get My Campaigns...');
        const myCampaignsResponse = await makeRequest('GET', '/api/campaigns', null, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', myCampaignsResponse.status);
        console.log('Response:', myCampaignsResponse.body);
        if (myCampaignsResponse.status === 200) {
            console.log('✅ My campaigns retrieved');
        } else {
            console.log('❌ Failed to get my campaigns');
        }
        console.log('');
        
        // Test 8: Get Campaign Progress
        console.log('8️⃣ Testing Get Campaign Progress...');
        const progressResponse = await makeRequest('GET', `/api/campaigns/${campaignId}/progress`, null, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', progressResponse.status);
        console.log('Response:', progressResponse.body);
        if (progressResponse.status === 200) {
            console.log('✅ Campaign progress retrieved');
        } else {
            console.log('❌ Failed to get campaign progress');
        }
        console.log('');
        
        // Test 9: Try to Start Campaign (should fail - no recipients)
        console.log('9️⃣ Testing Start Campaign (should fail - no recipients)...');
        const startResponse = await makeRequest('POST', `/api/campaigns/${campaignId}/start`, null, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', startResponse.status);
        console.log('Response:', startResponse.body);
        if (startResponse.status === 400) {
            console.log('✅ Start campaign correctly rejected (no recipients)');
        } else {
            console.log('❌ Start campaign should have failed (no recipients)');
        }
        console.log('');
        
        // Test 10: Delete Campaign
        console.log('10️⃣ Testing Delete Campaign...');
        const deleteResponse = await makeRequest('DELETE', `/api/campaigns/${campaignId}`, null, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', deleteResponse.status);
        console.log('Response:', deleteResponse.body);
        if (deleteResponse.status === 200) {
            console.log('✅ Campaign deleted successfully');
        } else {
            console.log('❌ Failed to delete campaign');
        }
        console.log('');
        
        console.log('🎉 Campaign API Tests Completed!');
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

// Run tests
testCampaignAPIs();
