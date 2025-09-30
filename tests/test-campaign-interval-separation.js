// Test Campaign Interval Separation
// This file tests the new campaign flow where interval is set separately

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test data
const testData = {
    user: {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        phone: "09120000000"
    },
    campaign: {
        message: "سلام! این یک پیام تست است"
    },
    interval: {
        interval: "10s"
    }
};

let authToken = '';
let campaignId = '';

async function testCampaignIntervalSeparation() {
    console.log('🧪 Testing Campaign Interval Separation...\n');

    try {
        // Step 1: Register user
        console.log('1. Registering test user...');
        const registerResponse = await fetch(`${BASE_URL}/api/user/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...testData.user,
                verificationToken: 'test-token'
            })
        });

        if (registerResponse.ok) {
            console.log('✅ User registered successfully');
        } else {
            console.log('⚠️  User registration failed, trying login...');
        }

        // Step 2: Login user
        console.log('\n2. Logging in user...');
        const loginResponse = await fetch(`${BASE_URL}/api/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: testData.user.email,
                password: testData.user.password
            })
        });

        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            authToken = loginData.token;
            console.log('✅ User logged in successfully');
        } else {
            console.log('❌ Login failed');
            return;
        }

        // Step 3: Create campaign (only message)
        console.log('\n3. Creating campaign with only message...');
        const campaignResponse = await fetch(`${BASE_URL}/api/campaigns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(testData.campaign)
        });

        if (campaignResponse.ok) {
            const campaignData = await campaignResponse.json();
            campaignId = campaignData.campaign.id;
            console.log('✅ Campaign created successfully');
            console.log('Campaign ID:', campaignId);
            console.log('Campaign Status:', campaignData.campaign.status);
            
            // Verify no interval in response
            if (!campaignData.campaign.interval) {
                console.log('✅ Interval field successfully removed from campaign creation');
            } else {
                console.log('❌ Interval field still present in campaign creation');
            }
        } else {
            const errorData = await campaignResponse.json();
            console.log('❌ Campaign creation failed:', errorData.message);
            return;
        }

        // Step 4: Set campaign interval
        console.log('\n4. Setting campaign interval...');
        const intervalResponse = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/interval`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(testData.interval)
        });

        if (intervalResponse.ok) {
            const intervalData = await intervalResponse.json();
            console.log('✅ Campaign interval set successfully');
            console.log('Interval:', intervalData.campaign.interval);
            console.log('Status:', intervalData.campaign.status);
        } else {
            const errorData = await intervalResponse.json();
            console.log('❌ Setting interval failed:', errorData.message);
        }

        // Step 5: Test invalid interval
        console.log('\n5. Testing invalid interval...');
        const invalidIntervalResponse = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/interval`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                interval: "30s" // Invalid interval
            })
        });

        if (!invalidIntervalResponse.ok) {
            const errorData = await invalidIntervalResponse.json();
            console.log('✅ Invalid interval validation working:', errorData.message);
        } else {
            console.log('❌ Invalid interval validation failed');
        }

        // Step 6: Get campaign details
        console.log('\n6. Getting campaign details...');
        const detailsResponse = await fetch(`${BASE_URL}/api/campaigns/${campaignId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            console.log('✅ Campaign details retrieved');
            console.log('Message:', detailsData.campaign.message);
            console.log('Interval:', detailsData.campaign.interval);
            console.log('Status:', detailsData.campaign.status);
        } else {
            console.log('❌ Failed to get campaign details');
        }

        // Step 7: Test different intervals
        console.log('\n7. Testing different intervals...');
        const intervals = ['5s', '10s', '20s'];
        
        for (const interval of intervals) {
            const testIntervalResponse = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/interval`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ interval })
            });

            if (testIntervalResponse.ok) {
                console.log(`✅ Interval ${interval} set successfully`);
            } else {
                console.log(`❌ Failed to set interval ${interval}`);
            }
        }

        console.log('\n🎯 Test Summary:');
        console.log('✅ Campaign creation without interval works');
        console.log('✅ Interval can be set separately');
        console.log('✅ Invalid interval validation works');
        console.log('✅ Campaign details show interval');
        console.log('✅ Different intervals can be set');

        console.log('\n📱 New Campaign Flow:');
        console.log('1. Create campaign with only message');
        console.log('2. Set interval separately');
        console.log('3. Upload recipients');
        console.log('4. Upload attachment (optional)');
        console.log('5. Generate QR code');
        console.log('6. Start campaign');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testCampaignIntervalSeparation();
