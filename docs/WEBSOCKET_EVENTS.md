# 🔌 رویدادهای WebSocket

راهنمای کامل رویدادهای WebSocket برای ارتباط لحظه‌ای

## 🔗 اتصال WebSocket

### URL اتصال
```
ws://localhost:3000/ws/campaigns?campaignId=1&userId=1
```

### پارامترهای مورد نیاز
- **campaignId**: شناسه کمپین
- **userId**: شناسه کاربر

### نمونه اتصال
```javascript
const socket = new WebSocket('ws://localhost:3000/ws/campaigns?campaignId=1&userId=1');

socket.onopen = () => {
  console.log('WebSocket connected');
};

socket.onclose = () => {
  console.log('WebSocket disconnected');
};

socket.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

## 📡 رویدادهای سیستم

### 1. campaign_update
به‌روزرسانی وضعیت کمپین

```javascript
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'campaign_update') {
    console.log('Campaign updated:', data.data);
    // به‌روزرسانی UI
    updateCampaignUI(data.data);
  }
};
```

**ساختار داده:**
```json
{
  "type": "campaign_update",
  "campaignId": 1,
  "data": {
    "id": 1,
    "title": "کمپین تست",
    "status": "RUNNING",
    "progress": {
      "total": 100,
      "sent": 45,
      "failed": 2,
      "delivered": 43
    },
    "startedAt": "2024-01-01T10:00:00Z",
    "completedAt": null,
    "timestamp": "2024-01-01T10:15:00Z"
  }
}
```

### 2. progress_update
به‌روزرسانی پیشرفت ارسال

```javascript
if (data.type === 'progress_update') {
  console.log('Progress updated:', data.data.progress);
  // به‌روزرسانی نوار پیشرفت
  updateProgressBar(data.data.progress);
}
```

**ساختار داده:**
```json
{
  "type": "progress_update",
  "campaignId": 1,
  "data": {
    "progress": {
      "sent": 45,
      "total": 100,
      "current": "09123456789"
    },
    "timestamp": "2024-01-01T10:15:00Z"
  }
}
```

### 3. status_update
به‌روزرسانی وضعیت کلی

```javascript
if (data.type === 'status_update') {
  console.log('Status updated:', data.data.status);
  // به‌روزرسانی وضعیت
  updateStatus(data.data.status, data.data.message);
}
```

**ساختار داده:**
```json
{
  "type": "status_update",
  "campaignId": 1,
  "data": {
    "status": "ready",
    "message": "WhatsApp connected successfully",
    "timestamp": "2024-01-01T10:15:00Z"
  }
}
```

### 4. error_update
به‌روزرسانی خطاها

```javascript
if (data.type === 'error_update') {
  console.error('Error occurred:', data.data.error);
  // نمایش خطا به کاربر
  showError(data.data.error);
}
```

**ساختار داده:**
```json
{
  "type": "error_update",
  "campaignId": 1,
  "data": {
    "error": "Failed to send message to 09123456789: Invalid phone number",
    "timestamp": "2024-01-01T10:15:00Z"
  }
}
```

### 5. qr_code
دریافت QR Code برای اتصال WhatsApp

```javascript
if (data.type === 'qr_code') {
  console.log('QR Code received');
  // نمایش QR Code
  displayQRCode(data.data.qrCode);
}
```

**ساختار داده:**
```json
{
  "type": "qr_code",
  "campaignId": 1,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "timestamp": "2024-01-01T10:15:00Z"
  }
}
```

### 6. completion_update
تکمیل کمپین

```javascript
if (data.type === 'completion_update') {
  console.log('Campaign completed:', data.data.report);
  // نمایش گزارش نهایی
  showCompletionReport(data.data.report);
}
```

**ساختار داده:**
```json
{
  "type": "completion_update",
  "campaignId": 1,
  "data": {
    "report": {
      "status": "COMPLETED",
      "totalSent": 95,
      "totalFailed": 5,
      "reportUrl": "/api/campaigns/1/report"
    },
    "timestamp": "2024-01-01T10:30:00Z"
  }
}
```

## 🔄 مدیریت اتصال

### Ping/Pong برای حفظ اتصال
```javascript
// سرور هر 30 ثانیه ping ارسال می‌کند
socket.onmessage = (event) => {
  if (event.data === 'ping') {
    socket.send('pong');
  }
};
```

### تشخیص قطع اتصال
```javascript
socket.onclose = (event) => {
  console.log('Connection closed:', event.code, event.reason);
  
  // تلاش برای اتصال مجدد
  setTimeout(() => {
    reconnect();
  }, 5000);
};
```

### اتصال مجدد
```javascript
function reconnect() {
  const newSocket = new WebSocket('ws://localhost:3000/ws/campaigns?campaignId=1&userId=1');
  
  newSocket.onopen = () => {
    console.log('Reconnected successfully');
    socket = newSocket;
  };
}
```

## 📱 نمونه کامل

### کلاس مدیریت WebSocket
```javascript
class CampaignWebSocket {
  constructor(campaignId, userId) {
    this.campaignId = campaignId;
    this.userId = userId;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    const url = `ws://localhost:3000/ws/campaigns?campaignId=${this.campaignId}&userId=${this.userId}`;
    
    this.socket = new WebSocket(url);
    
    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };
    
    this.socket.onmessage = (event) => {
      this.handleMessage(event);
    };
    
    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code);
      this.handleReconnect();
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'campaign_update':
          this.onCampaignUpdate(data.data);
          break;
        case 'progress_update':
          this.onProgressUpdate(data.data);
          break;
        case 'status_update':
          this.onStatusUpdate(data.data);
          break;
        case 'error_update':
          this.onErrorUpdate(data.data);
          break;
        case 'qr_code':
          this.onQRCode(data.data);
          break;
        case 'completion_update':
          this.onCompletion(data.data);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  onCampaignUpdate(data) {
    console.log('Campaign updated:', data);
    // به‌روزرسانی UI
  }

  onProgressUpdate(data) {
    console.log('Progress updated:', data.progress);
    // به‌روزرسانی نوار پیشرفت
  }

  onStatusUpdate(data) {
    console.log('Status updated:', data.status);
    // به‌روزرسانی وضعیت
  }

  onErrorUpdate(data) {
    console.error('Error occurred:', data.error);
    // نمایش خطا
  }

  onQRCode(data) {
    console.log('QR Code received');
    // نمایش QR Code
  }

  onCompletion(data) {
    console.log('Campaign completed:', data.report);
    // نمایش گزارش نهایی
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, 5000 * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

// استفاده
const campaignWS = new CampaignWebSocket(1, 1);
campaignWS.connect();
```

## 🔧 تنظیمات پیشرفته

### تنظیمات اتصال
```javascript
const socket = new WebSocket(url, {
  // تنظیمات اضافی
  protocols: ['campaign-updates'],
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

### مدیریت حافظه
```javascript
// پاکسازی منابع
socket.onclose = () => {
  // پاکسازی event listeners
  socket.onmessage = null;
  socket.onopen = null;
  socket.onclose = null;
  socket.onerror = null;
};
```

### لاگ‌گیری
```javascript
socket.onmessage = (event) => {
  console.log('WebSocket message received:', event.data);
  
  try {
    const data = JSON.parse(event.data);
    console.log('Parsed data:', data);
  } catch (error) {
    console.error('Parse error:', error);
  }
};
```

## 🚨 مدیریت خطا

### خطاهای رایج
```javascript
socket.onerror = (error) => {
  console.error('WebSocket error:', error);
  
  switch (error.code) {
    case 'ECONNREFUSED':
      console.error('Connection refused');
      break;
    case 'ENOTFOUND':
      console.error('Host not found');
      break;
    default:
      console.error('Unknown error:', error);
  }
};
```

### بازیابی از خطا
```javascript
function handleConnectionError(error) {
  console.error('Connection error:', error);
  
  // تلاش برای اتصال مجدد
  setTimeout(() => {
    if (socket.readyState === WebSocket.CLOSED) {
      reconnect();
    }
  }, 5000);
}
```

## 📊 مانیتورینگ

### آمار اتصال
```javascript
class WebSocketMonitor {
  constructor() {
    this.connectionCount = 0;
    this.messageCount = 0;
    this.errorCount = 0;
  }

  onConnect() {
    this.connectionCount++;
    console.log('Total connections:', this.connectionCount);
  }

  onMessage() {
    this.messageCount++;
    console.log('Total messages:', this.messageCount);
  }

  onError() {
    this.errorCount++;
    console.log('Total errors:', this.errorCount);
  }
}
```

### Health Check
```javascript
function healthCheck() {
  if (socket.readyState === WebSocket.OPEN) {
    console.log('WebSocket is healthy');
    return true;
  } else {
    console.log('WebSocket is unhealthy');
    return false;
  }
}
```

## 🔒 امنیت

### احراز هویت
```javascript
// ارسال توکن در query string
const url = `ws://localhost:3000/ws/campaigns?campaignId=1&userId=1&token=${jwtToken}`;
```

### محدودیت دسترسی
```javascript
// بررسی دسترسی کاربر به کمپین
if (data.campaignId !== userCampaignId) {
  console.error('Unauthorized access to campaign');
  socket.close();
}
```

---

**نکته**: این راهنما به‌روزرسانی می‌شود. لطفاً آخرین نسخه را بررسی کنید.
