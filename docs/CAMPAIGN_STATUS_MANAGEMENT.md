# 📊 راهنمای مدیریت وضعیت کمپین در فرانت‌اند

راهنمای کامل برای مدیریت وضعیت کمپین‌ها و به‌روزرسانی UI در فرانت‌اند

## 🎯 نمای کلی

این راهنما نحوه مدیریت وضعیت کمپین‌ها، نمایش پیشرفت، و به‌روزرسانی UI را در فرانت‌اند توضیح می‌دهد.

## 📋 وضعیت‌های کمپین

### 1. تعریف وضعیت‌ها

```javascript
const CAMPAIGN_STATUS = {
    // وضعیت‌های اولیه
    DRAFT: 'DRAFT',           // پیش‌نویس
    READY: 'READY',           // آماده
    PENDING: 'PENDING',       // در انتظار
    
    // وضعیت‌های اجرا
    RUNNING: 'RUNNING',       // در حال اجرا
    PAUSED: 'PAUSED',         // متوقف شده
    RESUMED: 'RESUMED',       // از سر گرفته شده
    
    // وضعیت‌های نهایی
    COMPLETED: 'COMPLETED',   // تکمیل شده
    FAILED: 'FAILED',         // ناموفق
    CANCELLED: 'CANCELLED',   // لغو شده
    
    // وضعیت‌های خاص
    SCHEDULED: 'SCHEDULED',   // زمان‌بندی شده
    EXPIRED: 'EXPIRED'        // منقضی شده
};

// وضعیت‌های WhatsApp
const WHATSAPP_STATUS = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    READY: 'ready',
    FAILED: 'failed'
};
```

### 2. کلاس مدیریت وضعیت

```javascript
class CampaignStatusManager {
    constructor() {
        this.status = CAMPAIGN_STATUS.DRAFT;
        this.whatsappStatus = WHATSAPP_STATUS.DISCONNECTED;
        this.progress = {
            total: 0,
            sent: 0,
            failed: 0,
            delivered: 0
        };
        this.listeners = new Map();
        this.statusHistory = [];
    }

    // تنظیم وضعیت
    setStatus(newStatus, metadata = {}) {
        const oldStatus = this.status;
        this.status = newStatus;
        
        // اضافه کردن به تاریخچه
        this.statusHistory.push({
            status: newStatus,
            timestamp: new Date(),
            metadata
        });
        
        // اطلاع‌رسانی به listeners
        this.emit('statusChanged', {
            oldStatus,
            newStatus,
            metadata
        });
        
        // اجرای اقدامات مربوط به وضعیت
        this.handleStatusChange(newStatus, oldStatus);
    }

    // تنظیم وضعیت WhatsApp
    setWhatsAppStatus(status, metadata = {}) {
        const oldStatus = this.whatsappStatus;
        this.whatsappStatus = status;
        
        this.emit('whatsappStatusChanged', {
            oldStatus,
            newStatus: status,
            metadata
        });
    }

    // به‌روزرسانی پیشرفت
    updateProgress(progress) {
        this.progress = { ...this.progress, ...progress };
        this.emit('progressUpdated', this.progress);
    }

    // دریافت وضعیت فعلی
    getStatus() {
        return {
            campaign: this.status,
            whatsapp: this.whatsappStatus,
            progress: this.progress,
            history: this.statusHistory
        };
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
    <title>Campaign Status Manager</title>
    <link rel="stylesheet" href="campaign-status.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>📊 مدیریت وضعیت کمپین</h1>
            <div id="campaign-info" class="campaign-info">
                <span id="campaign-title">عنوان کمپین</span>
                <span id="campaign-id">ID: #12345</span>
            </div>
        </header>

        <main>
            <!-- وضعیت کلی -->
            <section class="status-section">
                <h2>وضعیت کلی</h2>
                <div class="status-grid">
                    <div class="status-card">
                        <div class="status-icon">📱</div>
                        <div class="status-content">
                            <h3>وضعیت WhatsApp</h3>
                            <div id="whatsapp-status" class="status-indicator">
                                <span class="status-dot"></span>
                                <span class="status-text">قطع شده</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="status-card">
                        <div class="status-icon">📊</div>
                        <div class="status-content">
                            <h3>وضعیت کمپین</h3>
                            <div id="campaign-status" class="status-indicator">
                                <span class="status-dot"></span>
                                <span class="status-text">پیش‌نویس</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- پیشرفت -->
            <section class="progress-section">
                <h2>پیشرفت ارسال</h2>
                <div class="progress-container">
                    <div class="progress-bar">
                        <div id="progress-fill" class="progress-fill"></div>
                    </div>
                    <div class="progress-stats">
                        <div class="stat-item">
                            <span class="stat-label">کل پیام‌ها:</span>
                            <span id="total-messages" class="stat-value">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">ارسال شده:</span>
                            <span id="sent-messages" class="stat-value">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">ناموفق:</span>
                            <span id="failed-messages" class="stat-value">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">دریافت شده:</span>
                            <span id="delivered-messages" class="stat-value">0</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- کنترل‌ها -->
            <section class="controls-section">
                <h2>کنترل کمپین</h2>
                <div class="control-buttons">
                    <button id="start-btn" class="btn btn-success">شروع</button>
                    <button id="pause-btn" class="btn btn-warning">توقف</button>
                    <button id="resume-btn" class="btn btn-info">ادامه</button>
                    <button id="stop-btn" class="btn btn-danger">قطع</button>
                </div>
            </section>

            <!-- تاریخچه وضعیت -->
            <section class="history-section">
                <h2>تاریخچه وضعیت</h2>
                <div id="status-history" class="status-history">
                    <!-- تاریخچه وضعیت‌ها اینجا نمایش داده می‌شود -->
                </div>
            </section>

            <!-- لاگ رویدادها -->
            <section class="events-section">
                <h2>رویدادها</h2>
                <div id="events-log" class="events-log">
                    <!-- رویدادها اینجا نمایش داده می‌شود -->
                </div>
            </section>
        </main>
    </div>

    <script src="campaign-status-manager.js"></script>
    <script src="campaign-status-ui.js"></script>
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

/* اطلاعات کمپین */
.campaign-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    margin: 20px 0;
}

.campaign-info span {
    font-weight: bold;
    color: #495057;
}

/* بخش‌ها */
.status-section,
.progress-section,
.controls-section,
.history-section,
.events-section {
    margin: 20px 0;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.section h2 {
    margin: 0 0 20px 0;
    color: #333;
    border-bottom: 2px solid #007bff;
    padding-bottom: 10px;
}

/* وضعیت */
.status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.status-card {
    display: flex;
    align-items: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #dee2e6;
}

.status-icon {
    font-size: 2em;
    margin-left: 15px;
}

.status-content h3 {
    margin: 0 0 10px 0;
    color: #495057;
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
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
.status-dot.ready { background: #17a2b8; }
.status-dot.failed { background: #dc3545; }

.status-text {
    font-weight: 500;
    color: #495057;
}

/* پیشرفت */
.progress-container {
    margin: 20px 0;
}

.progress-bar {
    width: 100%;
    height: 25px;
    background: #e9ecef;
    border-radius: 12px;
    overflow: hidden;
    margin: 15px 0;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #28a745, #20c997);
    transition: width 0.3s ease;
    width: 0%;
}

.progress-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin: 20px 0;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 5px;
    border: 1px solid #dee2e6;
}

.stat-label {
    font-weight: 500;
    color: #495057;
}

.stat-value {
    font-weight: bold;
    color: #007bff;
}

/* کنترل‌ها */
.control-buttons {
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
}

.btn {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    min-width: 120px;
}

.btn-success {
    background: #28a745;
    color: white;
}

.btn-success:hover {
    background: #1e7e34;
}

.btn-warning {
    background: #ffc107;
    color: #212529;
}

.btn-warning:hover {
    background: #e0a800;
}

.btn-info {
    background: #17a2b8;
    color: white;
}

.btn-info:hover {
    background: #138496;
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

/* تاریخچه */
.status-history {
    max-height: 300px;
    overflow-y: auto;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 15px;
}

.history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    margin: 5px 0;
    background: white;
    border-radius: 5px;
    border-left: 4px solid #007bff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.history-item.status-draft { border-left-color: #6c757d; }
.history-item.status-ready { border-left-color: #17a2b8; }
.history-item.status-running { border-left-color: #28a745; }
.history-item.status-paused { border-left-color: #ffc107; }
.history-item.status-completed { border-left-color: #28a745; }
.history-item.status-failed { border-left-color: #dc3545; }

.history-status {
    font-weight: bold;
    color: #495057;
}

.history-timestamp {
    font-size: 0.9em;
    color: #6c757d;
}

/* رویدادها */
.events-log {
    max-height: 400px;
    overflow-y: auto;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 15px;
}

.event-item {
    padding: 10px;
    margin: 5px 0;
    border-radius: 5px;
    border-left: 4px solid #007bff;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.event-item.info { border-left-color: #17a2b8; }
.event-item.success { border-left-color: #28a745; }
.event-item.warning { border-left-color: #ffc107; }
.event-item.error { border-left-color: #dc3545; }

.event-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.event-message {
    font-weight: 500;
    color: #495057;
}

.event-timestamp {
    font-size: 0.8em;
    color: #6c757d;
}

/* ریسپانسیو */
@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
    
    .status-grid {
        grid-template-columns: 1fr;
    }
    
    .progress-stats {
        grid-template-columns: 1fr;
    }
    
    .control-buttons {
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

.history-item,
.event-item {
    animation: slideIn 0.3s ease;
}
```

### 3. JavaScript Implementation

```javascript
class CampaignStatusUI {
    constructor(statusManager) {
        this.statusManager = statusManager;
        this.elements = {
            campaignTitle: document.getElementById('campaign-title'),
            campaignId: document.getElementById('campaign-id'),
            whatsappStatus: document.getElementById('whatsapp-status'),
            campaignStatus: document.getElementById('campaign-status'),
            progressFill: document.getElementById('progress-fill'),
            totalMessages: document.getElementById('total-messages'),
            sentMessages: document.getElementById('sent-messages'),
            failedMessages: document.getElementById('failed-messages'),
            deliveredMessages: document.getElementById('delivered-messages'),
            statusHistory: document.getElementById('status-history'),
            eventsLog: document.getElementById('events-log')
        };
        
        this.setupEventListeners();
        this.setupStatusListeners();
    }

    // تنظیم event listeners
    setupEventListeners() {
        document.getElementById('start-btn').onclick = () => {
            this.startCampaign();
        };

        document.getElementById('pause-btn').onclick = () => {
            this.pauseCampaign();
        };

        document.getElementById('resume-btn').onclick = () => {
            this.resumeCampaign();
        };

        document.getElementById('stop-btn').onclick = () => {
            this.stopCampaign();
        };
    }

    // تنظیم status listeners
    setupStatusListeners() {
        this.statusManager.on('statusChanged', (data) => {
            this.updateCampaignStatus(data.newStatus);
            this.addStatusHistory(data.newStatus, data.metadata);
            this.updateControlButtons(data.newStatus);
        });

        this.statusManager.on('whatsappStatusChanged', (data) => {
            this.updateWhatsAppStatus(data.newStatus);
        });

        this.statusManager.on('progressUpdated', (progress) => {
            this.updateProgress(progress);
        });
    }

    // به‌روزرسانی وضعیت کمپین
    updateCampaignStatus(status) {
        const statusDot = this.elements.campaignStatus.querySelector('.status-dot');
        const statusText = this.elements.campaignStatus.querySelector('.status-text');
        
        statusDot.className = `status-dot ${status.toLowerCase()}`;
        statusText.textContent = this.getStatusText(status);
    }

    // به‌روزرسانی وضعیت WhatsApp
    updateWhatsAppStatus(status) {
        const statusDot = this.elements.whatsappStatus.querySelector('.status-dot');
        const statusText = this.elements.whatsappStatus.querySelector('.status-text');
        
        statusDot.className = `status-dot ${status}`;
        statusText.textContent = this.getWhatsAppStatusText(status);
    }

    // به‌روزرسانی پیشرفت
    updateProgress(progress) {
        const percentage = progress.total > 0 ? (progress.sent / progress.total) * 100 : 0;
        this.elements.progressFill.style.width = `${percentage}%`;
        
        this.elements.totalMessages.textContent = progress.total;
        this.elements.sentMessages.textContent = progress.sent;
        this.elements.failedMessages.textContent = progress.failed;
        this.elements.deliveredMessages.textContent = progress.delivered;
    }

    // به‌روزرسانی دکمه‌های کنترل
    updateControlButtons(status) {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const resumeBtn = document.getElementById('resume-btn');
        const stopBtn = document.getElementById('stop-btn');

        // غیرفعال کردن همه دکمه‌ها
        [startBtn, pauseBtn, resumeBtn, stopBtn].forEach(btn => {
            btn.disabled = true;
        });

        // فعال کردن دکمه‌های مناسب
        switch (status) {
            case CAMPAIGN_STATUS.READY:
                startBtn.disabled = false;
                break;
            case CAMPAIGN_STATUS.RUNNING:
                pauseBtn.disabled = false;
                stopBtn.disabled = false;
                break;
            case CAMPAIGN_STATUS.PAUSED:
                resumeBtn.disabled = false;
                stopBtn.disabled = false;
                break;
        }
    }

    // اضافه کردن به تاریخچه
    addStatusHistory(status, metadata) {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item status-${status.toLowerCase()}`;
        
        const timestamp = new Date().toLocaleTimeString('fa-IR');
        historyItem.innerHTML = `
            <span class="history-status">${this.getStatusText(status)}</span>
            <span class="history-timestamp">${timestamp}</span>
        `;
        
        this.elements.statusHistory.insertBefore(historyItem, this.elements.statusHistory.firstChild);
    }

    // اضافه کردن رویداد
    addEvent(message, type = 'info') {
        const eventItem = document.createElement('div');
        eventItem.className = `event-item ${type}`;
        
        const timestamp = new Date().toLocaleTimeString('fa-IR');
        eventItem.innerHTML = `
            <div class="event-content">
                <span class="event-message">${message}</span>
                <span class="event-timestamp">${timestamp}</span>
            </div>
        `;
        
        this.elements.eventsLog.appendChild(eventItem);
        this.elements.eventsLog.scrollTop = this.elements.eventsLog.scrollHeight;
    }

    // دریافت متن وضعیت
    getStatusText(status) {
        const statusTexts = {
            [CAMPAIGN_STATUS.DRAFT]: 'پیش‌نویس',
            [CAMPAIGN_STATUS.READY]: 'آماده',
            [CAMPAIGN_STATUS.PENDING]: 'در انتظار',
            [CAMPAIGN_STATUS.RUNNING]: 'در حال اجرا',
            [CAMPAIGN_STATUS.PAUSED]: 'متوقف شده',
            [CAMPAIGN_STATUS.RESUMED]: 'از سر گرفته شده',
            [CAMPAIGN_STATUS.COMPLETED]: 'تکمیل شده',
            [CAMPAIGN_STATUS.FAILED]: 'ناموفق',
            [CAMPAIGN_STATUS.CANCELLED]: 'لغو شده',
            [CAMPAIGN_STATUS.SCHEDULED]: 'زمان‌بندی شده',
            [CAMPAIGN_STATUS.EXPIRED]: 'منقضی شده'
        };
        
        return statusTexts[status] || status;
    }

    // دریافت متن وضعیت WhatsApp
    getWhatsAppStatusText(status) {
        const statusTexts = {
            [WHATSAPP_STATUS.DISCONNECTED]: 'قطع شده',
            [WHATSAPP_STATUS.CONNECTING]: 'در حال اتصال',
            [WHATSAPP_STATUS.CONNECTED]: 'متصل',
            [WHATSAPP_STATUS.READY]: 'آماده',
            [WHATSAPP_STATUS.FAILED]: 'ناموفق'
        };
        
        return statusTexts[status] || status;
    }

    // شروع کمپین
    async startCampaign() {
        try {
            this.addEvent('شروع کمپین...', 'info');
            // منطق شروع کمپین
            this.statusManager.setStatus(CAMPAIGN_STATUS.RUNNING);
            this.addEvent('کمپین شروع شد', 'success');
        } catch (error) {
            this.addEvent(`خطا در شروع کمپین: ${error.message}`, 'error');
        }
    }

    // توقف کمپین
    async pauseCampaign() {
        try {
            this.addEvent('توقف کمپین...', 'info');
            // منطق توقف کمپین
            this.statusManager.setStatus(CAMPAIGN_STATUS.PAUSED);
            this.addEvent('کمپین متوقف شد', 'warning');
        } catch (error) {
            this.addEvent(`خطا در توقف کمپین: ${error.message}`, 'error');
        }
    }

    // ادامه کمپین
    async resumeCampaign() {
        try {
            this.addEvent('ادامه کمپین...', 'info');
            // منطق ادامه کمپین
            this.statusManager.setStatus(CAMPAIGN_STATUS.RUNNING);
            this.addEvent('کمپین از سر گرفته شد', 'success');
        } catch (error) {
            this.addEvent(`خطا در ادامه کمپین: ${error.message}`, 'error');
        }
    }

    // قطع کمپین
    async stopCampaign() {
        try {
            this.addEvent('قطع کمپین...', 'info');
            // منطق قطع کمپین
            this.statusManager.setStatus(CAMPAIGN_STATUS.CANCELLED);
            this.addEvent('کمپین قطع شد', 'error');
        } catch (error) {
            this.addEvent(`خطا در قطع کمپین: ${error.message}`, 'error');
        }
    }
}
```

## 🔧 تنظیمات پیشرفته

### 1. مدیریت خطا

```javascript
class CampaignErrorHandler {
    static handleError(error, context) {
        console.error('Campaign Error:', error, context);
        
        switch (error.type) {
            case 'START_FAILED':
                return this.handleStartError(error);
            case 'PAUSE_FAILED':
                return this.handlePauseError(error);
            case 'RESUME_FAILED':
                return this.handleResumeError(error);
            case 'STOP_FAILED':
                return this.handleStopError(error);
            default:
                return this.handleGenericError(error);
        }
    }
    
    static handleStartError(error) {
        return {
            message: 'خطا در شروع کمپین',
            action: 'retry',
            severity: 'high'
        };
    }
    
    static handlePauseError(error) {
        return {
            message: 'خطا در توقف کمپین',
            action: 'retry',
            severity: 'medium'
        };
    }
    
    static handleResumeError(error) {
        return {
            message: 'خطا در ادامه کمپین',
            action: 'retry',
            severity: 'medium'
        };
    }
    
    static handleStopError(error) {
        return {
            message: 'خطا در قطع کمپین',
            action: 'force_stop',
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
class CampaignOptimizer {
    static optimizeForMobile() {
        return {
            updateInterval: 1000,
            maxHistoryItems: 50,
            maxEventItems: 100
        };
    }
    
    static optimizeForDesktop() {
        return {
            updateInterval: 500,
            maxHistoryItems: 100,
            maxEventItems: 200
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
class CampaignMemoryManager {
    static cleanup(ui) {
        // پاکسازی event listeners
        ui.statusManager.removeAllListeners();
        
        // پاکسازی DOM references
        ui.elements = null;
        
        // پاکسازی timers
        if (ui.updateTimer) {
            clearInterval(ui.updateTimer);
        }
    }
}
```

## 🚀 راه‌اندازی سریع

### 1. استفاده پایه

```javascript
// ایجاد Status Manager
const statusManager = new CampaignStatusManager();

// ایجاد UI Manager
const uiManager = new CampaignStatusUI(statusManager);

// تنظیم وضعیت
statusManager.setStatus(CAMPAIGN_STATUS.READY);
statusManager.setWhatsAppStatus(WHATSAPP_STATUS.CONNECTED);
```

### 2. استفاده با WebSocket

```javascript
// اتصال به WebSocket
const wsManager = new WebSocketManager(campaignId, userId);

// تنظیم listeners
wsManager.on('statusUpdate', (data) => {
    statusManager.setStatus(data.status, data.metadata);
});

wsManager.on('progressUpdate', (data) => {
    statusManager.updateProgress(data.progress);
});
```

### 3. تنظیمات پیشرفته

```javascript
// تنظیمات سفارشی
const options = {
    updateInterval: 500,
    maxHistoryItems: 100,
    maxEventItems: 200
};

const uiManager = new CampaignStatusUI(statusManager, options);
```

---

**نکته**: این راهنما به‌روزرسانی می‌شود. لطفاً آخرین نسخه را بررسی کنید.
