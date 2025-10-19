# 🔌 راهنمای کامل WebSocket برای فرانت‌اند

راهنمای جامع برای پیاده‌سازی اتصال WebSocket و مدیریت رویدادها در فرانت‌اند

## 🎯 نمای کلی

این راهنما نحوه اتصال به WebSocket، مدیریت رویدادها، و پیاده‌سازی real-time updates را در فرانت‌اند توضیح می‌دهد.

## 🔧 تنظیمات اولیه

### 1. اتصال WebSocket

```javascript
class WebSocketManager {
    constructor(campaignId, userId, options = {}) {
        this.campaignId = campaignId;
        this.userId = userId;
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
        this.reconnectInterval = options.reconnectInterval || 5000;
        this.pingInterval = options.pingInterval || 30000;
        this.listeners = new Map();
        this.pingTimer = null;
    }

    // اتصال به WebSocket
    connect() {
        const url = `ws://localhost:3000/ws/campaigns?campaignId=${this.campaignId}&userId=${this.userId}`;
        
        try {
            this.socket = new WebSocket(url);
            this.setupEventListeners();
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.handleConnectionError(error);
        }
    }

    // تنظیم event listeners
    setupEventListeners() {
        this.socket.onopen = (event) => {
            console.log('✅ WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.startPingTimer();
            this.emit('connected', event);
        };

        this.socket.onmessage = (event) => {
            this.handleMessage(event);
        };

        this.socket.onclose = (event) => {
            console.log('❌ WebSocket disconnected:', event.code, event.reason);
            this.isConnected = false;
            this.stopPingTimer();
            this.emit('disconnected', event);
            this.handleReconnect();
        };

        this.socket.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            this.emit('error', error);
        };
    }

    // پردازش پیام‌های دریافتی
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            this.emit('message', data);
            
            // پردازش انواع مختلف پیام
            switch (data.type) {
                case 'qr_code':
                    this.emit('qrCode', data.data);
                    break;
                case 'status_update':
                    this.emit('statusUpdate', data.data);
                    break;
                case 'progress_update':
                    this.emit('progressUpdate', data.data);
                    break;
                case 'error_update':
                    this.emit('errorUpdate', data.data);
                    break;
                case 'completion_update':
                    this.emit('completionUpdate', data.data);
                    break;
                case 'campaign_update':
                    this.emit('campaignUpdate', data.data);
                    break;
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
            this.emit('parseError', error);
        }
    }
}
```

### 2. مدیریت اتصال مجدد

```javascript
class WebSocketManager {
    // مدیریت اتصال مجدد
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectInterval * this.reconnectAttempts);
        } else {
            console.error('Max reconnection attempts reached');
            this.emit('maxReconnectAttemptsReached');
        }
    }

    // قطع اتصال
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.isConnected = false;
        this.stopPingTimer();
    }

    // بررسی وضعیت اتصال
    isHealthy() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }
}
```

### 3. مدیریت Ping/Pong

```javascript
class WebSocketManager {
    // شروع ping timer
    startPingTimer() {
        this.pingTimer = setInterval(() => {
            if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
                this.socket.ping();
            }
        }, this.pingInterval);
    }

    // توقف ping timer
    stopPingTimer() {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
    }

    // مدیریت pong
    handlePong() {
        this.emit('pong');
    }
}
```

## 📡 مدیریت رویدادها

### 1. سیستم Event Listener

```javascript
class WebSocketManager {
    // اضافه کردن listener
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    // حذف listener
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    // ارسال event
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    // حذف همه listeners
    removeAllListeners() {
        this.listeners.clear();
    }
}
```

### 2. رویدادهای مختلف

```javascript
class WebSocketManager {
    // تنظیم رویدادهای پیش‌فرض
    setupDefaultListeners() {
        // رویداد اتصال
        this.on('connected', (event) => {
            console.log('WebSocket connected successfully');
            this.updateConnectionStatus('connected');
        });

        // رویداد قطع اتصال
        this.on('disconnected', (event) => {
            console.log('WebSocket disconnected');
            this.updateConnectionStatus('disconnected');
        });

        // رویداد خطا
        this.on('error', (error) => {
            console.error('WebSocket error:', error);
            this.updateConnectionStatus('error');
        });

        // رویداد QR Code
        this.on('qrCode', (data) => {
            console.log('QR Code received:', data.qrCode);
            this.displayQRCode(data.qrCode);
        });

        // رویداد وضعیت
        this.on('statusUpdate', (data) => {
            console.log('Status updated:', data.status);
            this.updateStatus(data.status, data.message);
        });

        // رویداد پیشرفت
        this.on('progressUpdate', (data) => {
            console.log('Progress updated:', data.progress);
            this.updateProgress(data.progress);
        });

        // رویداد خطا
        this.on('errorUpdate', (data) => {
            console.error('Error update:', data.error);
            this.showError(data.error);
        });

        // رویداد تکمیل
        this.on('completionUpdate', (data) => {
            console.log('Campaign completed:', data.report);
            this.showCompletion(data.report);
        });
    }
}
```

## 🎨 پیاده‌سازی UI

### 1. HTML Structure

```html
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Campaign Manager</title>
    <link rel="stylesheet" href="websocket-ui.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>📱 WhatsApp Campaign Manager</h1>
            <div id="connection-status" class="status-indicator">
                <span class="status-dot"></span>
                <span class="status-text">در حال اتصال...</span>
            </div>
        </header>

        <main>
            <!-- بخش QR Code -->
            <section id="qr-section" class="section">
                <h2>QR Code</h2>
                <div id="qr-container" class="qr-container">
                    <div id="qr-placeholder" class="qr-placeholder">
                        <p>QR Code در دسترس نیست</p>
                        <button id="generate-qr-btn" class="btn btn-primary">تولید QR Code</button>
                    </div>
                </div>
            </section>

            <!-- بخش وضعیت -->
            <section id="status-section" class="section">
                <h2>وضعیت</h2>
                <div id="status-display" class="status-display">
                    <div class="status-item">
                        <span class="label">وضعیت اتصال:</span>
                        <span id="connection-status-text" class="value">نامشخص</span>
                    </div>
                    <div class="status-item">
                        <span class="label">وضعیت کمپین:</span>
                        <span id="campaign-status-text" class="value">نامشخص</span>
                    </div>
                </div>
            </section>

            <!-- بخش پیشرفت -->
            <section id="progress-section" class="section">
                <h2>پیشرفت</h2>
                <div id="progress-display" class="progress-display">
                    <div class="progress-bar">
                        <div id="progress-fill" class="progress-fill"></div>
                    </div>
                    <div class="progress-text">
                        <span id="progress-sent">0</span> / <span id="progress-total">0</span> پیام ارسال شده
                    </div>
                </div>
            </section>

            <!-- بخش پیام‌ها -->
            <section id="messages-section" class="section">
                <h2>پیام‌ها</h2>
                <div id="messages-container" class="messages-container">
                    <!-- پیام‌ها اینجا نمایش داده می‌شوند -->
                </div>
            </section>
        </main>

        <footer>
            <div class="controls">
                <button id="connect-btn" class="btn btn-primary">اتصال</button>
                <button id="disconnect-btn" class="btn btn-secondary">قطع اتصال</button>
                <button id="clear-messages-btn" class="btn btn-danger">پاکسازی پیام‌ها</button>
            </div>
        </footer>
    </div>

    <script src="websocket-manager.js"></script>
    <script src="websocket-ui.js"></script>
</body>
</html>
```

### 2. CSS Styles

```css
/* استایل‌های اصلی */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* وضعیت اتصال */
.status-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 8px;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
}

.status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #6c757d;
    transition: background-color 0.3s ease;
}

.status-dot.connected { background: #28a745; }
.status-dot.disconnected { background: #dc3545; }
.status-dot.connecting { background: #ffc107; }

/* بخش‌ها */
.section {
    margin: 20px 0;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.section h2 {
    margin: 0 0 15px 0;
    color: #333;
    border-bottom: 2px solid #007bff;
    padding-bottom: 10px;
}

/* QR Code */
.qr-container {
    text-align: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 2px dashed #dee2e6;
}

.qr-placeholder {
    color: #6c757d;
}

.qr-code-image {
    max-width: 300px;
    height: auto;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* وضعیت */
.status-display {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.status-item {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 5px;
    border: 1px solid #dee2e6;
}

.status-item .label {
    font-weight: bold;
    color: #495057;
}

.status-item .value {
    color: #007bff;
    font-weight: 500;
}

/* پیشرفت */
.progress-display {
    margin: 20px 0;
}

.progress-bar {
    width: 100%;
    height: 20px;
    background: #e9ecef;
    border-radius: 10px;
    overflow: hidden;
    margin: 10px 0;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #28a745, #20c997);
    transition: width 0.3s ease;
    width: 0%;
}

.progress-text {
    text-align: center;
    font-weight: bold;
    color: #495057;
}

/* پیام‌ها */
.messages-container {
    max-height: 400px;
    overflow-y: auto;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 15px;
}

.message-item {
    padding: 10px;
    margin: 5px 0;
    border-radius: 5px;
    border-left: 4px solid #007bff;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.message-item.error {
    border-left-color: #dc3545;
    background: #f8d7da;
}

.message-item.success {
    border-left-color: #28a745;
    background: #d4edda;
}

.message-item.warning {
    border-left-color: #ffc107;
    background: #fff3cd;
}

.message-timestamp {
    font-size: 0.8em;
    color: #6c757d;
    margin-left: 10px;
}

/* دکمه‌ها */
.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    margin: 5px;
}

.btn-primary {
    background: #007bff;
    color: white;
}

.btn-primary:hover {
    background: #0056b3;
}

.btn-secondary {
    background: #6c757d;
    color: white;
}

.btn-secondary:hover {
    background: #545b62;
}

.btn-danger {
    background: #dc3545;
    color: white;
}

.btn-danger:hover {
    background: #c82333;
}

.btn:disabled {
    background: #e9ecef;
    color: #6c757d;
    cursor: not-allowed;
}

/* کنترل‌ها */
.controls {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin: 20px 0;
}

/* ریسپانسیو */
@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
    
    .status-display {
        grid-template-columns: 1fr;
    }
    
    .controls {
        flex-direction: column;
    }
    
    .btn {
        width: 100%;
        margin: 5px 0;
    }
}

/* انیمیشن‌ها */
@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

.connecting {
    animation: pulse 2s infinite;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.message-item {
    animation: slideIn 0.3s ease;
}
```

### 3. JavaScript Implementation

```javascript
class WebSocketUI {
    constructor(manager) {
        this.manager = manager;
        this.elements = {
            connectionStatus: document.getElementById('connection-status'),
            connectionStatusText: document.getElementById('connection-status-text'),
            campaignStatusText: document.getElementById('campaign-status-text'),
            qrContainer: document.getElementById('qr-container'),
            qrPlaceholder: document.getElementById('qr-placeholder'),
            progressFill: document.getElementById('progress-fill'),
            progressSent: document.getElementById('progress-sent'),
            progressTotal: document.getElementById('progress-total'),
            messagesContainer: document.getElementById('messages-container')
        };
        
        this.setupEventListeners();
        this.setupWebSocketListeners();
    }

    // تنظیم event listeners
    setupEventListeners() {
        // دکمه اتصال
        document.getElementById('connect-btn').onclick = () => {
            this.manager.connect();
        };

        // دکمه قطع اتصال
        document.getElementById('disconnect-btn').onclick = () => {
            this.manager.disconnect();
        };

        // دکمه تولید QR Code
        document.getElementById('generate-qr-btn').onclick = () => {
            this.generateQRCode();
        };

        // دکمه پاکسازی پیام‌ها
        document.getElementById('clear-messages-btn').onclick = () => {
            this.clearMessages();
        };
    }

    // تنظیم WebSocket listeners
    setupWebSocketListeners() {
        this.manager.on('connected', () => {
            this.updateConnectionStatus('connected', 'متصل شد');
        });

        this.manager.on('disconnected', () => {
            this.updateConnectionStatus('disconnected', 'قطع شد');
        });

        this.manager.on('error', (error) => {
            this.updateConnectionStatus('error', 'خطا');
            this.addMessage('خطا در اتصال WebSocket', 'error');
        });

        this.manager.on('qrCode', (data) => {
            this.displayQRCode(data.qrCode);
            this.addMessage('QR Code دریافت شد', 'success');
        });

        this.manager.on('statusUpdate', (data) => {
            this.updateCampaignStatus(data.status, data.message);
            this.addMessage(`وضعیت: ${data.message}`, 'info');
        });

        this.manager.on('progressUpdate', (data) => {
            this.updateProgress(data.progress);
        });

        this.manager.on('errorUpdate', (data) => {
            this.addMessage(`خطا: ${data.error}`, 'error');
        });

        this.manager.on('completionUpdate', (data) => {
            this.showCompletion(data.report);
            this.addMessage('کمپین تکمیل شد', 'success');
        });
    }

    // به‌روزرسانی وضعیت اتصال
    updateConnectionStatus(status, text) {
        const statusDot = this.elements.connectionStatus.querySelector('.status-dot');
        const statusText = this.elements.connectionStatus.querySelector('.status-text');
        
        statusDot.className = `status-dot ${status}`;
        statusText.textContent = text;
        this.elements.connectionStatusText.textContent = text;
    }

    // به‌روزرسانی وضعیت کمپین
    updateCampaignStatus(status, message) {
        this.elements.campaignStatusText.textContent = status;
        if (message) {
            this.addMessage(`وضعیت کمپین: ${message}`, 'info');
        }
    }

    // نمایش QR Code
    displayQRCode(qrCode) {
        this.elements.qrPlaceholder.style.display = 'none';
        
        const img = document.createElement('img');
        img.src = qrCode;
        img.alt = 'WhatsApp QR Code';
        img.className = 'qr-code-image';
        
        this.elements.qrContainer.appendChild(img);
    }

    // به‌روزرسانی پیشرفت
    updateProgress(progress) {
        const percentage = (progress.sent / progress.total) * 100;
        this.elements.progressFill.style.width = `${percentage}%`;
        this.elements.progressSent.textContent = progress.sent;
        this.elements.progressTotal.textContent = progress.total;
        
        if (progress.current) {
            this.addMessage(`ارسال به: ${progress.current}`, 'info');
        }
    }

    // اضافه کردن پیام
    addMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-item ${type}`;
        
        const timestamp = new Date().toLocaleTimeString('fa-IR');
        messageDiv.innerHTML = `
            <span class="message-text">${message}</span>
            <span class="message-timestamp">${timestamp}</span>
        `;
        
        this.elements.messagesContainer.appendChild(messageDiv);
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }

    // پاکسازی پیام‌ها
    clearMessages() {
        this.elements.messagesContainer.innerHTML = '';
    }

    // نمایش تکمیل
    showCompletion(report) {
        const completionDiv = document.createElement('div');
        completionDiv.className = 'message-item success';
        completionDiv.innerHTML = `
            <h3>✅ کمپین تکمیل شد</h3>
            <p>ارسال موفق: ${report.totalSent}</p>
            <p>ارسال ناموفق: ${report.totalFailed}</p>
            <a href="${report.reportUrl}" target="_blank">دانلود گزارش</a>
        `;
        
        this.elements.messagesContainer.appendChild(completionDiv);
    }

    // تولید QR Code
    async generateQRCode() {
        try {
            const response = await fetch(`/api/campaigns/${this.manager.campaignId}/qr-code`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to generate QR code');
            }

            this.addMessage('درخواست تولید QR Code ارسال شد', 'info');
        } catch (error) {
            this.addMessage(`خطا در تولید QR Code: ${error.message}`, 'error');
        }
    }
}
```

## 🔧 تنظیمات پیشرفته

### 1. مدیریت خطا

```javascript
class WebSocketErrorHandler {
    static handleError(error, context) {
        console.error('WebSocket Error:', error, context);
        
        switch (error.type) {
            case 'CONNECTION_FAILED':
                return this.handleConnectionError(error);
            case 'MESSAGE_PARSE_ERROR':
                return this.handleParseError(error);
            case 'RECONNECT_FAILED':
                return this.handleReconnectError(error);
            default:
                return this.handleGenericError(error);
        }
    }
    
    static handleConnectionError(error) {
        return {
            message: 'خطا در اتصال به سرور',
            action: 'reconnect',
            severity: 'high'
        };
    }
    
    static handleParseError(error) {
        return {
            message: 'خطا در پردازش پیام',
            action: 'ignore',
            severity: 'medium'
        };
    }
    
    static handleReconnectError(error) {
        return {
            message: 'خطا در اتصال مجدد',
            action: 'manual_reconnect',
            severity: 'high'
        };
    }
    
    static handleGenericError(error) {
        return {
            message: 'خطای نامشخص',
            action: 'retry',
            severity: 'low'
        };
    }
}
```

### 2. بهینه‌سازی عملکرد

```javascript
class WebSocketOptimizer {
    static optimizeForMobile() {
        return {
            reconnectAttempts: 3,
            reconnectInterval: 3000,
            pingInterval: 60000
        };
    }
    
    static optimizeForDesktop() {
        return {
            reconnectAttempts: 5,
            reconnectInterval: 5000,
            pingInterval: 30000
        };
    }
    
    static detectEnvironment() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return isMobile ? this.optimizeForMobile() : this.optimizeForDesktop();
    }
}
```

### 3. مدیریت حافظه

```javascript
class WebSocketMemoryManager {
    static cleanup(manager) {
        // پاکسازی listeners
        manager.removeAllListeners();
        
        // پاکسازی timers
        if (manager.pingTimer) {
            clearInterval(manager.pingTimer);
        }
        
        // پاکسازی socket
        if (manager.socket) {
            manager.socket.onopen = null;
            manager.socket.onmessage = null;
            manager.socket.onclose = null;
            manager.socket.onerror = null;
        }
    }
}
```

## 🚀 راه‌اندازی سریع

### 1. استفاده پایه

```javascript
// ایجاد WebSocket Manager
const wsManager = new WebSocketManager(campaignId, userId);

// اتصال
wsManager.connect();

// اضافه کردن listeners
wsManager.on('qrCode', (data) => {
    console.log('QR Code received:', data.qrCode);
});

wsManager.on('progressUpdate', (data) => {
    console.log('Progress:', data.progress);
});
```

### 2. استفاده با UI

```javascript
// ایجاد UI Manager
const uiManager = new WebSocketUI(wsManager);

// تنظیمات خودکار
uiManager.setupEventListeners();
uiManager.setupWebSocketListeners();
```

### 3. تنظیمات پیشرفته

```javascript
// تنظیمات سفارشی
const options = {
    maxReconnectAttempts: 5,
    reconnectInterval: 5000,
    pingInterval: 30000
};

const wsManager = new WebSocketManager(campaignId, userId, options);
```

---

**نکته**: این راهنما به‌روزرسانی می‌شود. لطفاً آخرین نسخه را بررسی کنید.
