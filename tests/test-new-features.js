const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
    email: 'test@example.com',
    password: 'password123',
    baseUrl: BASE_URL
};

let authToken = '';

async function makeRequest(method, endpoint, body = null, headers = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.text();
        
        let parsedData;
        try {
            parsedData = JSON.parse(data);
        } catch {
            parsedData = data;
        }

        return {
            status: response.status,
            body: parsedData
        };
    } catch (error) {
        return {
            status: 500,
            body: { error: error.message }
        };
    }
}

async function login() {
    console.log('🔐 Logging in...');
    const response = await makeRequest('POST', '/api/auth/login', {
        email: TEST_CONFIG.email,
        password: TEST_CONFIG.password
    });

    if (response.status === 200) {
        authToken = response.body.token;
        console.log('✅ Login successful');
        return true;
    } else {
        console.log('❌ Login failed:', response.body);
        return false;
    }
}

async function testMultipleCampaignsDownload() {
    console.log('\n📊 Testing Multiple Campaigns Download...');
    
    // First, get some campaigns
    const campaignsResponse = await makeRequest('GET', '/api/campaigns', null, {
        'Authorization': `Bearer ${authToken}`
    });

    if (campaignsResponse.status !== 200) {
        console.log('❌ Failed to get campaigns');
        return;
    }

    const campaigns = campaignsResponse.body.campaigns;
    if (campaigns.length === 0) {
        console.log('⚠️ No campaigns found to test with');
        return;
    }

    // Take first 2 campaigns for testing
    const campaignIds = campaigns.slice(0, 2).map(c => c.id);
    
    console.log(`Testing with campaigns: ${campaignIds.join(', ')}`);

    // Test download multiple reports
    const downloadResponse = await makeRequest('POST', '/api/campaigns/reports/download-multiple', {
        campaignIds: campaignIds
    }, {
        'Authorization': `Bearer ${authToken}`
    });

    console.log('Status:', downloadResponse.status);
    if (downloadResponse.status === 200) {
        console.log('✅ Multiple campaigns download successful');
    } else {
        console.log('❌ Multiple campaigns download failed:', downloadResponse.body);
    }
}

async function testCampaignsSorting() {
    console.log('\n🔄 Testing Campaigns Sorting...');
    
    // Test different sort options
    const sortOptions = [
        { sortBy: 'createdAt', sortOrder: 'desc' },
        { sortBy: 'title', sortOrder: 'asc' },
        { sortBy: 'status', sortOrder: 'asc' },
        { sortBy: 'totalRecipients', sortOrder: 'desc' }
    ];

    for (const sort of sortOptions) {
        console.log(`Testing sort: ${sort.sortBy} ${sort.sortOrder}`);
        
        const response = await makeRequest('GET', `/api/campaigns?sortBy=${sort.sortBy}&sortOrder=${sort.sortOrder}`, null, {
            'Authorization': `Bearer ${authToken}`
        });

        if (response.status === 200) {
            console.log(`✅ Sort ${sort.sortBy} ${sort.sortOrder} successful`);
            console.log(`   Found ${response.body.campaigns.length} campaigns`);
        } else {
            console.log(`❌ Sort ${sort.sortBy} ${sort.sortOrder} failed:`, response.body);
        }
    }
}

async function testRecipientsSorting() {
    console.log('\n👥 Testing Recipients Sorting...');
    
    // First get a campaign
    const campaignsResponse = await makeRequest('GET', '/api/campaigns', null, {
        'Authorization': `Bearer ${authToken}`
    });

    if (campaignsResponse.status !== 200 || campaignsResponse.body.campaigns.length === 0) {
        console.log('⚠️ No campaigns found to test recipients');
        return;
    }

    const campaignId = campaignsResponse.body.campaigns[0].id;
    console.log(`Testing with campaign ID: ${campaignId}`);

    // Test different sort options for recipients
    const sortOptions = [
        { sortBy: 'id', sortOrder: 'asc' },
        { sortBy: 'phone', sortOrder: 'asc' },
        { sortBy: 'name', sortOrder: 'desc' },
        { sortBy: 'status', sortOrder: 'asc' },
        { sortBy: 'sentAt', sortOrder: 'desc' }
    ];

    for (const sort of sortOptions) {
        console.log(`Testing recipients sort: ${sort.sortBy} ${sort.sortOrder}`);
        
        const response = await makeRequest('GET', `/api/campaigns/${campaignId}/recipients?sortBy=${sort.sortBy}&sortOrder=${sort.sortOrder}`, null, {
            'Authorization': `Bearer ${authToken}`
        });

        if (response.status === 200) {
            console.log(`✅ Recipients sort ${sort.sortBy} ${sort.sortOrder} successful`);
            console.log(`   Found ${response.body.recipients.length} recipients`);
        } else {
            console.log(`❌ Recipients sort ${sort.sortBy} ${sort.sortOrder} failed:`, response.body);
        }
    }
}

async function testCampaignDetailsWithRecipientsSorting() {
    console.log('\n📋 Testing Campaign Details with Recipients Sorting...');
    
    // First get a campaign
    const campaignsResponse = await makeRequest('GET', '/api/campaigns', null, {
        'Authorization': `Bearer ${authToken}`
    });

    if (campaignsResponse.status !== 200 || campaignsResponse.body.campaigns.length === 0) {
        console.log('⚠️ No campaigns found to test');
        return;
    }

    const campaignId = campaignsResponse.body.campaigns[0].id;
    console.log(`Testing with campaign ID: ${campaignId}`);

    // Test campaign details with recipients and sorting
    const response = await makeRequest('GET', `/api/campaigns/${campaignId}?include=recipients&recipientSortBy=phone&recipientSortOrder=asc`, null, {
        'Authorization': `Bearer ${authToken}`
    });

    if (response.status === 200) {
        console.log('✅ Campaign details with sorted recipients successful');
        if (response.body.campaign.recipients) {
            console.log(`   Found ${response.body.campaign.recipients.length} recipients`);
        }
    } else {
        console.log('❌ Campaign details with sorted recipients failed:', response.body);
    }
}

async function runTests() {
    console.log('🚀 Starting New Features Tests...\n');

    // Login first
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('❌ Cannot proceed without authentication');
        return;
    }

    // Run all tests
    await testMultipleCampaignsDownload();
    await testCampaignsSorting();
    await testRecipientsSorting();
    await testCampaignDetailsWithRecipientsSorting();

    console.log('\n✅ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };
