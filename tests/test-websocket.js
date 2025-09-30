const WebSocket = require('ws');

// Test WebSocket connection
function testWebSocket() {
    console.log('🔌 Testing WebSocket Connection...\n');
    
    // Replace with actual campaign ID and user ID
    const campaignId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439012';
    
    const ws = new WebSocket(`ws://localhost:3000/ws/campaigns?campaignId=${campaignId}&userId=${userId}`);
    
    ws.on('open', function() {
        console.log('✅ WebSocket connection established');
        console.log(`📡 Connected to campaign: ${campaignId}`);
        console.log(`👤 User ID: ${userId}\n`);
    });
    
    ws.on('message', function(data) {
        try {
            const message = JSON.parse(data);
            console.log('📨 Received message:');
            console.log(`   Type: ${message.type}`);
            console.log(`   Campaign ID: ${message.campaignId}`);
            console.log(`   Timestamp: ${message.data.timestamp}`);
            
            switch(message.type) {
                case 'campaign_update':
                    console.log(`   Status: ${message.data.status}`);
                    console.log(`   Progress: ${message.data.progress.sent}/${message.data.progress.total}`);
                    break;
                case 'progress_update':
                    console.log(`   Progress: ${message.data.progress.sent}/${message.data.progress.total}`);
                    console.log(`   Failed: ${message.data.progress.failed}`);
                    break;
                case 'status_update':
                    console.log(`   Status: ${message.data.status}`);
                    console.log(`   Message: ${message.data.message}`);
                    break;
                case 'error_update':
                    console.log(`   Error: ${message.data.error}`);
                    break;
                case 'completion_update':
                    console.log(`   Report: ${JSON.stringify(message.data.report, null, 2)}`);
                    break;
            }
            console.log('');
        } catch (error) {
            console.error('❌ Error parsing message:', error);
        }
    });
    
    ws.on('close', function(code, reason) {
        console.log(`🔌 WebSocket connection closed`);
        console.log(`   Code: ${code}`);
        console.log(`   Reason: ${reason}`);
    });
    
    ws.on('error', function(error) {
        console.error('❌ WebSocket error:', error.message);
    });
    
    // Keep connection alive for testing
    setTimeout(() => {
        console.log('⏰ Closing connection after 30 seconds...');
        ws.close();
    }, 30000);
}

// Run test
testWebSocket();
