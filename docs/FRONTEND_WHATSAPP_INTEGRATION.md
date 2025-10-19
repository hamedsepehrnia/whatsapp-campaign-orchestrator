# 📱 راهنمای کامل اتصال WhatsApp برای فرانت‌اند

راهنمای جامع برای پیاده‌سازی اتصال WhatsApp در فرانت‌اند

## 🎯 نمای کلی

این راهنما نحوه پیاده‌سازی اتصال WhatsApp، نمایش QR Code، و مدیریت وضعیت کمپین‌ها را در فرانت‌اند توضیح می‌دهد.

## 🔧 پیش‌نیازها

- **WebSocket Support**: مرورگر باید از WebSocket پشتیبانی کند
- **QR Code Library**: برای نمایش QR Code (مثل `qrcode.js`)
- **Authentication**: توکن JWT معتبر
- **Campaign ID**: شناسه کمپین موجود

## 📋 مراحل اتصال WhatsApp

### 1. اتصال به WebSocket

```javascript
class WhatsAppConnector {
    constructor(campaignId, userId, token) {
        this.campaignId = campaignId;
        this.userId = userId;
        this.token = token;
        this.socket = null;
        this.isConnected = false;
        this.qrCode = null;
    }

    // اتصال به WebSocket
    connect() {
        const url = `ws://localhost:3000/ws/campaigns?campaignId=${this.campaignId}&userId=${this.userId}`;
        
        this.socket = new WebSocket(url);
        
        this.socket.onopen = () => {
            console.log('✅ WebSocket connected');
            this.isConnected = true;
            this.onConnectionEstablished();
        };
        
        this.socket.onmessage = (event) => {
            this.handleMessage(event);
        };
        
        this.socket.onclose = () => {
            console.log('❌ WebSocket disconnected');
            this.isConnected = false;
            this.onConnectionLost();
        };
        
        this.socket.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            this.onError(error);
        };
    }

    // پردازش پیام‌های دریافتی
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'qr_code':
                    this.handleQRCode(data.data);
                    break;
                case 'status_update':
                    this.handleStatusUpdate(data.data);
                    break;
                case 'progress_update':
                    this.handleProgressUpdate(data.data);
                    break;
                case 'error_update':
                    this.handleErrorUpdate(data.data);
                    break;
                case 'completion_update':
                    this.handleCompletionUpdate(data.data);
                    break;
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }
}
```

### 2. تولید QR Code

```javascript
// درخواست تولید QR Code
async generateQRCode() {
    try {
        const response = await fetch(`/api/campaigns/${this.campaignId}/qr-code`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to generate QR code');
        }

        const data = await response.json();
        console.log('QR Code generation initiated:', data);
        
        // QR Code از طریق WebSocket دریافت می‌شود
        return data;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
}
```

### 3. نمایش QR Code

```javascript
// مدیریت QR Code
handleQRCode(data) {
    this.qrCode = data.qrCode;
    this.displayQRCode(data.qrCode);
    this.onQRCodeReceived(data.qrCode);
}

// نمایش QR Code در UI
displayQRCode(qrCodeData) {
    const qrContainer = document.getElementById('qr-container');
    
    if (qrCodeData.startsWith('data:image/')) {
        // اگر QR Code به صورت base64 است
        const img = document.createElement('img');
        img.src = qrCodeData;
        img.alt = 'WhatsApp QR Code';
        img.style.maxWidth = '300px';
        img.style.height = 'auto';
        
        qrContainer.innerHTML = '';
        qrContainer.appendChild(img);
    } else {
        // اگر QR Code به صورت رشته است، از کتابخانه QR Code استفاده کنید
        this.generateQRCodeImage(qrCodeData, qrContainer);
    }
    
    // نمایش دستورالعمل
    this.showQRInstructions();
}

// تولید تصویر QR Code
generateQRCodeImage(qrData, container) {
    // استفاده از کتابخانه qrcode.js
    if (typeof QRCode !== 'undefined') {
        container.innerHTML = '';
        new QRCode(container, {
            text: qrData,
            width: 300,
            height: 300,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    } else {
        // نمایش متن QR Code
        container.innerHTML = `
            <div class="qr-text">
                <h3>QR Code:</h3>
                <pre>${qrData}</pre>
                <p>این کد را با WhatsApp اسکن کنید</p>
            </div>
        `;
    }
}

// نمایش دستورالعمل
showQRInstructions() {
    const instructions = document.getElementById('qr-instructions');
    instructions.innerHTML = `
        <div class="instructions">
            <h3>📱 نحوه اتصال:</h3>
            <ol>
                <li>WhatsApp را در گوشی خود باز کنید</li>
                <li>به Settings > Linked Devices بروید</li>
                <li>Link a Device را انتخاب کنید</li>
                <li>QR Code بالا را اسکن کنید</li>
            </ol>
        </div>
    `;
}
```

### 4. بررسی وضعیت اتصال

```javascript
// بررسی وضعیت اتصال WhatsApp
async checkConnectionStatus() {
    try {
        const response = await fetch(`/api/campaigns/${this.campaignId}/connection`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to check connection status');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error checking connection status:', error);
        throw error;
    }
}

// مدیریت وضعیت اتصال
handleStatusUpdate(data) {
    console.log('Status updated:', data.status);
    
    switch (data.status) {
        case 'ready':
            this.onWhatsAppConnected();
            break;
        case 'failed':
            this.onWhatsAppConnectionFailed(data.message);
            break;
        case 'disconnected':
            this.onWhatsAppDisconnected();
            break;
        default:
            console.log('Unknown status:', data.status);
    }
}
```

## 🎨 پیاده‌سازی UI کامل

### HTML Structure

```html
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Connection</title>
    <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
    <style>
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .status-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .status-connected {
            background: #d4edda;
            border-color: #c3e6cb;
            color: #155724;
        }
        
        .status-disconnected {
            background: #f8d7da;
            border-color: #f5c6cb;
            color: #721c24;
        }
        
        .status-waiting {
            background: #fff3cd;
            border-color: #ffeaa7;
            color: #856404;
        }
        
        .qr-container {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .instructions {
            background: #e3f2fd;
            border: 1px solid #bbdefb;
            border-radius: 8px;
            padding: 15px;
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
            background: #28a745;
            transition: width 0.3s ease;
        }
        
        .button {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        
        .button:hover {
            background: #0056b3;
        }
        
        .button:disabled {
            background: #6c757d;
            cursor: not-allowed;
        }
        
        .error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        
        .success-message {
            background: #d4edda;
            color: #155724;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 اتصال WhatsApp</h1>
        
        <!-- وضعیت اتصال -->
        <div id="status-card" class="status-card status-waiting">
            <h3>وضعیت اتصال</h3>
            <p id="status-text">در حال اتصال...</p>
        </div>
        
        <!-- QR Code -->
        <div id="qr-container" class="qr-container" style="display: none;">
            <h3>📱 QR Code</h3>
            <div id="qr-code"></div>
        </div>
        
        <!-- دستورالعمل -->
        <div id="qr-instructions" class="instructions" style="display: none;">
            <!-- دستورالعمل‌ها اینجا نمایش داده می‌شوند -->
        </div>
        
        <!-- دکمه‌های کنترل -->
        <div>
            <button id="generate-qr-btn" class="button">تولید QR Code</button>
            <button id="check-connection-btn" class="button">بررسی اتصال</button>
            <button id="disconnect-btn" class="button">قطع اتصال</button>
        </div>
        
        <!-- پیشرفت کمپین -->
        <div id="campaign-progress" style="display: none;">
            <h3>پیشرفت کمپین</h3>
            <div class="progress-bar">
                <div id="progress-fill" class="progress-fill" style="width: 0%"></div>
            </div>
            <p id="progress-text">0 / 0 پیام ارسال شده</p>
        </div>
        
        <!-- پیام‌ها -->
        <div id="messages"></div>
    </div>

    <script src="whatsapp-connector.js"></script>
    <script>
        // راه‌اندازی اتصال WhatsApp
        const connector = new WhatsAppConnector(
            campaignId, // از URL یا متغیر دریافت کنید
            userId,     // از URL یا متغیر دریافت کنید
            token       // از localStorage یا متغیر دریافت کنید
        );
        
        // اتصال خودکار
        connector.connect();
        
        // مدیریت دکمه‌ها
        document.getElementById('generate-qr-btn').onclick = () => {
            connector.generateQRCode();
        };
        
        document.getElementById('check-connection-btn').onclick = () => {
            connector.checkConnectionStatus();
        };
        
        document.getElementById('disconnect-btn').onclick = () => {
            connector.disconnect();
        };
    </script>
</body>
</html>
```

### JavaScript Implementation

```javascript
class WhatsAppConnector {
    constructor(campaignId, userId, token) {
        this.campaignId = campaignId;
        this.userId = userId;
        this.token = token;
        this.socket = null;
        this.isConnected = false;
        this.qrCode = null;
        this.whatsappConnected = false;
        this.campaignStatus = 'idle';
    }

    // اتصال به WebSocket
    connect() {
        const url = `ws://localhost:3000/ws/campaigns?campaignId=${this.campaignId}&userId=${this.userId}`;
        
        this.socket = new WebSocket(url);
        
        this.socket.onopen = () => {
            console.log('✅ WebSocket connected');
            this.isConnected = true;
            this.updateStatus('متصل شد', 'connected');
            this.addMessage('🔌 WebSocket متصل شد');
        };
        
        this.socket.onmessage = (event) => {
            this.handleMessage(event);
        };
        
        this.socket.onclose = () => {
            console.log('❌ WebSocket disconnected');
            this.isConnected = false;
            this.updateStatus('اتصال قطع شد', 'disconnected');
            this.addMessage('🔌 WebSocket قطع شد');
        };
        
        this.socket.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            this.updateStatus('خطا در اتصال', 'disconnected');
            this.addMessage(`❌ خطا: ${error}`);
        };
    }

    // پردازش پیام‌های دریافتی
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            this.addMessage(`📨 دریافت: ${data.type}`);
            
            switch (data.type) {
                case 'qr_code':
                    this.handleQRCode(data.data);
                    break;
                case 'status_update':
                    this.handleStatusUpdate(data.data);
                    break;
                case 'progress_update':
                    this.handleProgressUpdate(data.data);
                    break;
                case 'error_update':
                    this.handleErrorUpdate(data.data);
                    break;
                case 'completion_update':
                    this.handleCompletionUpdate(data.data);
                    break;
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }

    // مدیریت QR Code
    handleQRCode(data) {
        this.qrCode = data.qrCode;
        this.displayQRCode(data.qrCode);
        this.updateStatus('QR Code دریافت شد', 'waiting');
        this.addMessage('📱 QR Code دریافت شد');
    }

    // نمایش QR Code
    displayQRCode(qrCodeData) {
        const qrContainer = document.getElementById('qr-container');
        const qrCodeDiv = document.getElementById('qr-code');
        
        qrContainer.style.display = 'block';
        
        if (qrCodeData.startsWith('data:image/')) {
            // اگر QR Code به صورت base64 است
            const img = document.createElement('img');
            img.src = qrCodeData;
            img.alt = 'WhatsApp QR Code';
            img.style.maxWidth = '300px';
            img.style.height = 'auto';
            
            qrCodeDiv.innerHTML = '';
            qrCodeDiv.appendChild(img);
        } else {
            // تولید QR Code با کتابخانه
            qrCodeDiv.innerHTML = '';
            new QRCode(qrCodeDiv, {
                text: qrCodeData,
                width: 300,
                height: 300,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
        
        this.showQRInstructions();
    }

    // نمایش دستورالعمل
    showQRInstructions() {
        const instructions = document.getElementById('qr-instructions');
        instructions.style.display = 'block';
        instructions.innerHTML = `
            <h3>📱 نحوه اتصال:</h3>
            <ol>
                <li>WhatsApp را در گوشی خود باز کنید</li>
                <li>به Settings > Linked Devices بروید</li>
                <li>Link a Device را انتخاب کنید</li>
                <li>QR Code بالا را اسکن کنید</li>
            </ol>
        `;
    }

    // مدیریت وضعیت
    handleStatusUpdate(data) {
        console.log('Status updated:', data.status);
        
        switch (data.status) {
            case 'ready':
                this.whatsappConnected = true;
                this.updateStatus('WhatsApp متصل شد', 'connected');
                this.addMessage('✅ WhatsApp متصل شد');
                this.hideQRCode();
                break;
            case 'failed':
                this.whatsappConnected = false;
                this.updateStatus('اتصال WhatsApp ناموفق', 'disconnected');
                this.addMessage(`❌ خطا: ${data.message}`);
                break;
            case 'disconnected':
                this.whatsappConnected = false;
                this.updateStatus('WhatsApp قطع شد', 'disconnected');
                this.addMessage('❌ WhatsApp قطع شد');
                break;
        }
    }

    // مدیریت پیشرفت
    handleProgressUpdate(data) {
        const progress = data.progress;
        this.updateProgress(progress.sent, progress.total, progress.current);
        this.addMessage(`📊 پیشرفت: ${progress.sent}/${progress.total} - ${progress.current}`);
    }

    // مدیریت خطا
    handleErrorUpdate(data) {
        this.addMessage(`❌ خطا: ${data.error}`);
        this.showError(data.error);
    }

    // مدیریت تکمیل
    handleCompletionUpdate(data) {
        const report = data.report;
        this.addMessage(`✅ کمپین تکمیل شد: ${report.totalSent} ارسال موفق`);
        this.showCompletionReport(report);
    }

    // تولید QR Code
    async generateQRCode() {
        try {
            const response = await fetch(`/api/campaigns/${this.campaignId}/qr-code`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to generate QR code');
            }

            const data = await response.json();
            this.addMessage('🔄 تولید QR Code شروع شد');
            return data;
        } catch (error) {
            console.error('Error generating QR code:', error);
            this.addMessage(`❌ خطا در تولید QR Code: ${error.message}`);
        }
    }

    // بررسی وضعیت اتصال
    async checkConnectionStatus() {
        try {
            const response = await fetch(`/api/campaigns/${this.campaignId}/connection`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to check connection status');
            }

            const data = await response.json();
            this.addMessage(`📊 وضعیت اتصال: ${data.isConnected ? 'متصل' : 'قطع'}`);
            return data;
        } catch (error) {
            console.error('Error checking connection status:', error);
            this.addMessage(`❌ خطا در بررسی وضعیت: ${error.message}`);
        }
    }

    // قطع اتصال
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.isConnected = false;
        this.updateStatus('قطع شد', 'disconnected');
    }

    // به‌روزرسانی وضعیت UI
    updateStatus(message, className) {
        const statusCard = document.getElementById('status-card');
        const statusText = document.getElementById('status-text');
        
        statusText.textContent = message;
        statusCard.className = `status-card status-${className}`;
    }

    // به‌روزرسانی پیشرفت
    updateProgress(sent, total, current) {
        const progressDiv = document.getElementById('campaign-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        progressDiv.style.display = 'block';
        
        const percentage = (sent / total) * 100;
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${sent} / ${total} پیام ارسال شده`;
    }

    // مخفی کردن QR Code
    hideQRCode() {
        const qrContainer = document.getElementById('qr-container');
        const instructions = document.getElementById('qr-instructions');
        
        qrContainer.style.display = 'none';
        instructions.style.display = 'none';
    }

    // نمایش خطا
    showError(message) {
        const messagesDiv = document.getElementById('messages');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = `❌ ${message}`;
        messagesDiv.appendChild(errorDiv);
    }

    // نمایش پیام
    addMessage(message) {
        const messagesDiv = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.textContent = `${new Date().toLocaleTimeString('fa-IR')}: ${message}`;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // نمایش گزارش تکمیل
    showCompletionReport(report) {
        const messagesDiv = document.getElementById('messages');
        const reportDiv = document.createElement('div');
        reportDiv.className = 'success-message';
        reportDiv.innerHTML = `
            <h3>✅ کمپین تکمیل شد</h3>
            <p>ارسال موفق: ${report.totalSent}</p>
            <p>ارسال ناموفق: ${report.totalFailed}</p>
            <a href="${report.reportUrl}" target="_blank">دانلود گزارش</a>
        `;
        messagesDiv.appendChild(reportDiv);
    }
}
```

## 🔄 مدیریت وضعیت کمپین

### وضعیت‌های مختلف

```javascript
const CAMPAIGN_STATUS = {
    IDLE: 'idle',
    READY: 'ready',
    RUNNING: 'running',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};

// مدیریت تغییر وضعیت
function handleCampaignStatusChange(newStatus) {
    switch (newStatus) {
        case CAMPAIGN_STATUS.IDLE:
            showIdleState();
            break;
        case CAMPAIGN_STATUS.READY:
            showReadyState();
            break;
        case CAMPAIGN_STATUS.RUNNING:
            showRunningState();
            break;
        case CAMPAIGN_STATUS.PAUSED:
            showPausedState();
            break;
        case CAMPAIGN_STATUS.COMPLETED:
            showCompletedState();
            break;
        case CAMPAIGN_STATUS.FAILED:
            showFailedState();
            break;
    }
}
```

### کنترل کمپین

```javascript
// شروع کمپین
async function startCampaign() {
    try {
        const response = await fetch(`/api/campaigns/${campaignId}/start`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to start campaign');
        }

        const data = await response.json();
        console.log('Campaign started:', data);
        return data;
    } catch (error) {
        console.error('Error starting campaign:', error);
        throw error;
    }
}

// توقف کمپین
async function pauseCampaign() {
    try {
        const response = await fetch(`/api/campaigns/${campaignId}/pause`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to pause campaign');
        }

        const data = await response.json();
        console.log('Campaign paused:', data);
        return data;
    } catch (error) {
        console.error('Error pausing campaign:', error);
        throw error;
    }
}
```

## 🎨 استایل‌های CSS

```css
/* استایل‌های اصلی */
.whatsapp-connector {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.status-indicator {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 8px;
}

.status-connected { background-color: #28a745; }
.status-disconnected { background-color: #dc3545; }
.status-waiting { background-color: #ffc107; }

.qr-code-container {
    text-align: center;
    margin: 20px 0;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.qr-code-image {
    max-width: 300px;
    height: auto;
    border: 2px solid #dee2e6;
    border-radius: 8px;
}

.progress-container {
    margin: 20px 0;
}

.progress-bar {
    width: 100%;
    height: 20px;
    background: #e9ecef;
    border-radius: 10px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #28a745, #20c997);
    transition: width 0.3s ease;
}

.message-log {
    max-height: 300px;
    overflow-y: auto;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 15px;
    margin: 20px 0;
}

.message-item {
    padding: 5px 0;
    border-bottom: 1px solid #e9ecef;
}

.message-item:last-child {
    border-bottom: none;
}

.control-buttons {
    display: flex;
    gap: 10px;
    margin: 20px 0;
}

.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
}

.btn-primary {
    background: #007bff;
    color: white;
}

.btn-primary:hover {
    background: #0056b3;
}

.btn-success {
    background: #28a745;
    color: white;
}

.btn-success:hover {
    background: #1e7e34;
}

.btn-danger {
    background: #dc3545;
    color: white;
}

.btn-danger:hover {
    background: #c82333;
}

.btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
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

/* ریسپانسیو */
@media (max-width: 768px) {
    .whatsapp-connector {
        padding: 10px;
    }
    
    .qr-code-image {
        max-width: 250px;
    }
    
    .control-buttons {
        flex-direction: column;
    }
    
    .btn {
        width: 100%;
        margin: 5px 0;
    }
}
```

## 🔧 تنظیمات پیشرفته

### مدیریت خطا

```javascript
class ErrorHandler {
    static handleConnectionError(error) {
        console.error('Connection error:', error);
        
        // نمایش پیام خطا به کاربر
        this.showErrorMessage('خطا در اتصال به سرور');
        
        // تلاش برای اتصال مجدد
        setTimeout(() => {
            this.reconnect();
        }, 5000);
    }
    
    static showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        // حذف پیام خطا بعد از 5 ثانیه
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}
```

### مدیریت حافظه

```javascript
class MemoryManager {
    static cleanup() {
        // پاکسازی event listeners
        if (this.socket) {
            this.socket.onopen = null;
            this.socket.onmessage = null;
            this.socket.onclose = null;
            this.socket.onerror = null;
        }
        
        // پاکسازی timers
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        
        // پاکسازی DOM references
        this.qrContainer = null;
        this.statusElement = null;
    }
}
```

## 📱 نمونه کامل React

```jsx
import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode.react';

const WhatsAppConnector = ({ campaignId, userId, token }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [status, setStatus] = useState('disconnected');
    const [progress, setProgress] = useState({ sent: 0, total: 0 });
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        connectWebSocket();
        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, []);

    const connectWebSocket = () => {
        const url = `ws://localhost:3000/ws/campaigns?campaignId=${campaignId}&userId=${userId}`;
        const ws = new WebSocket(url);
        
        ws.onopen = () => {
            setIsConnected(true);
            setStatus('connected');
            addMessage('WebSocket connected');
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleMessage(data);
        };
        
        ws.onclose = () => {
            setIsConnected(false);
            setStatus('disconnected');
            addMessage('WebSocket disconnected');
        };
        
        ws.onerror = (error) => {
            setStatus('error');
            addMessage(`Error: ${error}`);
        };
        
        setSocket(ws);
    };

    const handleMessage = (data) => {
        switch (data.type) {
            case 'qr_code':
                setQrCode(data.data.qrCode);
                setStatus('waiting');
                addMessage('QR Code received');
                break;
            case 'status_update':
                setStatus(data.data.status);
                addMessage(`Status: ${data.data.message}`);
                break;
            case 'progress_update':
                setProgress(data.data.progress);
                break;
            default:
                addMessage(`Received: ${data.type}`);
        }
    };

    const addMessage = (message) => {
        setMessages(prev => [...prev, {
            id: Date.now(),
            message,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    const generateQRCode = async () => {
        try {
            const response = await fetch(`/api/campaigns/${campaignId}/qr-code`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate QR code');
            }
            
            addMessage('QR Code generation initiated');
        } catch (error) {
            addMessage(`Error: ${error.message}`);
        }
    };

    return (
        <div className="whatsapp-connector">
            <h1>WhatsApp Connection</h1>
            
            <div className={`status-indicator status-${status}`}>
                Status: {status}
            </div>
            
            {qrCode && (
                <div className="qr-code-container">
                    <h3>QR Code</h3>
                    <QRCode value={qrCode} size={300} />
                    <p>Scan this QR code with WhatsApp</p>
                </div>
            )}
            
            {progress.total > 0 && (
                <div className="progress-container">
                    <h3>Progress</h3>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${(progress.sent / progress.total) * 100}%` }}
                        />
                    </div>
                    <p>{progress.sent} / {progress.total} messages sent</p>
                </div>
            )}
            
            <div className="control-buttons">
                <button onClick={generateQRCode} disabled={!isConnected}>
                    Generate QR Code
                </button>
            </div>
            
            <div className="message-log">
                {messages.map(msg => (
                    <div key={msg.id} className="message-item">
                        {msg.timestamp}: {msg.message}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WhatsAppConnector;
```

## 🚀 راه‌اندازی سریع

### 1. نصب وابستگی‌ها

```bash
npm install qrcode qrcode.react
```

### 2. تنظیمات اولیه

```javascript
// تنظیمات سرور
const SERVER_URL = 'ws://localhost:3000';
const API_BASE_URL = 'http://localhost:3000/api';

// تنظیمات اتصال
const CONNECTION_CONFIG = {
    reconnectAttempts: 5,
    reconnectInterval: 5000,
    pingInterval: 30000
};
```

### 3. استفاده

```javascript
// راه‌اندازی اتصال
const connector = new WhatsAppConnector(campaignId, userId, token);
connector.connect();

// تولید QR Code
await connector.generateQRCode();

// بررسی وضعیت
const status = await connector.checkConnectionStatus();
```

## 📚 منابع اضافی

- [WebSocket API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [QR Code Library](https://github.com/soldair/node-qrcode)
- [WhatsApp Web.js Documentation](https://wwebjs.dev/)

---

**نکته**: این راهنما به‌روزرسانی می‌شود. لطفاً آخرین نسخه را بررسی کنید.
