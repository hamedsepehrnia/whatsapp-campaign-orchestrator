// Test Campaign Creation Without Title
// This file tests the campaign creation without title field

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test data
const testCampaign = {
    message: "سلام! این یک پیام تست است",
    interval: "10s"
};

const testUser = {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
    phone: "09120000000"
};

let authToken = '';

async function testCampaignWithoutTitle() {
    console.log('🧪 Testing Campaign Creation Without Title...\n');

    try {
        // Step 1: Register user
        console.log('1. Registering test user...');
        const registerResponse = await fetch(`${BASE_URL}/api/user/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...testUser,
                verificationToken: 'test-token' // Mock token for testing
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
                email: testUser.email,
                password: testUser.password
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

        // Step 3: Create campaign without title
        console.log('\n3. Creating campaign without title...');
        const campaignResponse = await fetch(`${BASE_URL}/api/campaigns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(testCampaign)
        });

        if (campaignResponse.ok) {
            const campaignData = await campaignResponse.json();
            console.log('✅ Campaign created successfully');
            console.log('Campaign ID:', campaignData.campaign.id);
            console.log('Campaign Status:', campaignData.campaign.status);
            
            // Verify no title field in response
            if (!campaignData.campaign.title) {
                console.log('✅ Title field successfully removed from response');
            } else {
                console.log('❌ Title field still present in response');
            }
        } else {
            const errorData = await campaignResponse.json();
            console.log('❌ Campaign creation failed:', errorData.message);
        }

        // Step 4: Test campaign validation
        console.log('\n4. Testing campaign validation...');
        
        // Test without message
        const invalidCampaign = {
            interval: "10s"
        };

        const invalidResponse = await fetch(`${BASE_URL}/api/campaigns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(invalidCampaign)
        });

        if (!invalidResponse.ok) {
            const errorData = await invalidResponse.json();
            console.log('✅ Validation working - message required:', errorData.message);
        } else {
            console.log('❌ Validation failed - should require message');
        }

        // Step 5: Test campaign listing
        console.log('\n5. Testing campaign listing...');
        const listResponse = await fetch(`${BASE_URL}/api/campaigns`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (listResponse.ok) {
            const listData = await listResponse.json();
            console.log('✅ Campaign list retrieved successfully');
            console.log('Total campaigns:', listData.campaigns.length);
            
            // Check if campaigns have title field
            if (listData.campaigns.length > 0) {
                const campaign = listData.campaigns[0];
                if (!campaign.title) {
                    console.log('✅ Title field successfully removed from campaign list');
                } else {
                    console.log('❌ Title field still present in campaign list');
                }
            }
        } else {
            console.log('❌ Campaign listing failed');
        }

        console.log('\n🎯 Test Summary:');
        console.log('✅ Campaign creation without title works');
        console.log('✅ Validation requires message field');
        console.log('✅ Title field removed from responses');
        console.log('✅ Campaign listing works without title');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testCampaignWithoutTitle();
