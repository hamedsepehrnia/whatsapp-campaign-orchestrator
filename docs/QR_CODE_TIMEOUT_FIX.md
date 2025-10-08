# 🔧 QR Code Timeout Fix

## 🐛 Problem Description

The QR code generation API (`POST /api/campaigns/:campaignId/qr-code`) was experiencing timeout issues when:

1. **Same Campaign ID**: Requesting QR code for the same campaign ID multiple times
2. **Session Conflicts**: Existing WhatsApp sessions not being properly cleaned up
3. **No Timeout Handling**: No timeout mechanism for WhatsApp client initialization

## ✅ Solution Implemented

### 1. Session Cleanup Before New Session
- Added automatic cleanup of existing sessions before creating new ones
- Prevents session conflicts and memory leaks

### 2. Timeout Handling
- Added 30-second timeout for WhatsApp client initialization
- Automatic cleanup if QR code generation takes too long
- Proper timeout clearing when QR code is generated or client is ready

### 3. Enhanced Session Management
- Improved session tracking with timeout references
- Better error handling and cleanup procedures
- Added session status checking

## 🔧 Code Changes

### Controller Changes (`campaignController.js`)
```javascript
// Clean up any existing session for this campaign first
console.log(`🧹 Cleaning up existing session for campaign ${campaignId}`);
whatsappService.cleanupSession(campaignId);
```

### Service Changes (`whatsappService.js`)
```javascript
// Set timeout for client initialization (30 seconds)
const initTimeout = setTimeout(async () => {
    console.log(`⏰ Timeout reached for campaign ${campaignId}, cleaning up...`);
    // ... cleanup logic
}, 30000);

clients.set(campaignId, { client, userId, status: 'pending', timeout: initTimeout });
```

## 🆕 New API Endpoints

### 1. Enhanced Connection Check
**GET** `/api/campaigns/:campaignId/connection`

**Response:**
```json
{
  "isConnected": false,
  "lastActivity": "2024-01-01T12:00:00.000Z",
  "hasActiveSession": true,
  "sessionId": "uuid-session-id"
}
```

### 2. Force Session Cleanup
**POST** `/api/campaigns/:campaignId/cleanup-session`

**Response:**
```json
{
  "message": "Session cleaned up successfully",
  "campaignId": "campaign_id"
}
```

## 🎯 Frontend Implementation

### 1. Enhanced QR Code Generation
```javascript
async function generateQRCode(campaignId) {
    try {
        setLoading(true);
        
        // Optional: Check if session exists and cleanup if needed
        const connectionStatus = await fetch(`/api/campaigns/${campaignId}/connection`);
        const status = await connectionStatus.json();
        
        if (status.hasActiveSession && !status.isConnected) {
            // Cleanup stuck session
            await fetch(`/api/campaigns/${campaignId}/cleanup-session`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }
        
        const response = await fetch(`/api/campaigns/${campaignId}/qr-code`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.sessionId) {
            connectWebSocket(data.sessionId);
        }
        
    } catch (error) {
        console.error('Error generating QR code:', error);
        setLoading(false);
    }
}
```

### 2. WebSocket with Timeout Handling
```javascript
function connectWebSocket(sessionId) {
    const ws = new WebSocket('ws://localhost:3000/ws/campaigns');
    
    // Set timeout for WebSocket connection
    const wsTimeout = setTimeout(() => {
        console.log('WebSocket connection timeout');
        ws.close();
        setLoading(false);
        showError('Connection timeout. Please try again.');
    }, 35000); // 35 seconds (5 seconds more than server timeout)
    
    ws.onopen = function() {
        console.log('WebSocket connected');
        ws.send(JSON.stringify({
            type: 'subscribe',
            sessionId: sessionId
        }));
    };
    
    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        
        if (data.type === 'qr_code') {
            clearTimeout(wsTimeout);
            displayQRCode(data.qrCode);
            setLoading(false);
        } else if (data.type === 'error') {
            clearTimeout(wsTimeout);
            showError(data.message);
            setLoading(false);
        }
    };
    
    ws.onclose = function() {
        clearTimeout(wsTimeout);
        console.log('WebSocket disconnected');
    };
}
```

## 🧪 Testing

### Test Cases
1. **Same Campaign ID**: Request QR code multiple times for same campaign
2. **Timeout Scenario**: Wait for 30+ seconds without scanning QR code
3. **Session Cleanup**: Use cleanup endpoint to force session reset
4. **WebSocket Connection**: Verify real-time updates work properly

### Test Commands
```bash
# Test QR code generation
curl -X POST "http://localhost:3000/api/campaigns/CAMPAIGN_ID/qr-code" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test connection status
curl -X GET "http://localhost:3000/api/campaigns/CAMPAIGN_ID/connection" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test session cleanup
curl -X POST "http://localhost:3000/api/campaigns/CAMPAIGN_ID/cleanup-session" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Expected Results

- ✅ No more hanging requests for same campaign ID
- ✅ Automatic cleanup after 30 seconds timeout
- ✅ Better error handling and user feedback
- ✅ Improved session management
- ✅ Real-time status updates via WebSocket

## 🔄 Migration Notes

- No database migration required
- Existing campaigns will work normally
- New timeout behavior is automatic
- Backward compatible with existing frontend code
