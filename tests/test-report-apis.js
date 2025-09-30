// Test Report APIs
const BASE_URL = 'http://localhost:3000';

async function testReportAPIs() {
    console.log('📊 Testing Campaign Report APIs...\n');

    const campaignId = '68d66b85476c9a78998c730e'; // Your campaign ID
    const accessToken = 'your-jwt-token'; // Replace with actual token

    try {
        // Test 1: Get Campaign Report (JSON)
        console.log('1️⃣ Testing Get Campaign Report (JSON)...');
        const reportResponse = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/report`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (reportResponse.ok) {
            const reportData = await reportResponse.json();
            console.log('✅ Report generated successfully');
            console.log('📊 Report Data:');
            console.log(`   - Campaign ID: ${reportData.report.campaignId}`);
            console.log(`   - Title: ${reportData.report.title}`);
            console.log(`   - Status: ${reportData.report.status}`);
            console.log(`   - Total Messages: ${reportData.report.totalMessages}`);
            console.log(`   - Sent: ${reportData.report.successfulMessages}`);
            console.log(`   - Failed: ${reportData.report.failedMessages}`);
            console.log(`   - Remaining: ${reportData.report.remainingMessages}`);
            console.log(`   - Delivery Rate: ${reportData.report.deliveryRate}%`);
            console.log(`   - Is Completed: ${reportData.report.isCompleted}`);
        } else {
            const errorData = await reportResponse.json();
            console.log('❌ Report generation failed:', errorData.message);
        }

        // Test 2: Download Campaign Report (Excel)
        console.log('\n2️⃣ Testing Download Campaign Report (Excel)...');
        const downloadResponse = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/report/download`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (downloadResponse.ok) {
            console.log('✅ Excel report download successful');
            console.log('📁 File Info:');
            console.log(`   - Content-Type: ${downloadResponse.headers.get('content-type')}`);
            console.log(`   - Content-Disposition: ${downloadResponse.headers.get('content-disposition')}`);
            console.log(`   - File Size: ${downloadResponse.headers.get('content-length')} bytes`);
            
            // Save file locally for testing
            const buffer = await downloadResponse.arrayBuffer();
            const fs = require('fs');
            fs.writeFileSync(`campaign-report-${campaignId}.xlsx`, Buffer.from(buffer));
            console.log(`   - File saved as: campaign-report-${campaignId}.xlsx`);
        } else {
            const errorData = await downloadResponse.json();
            console.log('❌ Excel download failed:', errorData.message);
        }

        // Test 3: Get Campaign Progress
        console.log('\n3️⃣ Testing Get Campaign Progress...');
        const progressResponse = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/progress`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            console.log('✅ Progress retrieved successfully');
            console.log('📈 Progress Data:');
            console.log(`   - Status: ${progressData.campaign.status}`);
            console.log(`   - Progress: ${progressData.campaign.progress.sent}/${progressData.campaign.progress.total}`);
        } else {
            const errorData = await progressResponse.json();
            console.log('❌ Progress retrieval failed:', errorData.message);
        }

        console.log('\n🎉 Report API tests completed!');
        console.log('\n📋 Available Report Endpoints:');
        console.log('✅ GET /api/campaigns/:campaignId/report - JSON report');
        console.log('✅ GET /api/campaigns/:campaignId/report/download - Excel download');
        console.log('✅ GET /api/campaigns/:campaignId/progress - Real-time progress');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run tests
if (require.main === module) {
    testReportAPIs();
}

module.exports = { testReportAPIs };
