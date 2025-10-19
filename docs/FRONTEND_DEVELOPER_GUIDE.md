# 📚 راهنمای کامل توسعه‌دهنده فرانت‌اند

راهنمای جامع برای توسعه‌دهندگان فرانت‌اند WhatsApp Campaign Manager

## 🎯 نمای کلی

این راهنما تمام اطلاعات مورد نیاز برای پیاده‌سازی فرانت‌اند WhatsApp Campaign Manager را ارائه می‌دهد.

## 📋 فهرست مطالب

### 1. [راهنمای اتصال WhatsApp](./FRONTEND_WHATSAPP_INTEGRATION.md)
- اتصال WebSocket
- تولید و نمایش QR Code
- مدیریت وضعیت اتصال
- نمونه‌های کامل

### 2. [راهنمای پیاده‌سازی QR Code](./QR_CODE_IMPLEMENTATION.md)
- کتابخانه‌های مورد نیاز
- نمایش QR Code
- مدیریت خطا
- بهینه‌سازی عملکرد

### 3. [راهنمای WebSocket](./WEBSOCKET_FRONTEND_GUIDE.md)
- اتصال WebSocket
- مدیریت رویدادها
- اتصال مجدد
- مدیریت خطا

### 4. [راهنمای مدیریت وضعیت کمپین](./CAMPAIGN_STATUS_MANAGEMENT.md)
- وضعیت‌های کمپین
- مدیریت UI
- به‌روزرسانی پیشرفت
- کنترل کمپین

### 5. [نمونه‌های کامل](./COMPLETE_FRONTEND_EXAMPLES.md)
- React Component
- Vue.js Component
- Angular Component
- JavaScript خالص

## 🚀 شروع سریع

### 1. نصب وابستگی‌ها

```bash
# React
npm install qrcode.react

# Vue
npm install vue-qr

# Angular
npm install @angular/common

# JavaScript خالص
# فقط CDN را اضافه کنید
```

### 2. تنظیمات اولیه

```javascript
// تنظیمات WebSocket
const WS_CONFIG = {
    url: 'ws://localhost:3000/ws/campaigns',
    reconnectAttempts: 5,
    reconnectInterval: 5000,
    pingInterval: 30000
};

// تنظیمات API
const API_CONFIG = {
    baseUrl: 'http://localhost:3000/api',
    timeout: 30000
};
```

### 3. استفاده

```javascript
// ایجاد اتصال WebSocket
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

## 🔧 API Endpoints

### 1. تولید QR Code

```http
POST /api/campaigns/:campaignId/qr-code
Authorization: Bearer <token>
Content-Type: application/json
```

**Response:**
```json
{
    "message": "QR code generation initiated",
    "sessionId": "uuid-session-id",
    "instructions": "WhatsApp session is being prepared. QR code will be sent via WebSocket."
}
```

### 2. بررسی وضعیت اتصال

```http
GET /api/campaigns/:campaignId/connection
Authorization: Bearer <token>
```

**Response:**
```json
{
    "isConnected": true,
    "lastActivity": "2024-01-01T10:00:00Z",
    "hasActiveSession": true,
    "sessionId": "uuid-session-id"
}
```

### 3. شروع کمپین

```http
POST /api/campaigns/:campaignId/start
Authorization: Bearer <token>
Content-Type: application/json
```

**Response:**
```json
{
    "message": "Campaign started successfully",
    "campaignId": 1,
    "status": "RUNNING"
}
```

### 4. توقف کمپین

```http
POST /api/campaigns/:campaignId/pause
Authorization: Bearer <token>
Content-Type: application/json
```

**Response:**
```json
{
    "message": "Campaign paused successfully",
    "campaignId": 1,
    "status": "PAUSED"
}
```

## 📡 WebSocket Events

### 1. اتصال

```javascript
const socket = new WebSocket('ws://localhost:3000/ws/campaigns?campaignId=1&userId=1');
```

### 2. رویدادهای سیستم

```javascript
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
        case 'qr_code':
            // نمایش QR Code
            break;
        case 'status_update':
            // به‌روزرسانی وضعیت
            break;
        case 'progress_update':
            // به‌روزرسانی پیشرفت
            break;
        case 'error_update':
            // نمایش خطا
            break;
        case 'completion_update':
            // تکمیل کمپین
            break;
    }
};
```

## 🎨 نمونه‌های UI

### 1. React Component

```jsx
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';

const WhatsAppCampaign = ({ campaignId, userId, token }) => {
    const [socket, setSocket] = useState(null);
    const [qrCode, setQrCode] = useState(null);
    const [status, setStatus] = useState('disconnected');
    
    useEffect(() => {
        connectWebSocket();
        return () => {
            if (socket) socket.close();
        };
    }, []);
    
    const connectWebSocket = () => {
        const url = `ws://localhost:3000/ws/campaigns?campaignId=${campaignId}&userId=${userId}`;
        const ws = new WebSocket(url);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'qr_code') {
                setQrCode(data.data.qrCode);
            }
        };
        
        setSocket(ws);
    };
    
    return (
        <div className="whatsapp-campaign">
            <h1>WhatsApp Campaign</h1>
            {qrCode && (
                <div className="qr-container">
                    <QRCode value={qrCode} size={300} />
                </div>
            )}
        </div>
    );
};
```

### 2. Vue Component

```vue
<template>
    <div class="whatsapp-campaign">
        <h1>WhatsApp Campaign</h1>
        <div v-if="qrCode" class="qr-container">
            <img v-if="isImageQR" :src="qrCode" alt="QR Code" />
            <div v-else class="qr-text">{{ qrCode }}</div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            qrCode: null,
            socket: null
        };
    },
    computed: {
        isImageQR() {
            return this.qrCode && this.qrCode.startsWith('data:image/');
        }
    },
    mounted() {
        this.connectWebSocket();
    },
    methods: {
        connectWebSocket() {
            const url = `ws://localhost:3000/ws/campaigns?campaignId=${this.campaignId}&userId=${this.userId}`;
            this.socket = new WebSocket(url);
            
            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'qr_code') {
                    this.qrCode = data.data.qrCode;
                }
            };
        }
    }
};
</script>
```

### 3. Angular Component

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
    selector: 'app-whatsapp-campaign',
    template: `
        <div class="whatsapp-campaign">
            <h1>WhatsApp Campaign</h1>
            <div *ngIf="qrCode" class="qr-container">
                <img *ngIf="isImageQR" [src]="qrCode" alt="QR Code" />
                <div *ngIf="!isImageQR" class="qr-text">{{ qrCode }}</div>
            </div>
        </div>
    `
})
export class WhatsAppCampaignComponent implements OnInit, OnDestroy {
    qrCode: string | null = null;
    socket: WebSocket | null = null;
    
    ngOnInit() {
        this.connectWebSocket();
    }
    
    ngOnDestroy() {
        if (this.socket) {
            this.socket.close();
        }
    }
    
    connectWebSocket() {
        const url = `ws://localhost:3000/ws/campaigns?campaignId=${this.campaignId}&userId=${this.userId}`;
        this.socket = new WebSocket(url);
        
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'qr_code') {
                this.qrCode = data.data.qrCode;
            }
        };
    }
    
    get isImageQR() {
        return this.qrCode && this.qrCode.startsWith('data:image/');
    }
}
```

## 🔧 تنظیمات پیشرفته

### 1. مدیریت خطا

```javascript
class ErrorHandler {
    static handleWebSocketError(error) {
        console.error('WebSocket Error:', error);
        
        switch (error.type) {
            case 'CONNECTION_FAILED':
                return this.handleConnectionError(error);
            case 'MESSAGE_PARSE_ERROR':
                return this.handleParseError(error);
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
}
```

### 2. بهینه‌سازی عملکرد

```javascript
class PerformanceOptimizer {
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
}
```

### 3. مدیریت حافظه

```javascript
class MemoryManager {
    static cleanup(component) {
        // پاکسازی event listeners
        component.removeAllListeners();
        
        // پاکسازی DOM references
        component.elements = null;
        
        // پاکسازی timers
        if (component.updateTimer) {
            clearInterval(component.updateTimer);
        }
    }
}
```

## 📱 ریسپانسیو دیزاین

### 1. CSS Media Queries

```css
/* موبایل */
@media (max-width: 768px) {
    .whatsapp-campaign {
        padding: 10px;
    }
    
    .status-grid {
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

/* تبلت */
@media (min-width: 769px) and (max-width: 1024px) {
    .whatsapp-campaign {
        padding: 15px;
    }
    
    .status-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* دسکتاپ */
@media (min-width: 1025px) {
    .whatsapp-campaign {
        padding: 20px;
    }
    
    .status-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}
```

### 2. Touch Events

```javascript
// مدیریت touch events برای موبایل
class TouchHandler {
    static setupTouchEvents(element) {
        let startY = 0;
        let startX = 0;
        
        element.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            startX = e.touches[0].clientX;
        });
        
        element.addEventListener('touchmove', (e) => {
            const currentY = e.touches[0].clientY;
            const currentX = e.touches[0].clientX;
            
            const diffY = startY - currentY;
            const diffX = startX - currentX;
            
            if (Math.abs(diffY) > Math.abs(diffX)) {
                // عمودی
                if (diffY > 0) {
                    // بالا
                } else {
                    // پایین
                }
            } else {
                // افقی
                if (diffX > 0) {
                    // چپ
                } else {
                    // راست
                }
            }
        });
    }
}
```

## 🔒 امنیت

### 1. احراز هویت

```javascript
class AuthManager {
    static getToken() {
        return localStorage.getItem('jwt_token');
    }
    
    static setToken(token) {
        localStorage.setItem('jwt_token', token);
    }
    
    static removeToken() {
        localStorage.removeItem('jwt_token');
    }
    
    static isTokenValid() {
        const token = this.getToken();
        if (!token) return false;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp > Date.now() / 1000;
        } catch {
            return false;
        }
    }
}
```

### 2. محافظت از XSS

```javascript
class XSSProtection {
    static sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }
    
    static sanitizeHTML(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }
}
```

## 🧪 تست

### 1. Unit Tests

```javascript
// Jest
describe('WhatsAppCampaign', () => {
    test('should connect to WebSocket', () => {
        const campaign = new WhatsAppCampaign(1, 1, 'token');
        expect(campaign.connect).toBeDefined();
    });
    
    test('should handle QR code', () => {
        const campaign = new WhatsAppCampaign(1, 1, 'token');
        const qrData = 'test-qr-data';
        campaign.handleQRCode(qrData);
        expect(campaign.qrCode).toBe(qrData);
    });
});
```

### 2. Integration Tests

```javascript
// Cypress
describe('WhatsApp Campaign Integration', () => {
    it('should display QR code when received', () => {
        cy.visit('/campaign/1');
        cy.get('[data-testid="qr-container"]').should('be.visible');
    });
    
    it('should update progress when campaign starts', () => {
        cy.visit('/campaign/1');
        cy.get('[data-testid="start-btn"]').click();
        cy.get('[data-testid="progress-bar"]').should('be.visible');
    });
});
```

## 📚 منابع اضافی

- [WebSocket API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [QR Code Library](https://github.com/soldair/node-qrcode)
- [WhatsApp Web.js Documentation](https://wwebjs.dev/)
- [React Documentation](https://reactjs.org/docs)
- [Vue.js Documentation](https://vuejs.org/guide/)
- [Angular Documentation](https://angular.io/docs)

## 🆘 پشتیبانی

برای پشتیبانی و سوالات:

- **ایمیل**: support@whatsapp-campaign.com
- **تلگرام**: @whatsapp_campaign_support
- **گیت‌هاب**: [Issues](https://github.com/whatsapp-campaign/issues)

---

**نکته**: این راهنما به‌روزرسانی می‌شود. لطفاً آخرین نسخه را بررسی کنید.
