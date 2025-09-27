# 📱 WhatsApp Integration Guide

## 🎯 Overview

This project now includes complete WhatsApp integration for sending bulk messages through WhatsApp Web.js. The integration provides:

- **Real WhatsApp Connection** - Using WhatsApp Web.js library
- **QR Code Authentication** - Scan QR code to connect WhatsApp
- **Bulk Message Sending** - Send messages to multiple recipients
- **File Attachments** - Send images, PDFs, and other files
- **Real-time Progress** - WebSocket updates for live progress
- **Campaign Management** - Start, pause, resume, and stop campaigns
- **Subscription Limits** - Respect user message limits
- **Report Generation** - Excel reports with delivery status

## 🏗️ Architecture

### **Components:**

1. **WhatsApp Service** (`src/services/whatsappService.js`)
   - Manages WhatsApp Web.js clients
   - Handles message sending with intervals
   - Manages session cleanup
   - Integrates with MongoDB

2. **WebSocket Service** (`src/services/websocketService.js`)
   - Real-time updates for QR codes
   - Progress tracking
   - Status updates
   - Error notifications

3. **Campaign Controller** (`src/controllers/campaignController.js`)
   - API endpoints for campaign management
   - File upload handling
   - Integration with WhatsApp service

4. **Database Models** (`src/models/Campaign.js`)
   - Campaign data storage
   - Progress tracking
   - Report generation

## 🚀 Setup Instructions

### **1. Install Dependencies:**
```bash
npm install whatsapp-web.js
```

### **2. Environment Variables:**
```env
# Optional: Chrome executable path
CHROME_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome

# For production
CHROME_PATH=/usr/bin/google-chrome
```

### **3. Start Server:**
```bash
npm start
```

## 📱 Usage Flow

### **1. Create Campaign:**
```javascript
POST /api/campaigns
{
  "title": "My WhatsApp Campaign",
  "message": "Hello! This is a test message.",
  "interval": "10s"
}
```

### **2. Upload Recipients:**
```javascript
POST /api/campaigns/:campaignId/recipients
// Upload Excel file with columns: phone, name
```

### **3. Upload Attachment (Optional):**
```javascript
POST /api/campaigns/:campaignId/attachment
// Upload image, PDF, or other file
```

### **4. Generate QR Code:**
```javascript
POST /api/campaigns/:campaignId/qr-code
// Returns session ID, QR code sent via WebSocket
```

### **5. Check Connection:**
```javascript
GET /api/campaigns/:campaignId/connection
// Returns connection status
```

### **6. Start Campaign:**
```javascript
POST /api/campaigns/:campaignId/start
// Begins sending messages
```

### **7. Monitor Progress:**
```javascript
GET /api/campaigns/:campaignId/progress
// Returns current progress
```

### **8. Get Report:**
```javascript
GET /api/campaigns/:campaignId/report
// Returns Excel report with delivery status
```

## 🔌 WebSocket Integration

### **Connection:**
```javascript
const ws = new WebSocket('ws://localhost:3000/ws/campaigns?campaignId=123&userId=456');
```

### **Message Types:**

#### **QR Code:**
```json
{
  "type": "qr_code",
  "campaignId": "123",
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgo...",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

#### **Status Update:**
```json
{
  "type": "status_update",
  "campaignId": "123",
  "data": {
    "status": "ready",
    "message": "WhatsApp connected successfully",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

#### **Progress Update:**
```json
{
  "type": "progress_update",
  "campaignId": "123",
  "data": {
    "progress": {
      "sent": 45,
      "total": 150,
      "current": "09123456789"
    },
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

#### **Error Update:**
```json
{
  "type": "error_update",
  "campaignId": "123",
  "data": {
    "error": "Failed to send to 09123456789: Invalid number",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

#### **Completion Update:**
```json
{
  "type": "completion_update",
  "campaignId": "123",
  "data": {
    "report": {
      "status": "completed",
      "totalSent": 145,
      "totalFailed": 5,
      "reportUrl": "/api/campaigns/123/report"
    },
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## 🧪 Testing

### **Run Integration Tests:**
```bash
node test-whatsapp-integration.js
```

### **Test WebSocket:**
```bash
node test-websocket.js
```

## 📊 Features

### **✅ Implemented:**
- WhatsApp Web.js integration
- QR code authentication
- Bulk message sending
- File attachments
- Real-time progress tracking
- Campaign management (start/pause/resume/stop)
- Subscription limit validation
- Excel report generation
- WebSocket real-time updates
- MongoDB integration
- Error handling and logging

### **🔄 Campaign Flow:**
1. **Create Campaign** → Set message and interval
2. **Upload Recipients** → Excel file with phone numbers
3. **Upload Attachment** → Optional file attachment
4. **Generate QR Code** → Connect WhatsApp account
5. **Start Campaign** → Begin sending messages
6. **Monitor Progress** → Real-time updates via WebSocket
7. **Get Report** → Download Excel report

### **📱 WhatsApp Features:**
- **Multiple Sessions** - Each campaign has its own WhatsApp session
- **Session Management** - Automatic cleanup and reconnection
- **Message Intervals** - Configurable sending intervals (5s, 10s, 20s)
- **File Attachments** - Support for images, PDFs, documents
- **Error Handling** - Retry failed messages, error logging
- **Progress Tracking** - Real-time sent/failed counts

## 🔧 Configuration

### **Chrome/Chromium Setup:**
```javascript
// For development (macOS)
CHROME_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome

// For production (Linux)
CHROME_PATH=/usr/bin/google-chrome

// For Docker
CHROME_PATH=/usr/bin/chromium-browser
```

### **Puppeteer Options:**
```javascript
puppeteer: {
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
    ]
}
```

## 🚨 Important Notes

### **Security:**
- WhatsApp sessions are stored locally
- Each user has separate sessions
- Sessions are cleaned up after campaigns
- No WhatsApp credentials are stored

### **Limitations:**
- WhatsApp Web.js has rate limits
- WhatsApp may block accounts for spam
- Use appropriate intervals (5s+ recommended)
- Respect WhatsApp's terms of service

### **Production Considerations:**
- Use proper Chrome/Chromium installation
- Monitor memory usage
- Implement proper error handling
- Set up logging and monitoring
- Consider using WhatsApp Business API for production

## 📞 Support

For issues or questions:
1. Check server logs for errors
2. Verify Chrome/Chromium installation
3. Test with small recipient lists first
4. Check WhatsApp connection status
5. Monitor WebSocket connections

---

**🎉 WhatsApp Integration is now fully functional!**
