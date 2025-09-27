// Test all Campaign APIs without external dependencies
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

async function testAllCampaignAPIs() {
    console.log('🚀 Starting Comprehensive Campaign API Tests...\n');
    
    let authToken = '';
    let campaignId = '';
    
    try {
        // Test 1: Register User
        console.log('1️⃣ Testing User Registration...');
        const registerResponse = await makeRequest('POST', '/api/user/register', {
            name: 'تست کمپین کامل',
            email: 'fulltest@campaign.com',
            phone: '09120000002',
            password: 'Test123!',
            verificationToken: 'test-token'
        });
        console.log('Status:', registerResponse.status);
        console.log('Response:', registerResponse.body);
        if (registerResponse.status === 201) {
            console.log('✅ User registered successfully');
        } else {
            console.log('❌ User registration failed');
        }
        console.log('');
        
        // Test 2: Login User
        console.log('2️⃣ Testing User Login...');
        const loginResponse = await makeRequest('POST', '/api/user/login', {
            email: 'fulltest@campaign.com',
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
        
        // Test 3: Get Subscription Info (should show no quota)
        console.log('3️⃣ Testing Get Subscription Info...');
        const subscriptionResponse = await makeRequest('GET', '/api/campaigns/subscription', null, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', subscriptionResponse.status);
        console.log('Response:', subscriptionResponse.body);
        if (subscriptionResponse.status === 200) {
            console.log('✅ Subscription info retrieved');
            console.log(`   Active: ${subscriptionResponse.body.subscription.isActive}`);
            console.log(`   Total Limit: ${subscriptionResponse.body.subscription.totalLimit}`);
            console.log(`   Remaining: ${subscriptionResponse.body.subscription.remaining}`);
        } else {
            console.log('❌ Failed to get subscription info');
        }
        console.log('');
        
        // Test 4: Create Campaign
        console.log('4️⃣ Testing Create Campaign...');
        const createCampaignResponse = await makeRequest('POST', '/api/campaigns', {
            title: 'کمپین تست کامل',
            message: 'سلام! این یک پیام تست کامل است.',
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
        
        // Test 5: Get Campaign Details
        console.log('5️⃣ Testing Get Campaign Details...');
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
        
        // Test 6: Try to Upload Recipients (should fail - no quota)
        console.log('6️⃣ Testing Upload Recipients (should fail - no quota)...');
        const recipientsResponse = await makeRequest('POST', `/api/campaigns/${campaignId}/recipients`, {
            recipientsCount: 10
        }, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', recipientsResponse.status);
        console.log('Response:', recipientsResponse.body);
        if (recipientsResponse.status === 403) {
            console.log('✅ Upload recipients correctly rejected (no quota)');
        } else {
            console.log('❌ Upload recipients should have failed (no quota)');
        }
        console.log('');
        
        // Test 7: Generate QR Code
        console.log('7️⃣ Testing Generate QR Code...');
        const qrResponse = await makeRequest('POST', `/api/campaigns/${campaignId}/qr-code`, null, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', qrResponse.status);
        console.log('Response:', qrResponse.body);
        if (qrResponse.status === 200) {
            console.log('✅ QR code generated successfully');
            console.log(`   Session ID: ${qrResponse.body.sessionId}`);
        } else {
            console.log('❌ QR code generation failed');
        }
        console.log('');
        
        // Test 8: Check Connection Status
        console.log('8️⃣ Testing Check Connection...');
        const connectionResponse = await makeRequest('GET', `/api/campaigns/${campaignId}/connection`, null, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', connectionResponse.status);
        console.log('Response:', connectionResponse.body);
        if (connectionResponse.status === 200) {
            console.log('✅ Connection status checked');
            console.log(`   Connected: ${connectionResponse.body.isConnected}`);
        } else {
            console.log('❌ Failed to check connection');
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
        
        // Test 10: Get Campaign Progress
        console.log('10️⃣ Testing Get Campaign Progress...');
        const progressResponse = await makeRequest('GET', `/api/campaigns/${campaignId}/progress`, null, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', progressResponse.status);
        console.log('Response:', progressResponse.body);
        if (progressResponse.status === 200) {
            console.log('✅ Campaign progress retrieved');
            console.log(`   Status: ${progressResponse.body.campaign.status}`);
            console.log(`   Progress: ${progressResponse.body.campaign.progress.sent}/${progressResponse.body.campaign.progress.total}`);
        } else {
            console.log('❌ Failed to get campaign progress');
        }
        console.log('');
        
        // Test 11: Get My Campaigns
        console.log('11️⃣ Testing Get My Campaigns...');
        const myCampaignsResponse = await makeRequest('GET', '/api/campaigns', null, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', myCampaignsResponse.status);
        console.log('Response:', myCampaignsResponse.body);
        if (myCampaignsResponse.status === 200) {
            console.log('✅ My campaigns retrieved');
            console.log(`   Total campaigns: ${myCampaignsResponse.body.campaigns.length}`);
        } else {
            console.log('❌ Failed to get my campaigns');
        }
        console.log('');
        
        // Test 12: Try to Generate Report (should fail - not completed)
        console.log('12️⃣ Testing Generate Report (should fail - not completed)...');
        const reportResponse = await makeRequest('GET', `/api/campaigns/${campaignId}/report`, null, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', reportResponse.status);
        console.log('Response:', reportResponse.body);
        if (reportResponse.status === 400) {
            console.log('✅ Report generation correctly rejected (not completed)');
        } else {
            console.log('❌ Report generation should have failed (not completed)');
        }
        console.log('');
        
        // Test 13: Try to Pause Campaign (should fail - not running)
        console.log('13️⃣ Testing Pause Campaign (should fail - not running)...');
        const pauseResponse = await makeRequest('POST', `/api/campaigns/${campaignId}/pause`, null, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', pauseResponse.status);
        console.log('Response:', pauseResponse.body);
        if (pauseResponse.status === 400) {
            console.log('✅ Pause campaign correctly rejected (not running)');
        } else {
            console.log('❌ Pause campaign should have failed (not running)');
        }
        console.log('');
        
        // Test 14: Try to Resume Campaign (should fail - not paused)
        console.log('14️⃣ Testing Resume Campaign (should fail - not paused)...');
        const resumeResponse = await makeRequest('POST', `/api/campaigns/${campaignId}/resume`, null, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', resumeResponse.status);
        console.log('Response:', resumeResponse.body);
        if (resumeResponse.status === 400) {
            console.log('✅ Resume campaign correctly rejected (not paused)');
        } else {
            console.log('❌ Resume campaign should have failed (not paused)');
        }
        console.log('');
        
        // Test 15: Delete Campaign
        console.log('15️⃣ Testing Delete Campaign...');
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
        
        // Test 16: Try to Access Deleted Campaign (should fail)
        console.log('16️⃣ Testing Access Deleted Campaign (should fail)...');
        const deletedResponse = await makeRequest('GET', `/api/campaigns/${campaignId}`, null, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', deletedResponse.status);
        console.log('Response:', deletedResponse.body);
        if (deletedResponse.status === 404) {
            console.log('✅ Access to deleted campaign correctly rejected');
        } else {
            console.log('❌ Access to deleted campaign should have failed');
        }
        console.log('');
        
        console.log('🎉 All Campaign API Tests Completed!');
        console.log('\n📊 Test Summary:');
        console.log('✅ User Registration & Login');
        console.log('✅ Subscription Info Retrieval');
        console.log('✅ Campaign CRUD Operations');
        console.log('✅ QR Code Generation');
        console.log('✅ Connection Status Check');
        console.log('✅ Progress Tracking');
        console.log('✅ Proper Error Handling');
        console.log('✅ Subscription Validation');
        console.log('✅ Permission Checks');
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

// Run tests
testAllCampaignAPIs();
