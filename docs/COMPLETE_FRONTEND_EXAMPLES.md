# 🚀 نمونه‌های کامل پیاده‌سازی فرانت‌اند

راهنمای کامل برای پیاده‌سازی فرانت‌اند WhatsApp Campaign Manager

## 🎯 نمای کلی

این راهنما نمونه‌های کامل و آماده استفاده برای پیاده‌سازی فرانت‌اند WhatsApp Campaign Manager را ارائه می‌دهد.

## 📱 نمونه کامل React

### 1. کامپوننت اصلی

```jsx
import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode.react';
import './WhatsAppCampaign.css';

const WhatsAppCampaign = ({ campaignId, userId, token }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [status, setStatus] = useState('disconnected');
    const [progress, setProgress] = useState({ sent: 0, total: 0, failed: 0 });
    const [messages, setMessages] = useState([]);
    const [campaignStatus, setCampaignStatus] = useState('DRAFT');
    const [whatsappStatus, setWhatsappStatus] = useState('disconnected');
    
    const socketRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    useEffect(() => {
        connectWebSocket();
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [campaignId, userId]);

    const connectWebSocket = () => {
        const url = `ws://localhost:3000/ws/campaigns?campaignId=${campaignId}&userId=${userId}`;
        const ws = new WebSocket(url);
        
        ws.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
            setStatus('connected');
            reconnectAttempts.current = 0;
            addMessage('WebSocket connected', 'success');
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleMessage(data);
        };
        
        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
            setStatus('disconnected');
            addMessage('WebSocket disconnected', 'error');
            handleReconnect();
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setStatus('error');
            addMessage(`WebSocket error: ${error}`, 'error');
        };
        
        socketRef.current = ws;
        setSocket(ws);
    };

    const handleReconnect = () => {
        if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            console.log(`Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
            
            setTimeout(() => {
                connectWebSocket();
            }, 5000 * reconnectAttempts.current);
        } else {
            console.error('Max reconnection attempts reached');
            addMessage('Max reconnection attempts reached', 'error');
        }
    };

    const handleMessage = (data) => {
        console.log('Received message:', data.type);
        
        switch (data.type) {
            case 'qr_code':
                setQrCode(data.data.qrCode);
                setStatus('waiting');
                addMessage('QR Code received', 'success');
                break;
            case 'status_update':
                setWhatsappStatus(data.data.status);
                addMessage(`Status: ${data.data.message}`, 'info');
                break;
            case 'progress_update':
                setProgress(data.data.progress);
                addMessage(`Progress: ${data.data.progress.sent}/${data.data.progress.total}`, 'info');
                break;
            case 'error_update':
                addMessage(`Error: ${data.data.error}`, 'error');
                break;
            case 'completion_update':
                addMessage('Campaign completed', 'success');
                break;
            case 'campaign_update':
                setCampaignStatus(data.data.status);
                addMessage(`Campaign status: ${data.data.status}`, 'info');
                break;
            default:
                addMessage(`Unknown message type: ${data.type}`, 'warning');
        }
    };

    const addMessage = (message, type = 'info') => {
        const newMessage = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, newMessage]);
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
            
            addMessage('QR Code generation initiated', 'info');
        } catch (error) {
            addMessage(`Error generating QR code: ${error.message}`, 'error');
        }
    };

    const startCampaign = async () => {
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
            
            addMessage('Campaign started', 'success');
        } catch (error) {
            addMessage(`Error starting campaign: ${error.message}`, 'error');
        }
    };

    const pauseCampaign = async () => {
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
            
            addMessage('Campaign paused', 'warning');
        } catch (error) {
            addMessage(`Error pausing campaign: ${error.message}`, 'error');
        }
    };

    const stopCampaign = async () => {
        try {
            const response = await fetch(`/api/campaigns/${campaignId}/stop`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to stop campaign');
            }
            
            addMessage('Campaign stopped', 'error');
        } catch (error) {
            addMessage(`Error stopping campaign: ${error.message}`, 'error');
        }
    };

    const clearMessages = () => {
        setMessages([]);
    };

    return (
        <div className="whatsapp-campaign">
            <header className="campaign-header">
                <h1>📱 WhatsApp Campaign Manager</h1>
                <div className="connection-status">
                    <span className={`status-dot ${status}`}></span>
                    <span className="status-text">{status}</span>
                </div>
            </header>

            <main className="campaign-main">
                {/* وضعیت کلی */}
                <section className="status-section">
                    <h2>وضعیت کلی</h2>
                    <div className="status-grid">
                        <div className="status-card">
                            <div className="status-icon">📱</div>
                            <div className="status-content">
                                <h3>WhatsApp</h3>
                                <div className={`status-indicator ${whatsappStatus}`}>
                                    <span className="status-dot"></span>
                                    <span className="status-text">{whatsappStatus}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="status-card">
                            <div className="status-icon">📊</div>
                            <div className="status-content">
                                <h3>کمپین</h3>
                                <div className={`status-indicator ${campaignStatus.toLowerCase()}`}>
                                    <span className="status-dot"></span>
                                    <span className="status-text">{campaignStatus}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* QR Code */}
                <section className="qr-section">
                    <h2>QR Code</h2>
                    <div className="qr-container">
                        {qrCode ? (
                            <div className="qr-code-display">
                                {qrCode.startsWith('data:image/') ? (
                                    <img src={qrCode} alt="WhatsApp QR Code" className="qr-code-image" />
                                ) : (
                                    <QRCode value={qrCode} size={300} level="H" />
                                )}
                                <div className="qr-instructions">
                                    <h4>نحوه اتصال:</h4>
                                    <ol>
                                        <li>WhatsApp را در گوشی خود باز کنید</li>
                                        <li>به Settings > Linked Devices بروید</li>
                                        <li>Link a Device را انتخاب کنید</li>
                                        <li>QR Code بالا را اسکن کنید</li>
                                    </ol>
                                </div>
                            </div>
                        ) : (
                            <div className="qr-placeholder">
                                <p>QR Code در دسترس نیست</p>
                                <button onClick={generateQRCode} className="btn btn-primary">
                                    تولید QR Code
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* پیشرفت */}
                <section className="progress-section">
                    <h2>پیشرفت</h2>
                    <div className="progress-container">
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ width: `${progress.total > 0 ? (progress.sent / progress.total) * 100 : 0}%` }}
                            />
                        </div>
                        <div className="progress-stats">
                            <div className="stat-item">
                                <span className="stat-label">کل:</span>
                                <span className="stat-value">{progress.total}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">ارسال شده:</span>
                                <span className="stat-value">{progress.sent}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">ناموفق:</span>
                                <span className="stat-value">{progress.failed}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* کنترل‌ها */}
                <section className="controls-section">
                    <h2>کنترل کمپین</h2>
                    <div className="control-buttons">
                        <button onClick={startCampaign} className="btn btn-success">
                            شروع
                        </button>
                        <button onClick={pauseCampaign} className="btn btn-warning">
                            توقف
                        </button>
                        <button onClick={stopCampaign} className="btn btn-danger">
                            قطع
                        </button>
                    </div>
                </section>

                {/* پیام‌ها */}
                <section className="messages-section">
                    <h2>پیام‌ها</h2>
                    <div className="messages-controls">
                        <button onClick={clearMessages} className="btn btn-secondary">
                            پاکسازی
                        </button>
                    </div>
                    <div className="messages-container">
                        {messages.map(msg => (
                            <div key={msg.id} className={`message-item ${msg.type}`}>
                                <span className="message-text">{msg.message}</span>
                                <span className="message-timestamp">{msg.timestamp}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default WhatsAppCampaign;
```

### 2. CSS Styles

```css
/* استایل‌های اصلی */
.whatsapp-campaign {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.campaign-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 20px;
}

.campaign-header h1 {
    margin: 0;
    color: #333;
}

.connection-status {
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
.status-dot.waiting { background: #ffc107; }
.status-dot.error { background: #dc3545; }

.status-text {
    font-weight: 500;
    color: #495057;
}

/* بخش‌ها */
.status-section,
.qr-section,
.progress-section,
.controls-section,
.messages-section {
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

/* QR Code */
.qr-container {
    text-align: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 2px dashed #dee2e6;
}

.qr-code-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.qr-code-image {
    max-width: 300px;
    height: auto;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.qr-instructions {
    background: #e3f2fd;
    border: 1px solid #bbdefb;
    border-radius: 8px;
    padding: 15px;
    text-align: right;
    max-width: 400px;
}

.qr-instructions h4 {
    margin: 0 0 10px 0;
    color: #1976d2;
}

.qr-instructions ol {
    margin: 0;
    padding-right: 20px;
}

.qr-instructions li {
    margin: 5px 0;
    color: #424242;
}

.qr-placeholder {
    color: #6c757d;
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

.btn-warning {
    background: #ffc107;
    color: #212529;
}

.btn-warning:hover {
    background: #e0a800;
}

.btn-danger {
    background: #dc3545;
    color: white;
}

.btn-danger:hover {
    background: #c82333;
}

.btn-secondary {
    background: #6c757d;
    color: white;
}

.btn-secondary:hover {
    background: #545b62;
}

.btn:disabled {
    background: #e9ecef;
    color: #6c757d;
    cursor: not-allowed;
}

/* پیام‌ها */
.messages-controls {
    margin-bottom: 15px;
}

.messages-container {
    max-height: 400px;
    overflow-y: auto;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 15px;
}

.message-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    margin: 5px 0;
    border-radius: 5px;
    border-left: 4px solid #007bff;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.message-item.info {
    border-left-color: #17a2b8;
}

.message-item.success {
    border-left-color: #28a745;
    background: #d4edda;
}

.message-item.warning {
    border-left-color: #ffc107;
    background: #fff3cd;
}

.message-item.error {
    border-left-color: #dc3545;
    background: #f8d7da;
}

.message-text {
    font-weight: 500;
    color: #495057;
}

.message-timestamp {
    font-size: 0.8em;
    color: #6c757d;
}

/* ریسپانسیو */
@media (max-width: 768px) {
    .whatsapp-campaign {
        padding: 10px;
    }
    
    .campaign-header {
        flex-direction: column;
        gap: 10px;
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

.message-item {
    animation: slideIn 0.3s ease;
}
```

## 🎨 نمونه کامل Vue.js

### 1. کامپوننت اصلی

```vue
<template>
    <div class="whatsapp-campaign">
        <header class="campaign-header">
            <h1>📱 WhatsApp Campaign Manager</h1>
            <div class="connection-status">
                <span :class="`status-dot ${status}`"></span>
                <span class="status-text">{{ status }}</span>
            </div>
        </header>

        <main class="campaign-main">
            <!-- وضعیت کلی -->
            <section class="status-section">
                <h2>وضعیت کلی</h2>
                <div class="status-grid">
                    <div class="status-card">
                        <div class="status-icon">📱</div>
                        <div class="status-content">
                            <h3>WhatsApp</h3>
                            <div :class="`status-indicator ${whatsappStatus}`">
                                <span class="status-dot"></span>
                                <span class="status-text">{{ whatsappStatus }}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="status-card">
                        <div class="status-icon">📊</div>
                        <div class="status-content">
                            <h3>کمپین</h3>
                            <div :class="`status-indicator ${campaignStatus.toLowerCase()}`">
                                <span class="status-dot"></span>
                                <span class="status-text">{{ campaignStatus }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- QR Code -->
            <section class="qr-section">
                <h2>QR Code</h2>
                <div class="qr-container">
                    <div v-if="qrCode" class="qr-code-display">
                        <img 
                            v-if="isImageQR" 
                            :src="qrCode" 
                            alt="WhatsApp QR Code" 
                            class="qr-code-image"
                        />
                        <div v-else class="qr-code-text">
                            <pre>{{ qrCode }}</pre>
                        </div>
                        <div class="qr-instructions">
                            <h4>نحوه اتصال:</h4>
                            <ol>
                                <li>WhatsApp را در گوشی خود باز کنید</li>
                                <li>به Settings > Linked Devices بروید</li>
                                <li>Link a Device را انتخاب کنید</li>
                                <li>QR Code بالا را اسکن کنید</li>
                            </ol>
                        </div>
                    </div>
                    <div v-else class="qr-placeholder">
                        <p>QR Code در دسترس نیست</p>
                        <button @click="generateQRCode" class="btn btn-primary">
                            تولید QR Code
                        </button>
                    </div>
                </div>
            </section>

            <!-- پیشرفت -->
            <section class="progress-section">
                <h2>پیشرفت</h2>
                <div class="progress-container">
                    <div class="progress-bar">
                        <div 
                            class="progress-fill" 
                            :style="{ width: `${progressPercentage}%` }"
                        />
                    </div>
                    <div class="progress-stats">
                        <div class="stat-item">
                            <span class="stat-label">کل:</span>
                            <span class="stat-value">{{ progress.total }}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">ارسال شده:</span>
                            <span class="stat-value">{{ progress.sent }}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">ناموفق:</span>
                            <span class="stat-value">{{ progress.failed }}</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- کنترل‌ها -->
            <section class="controls-section">
                <h2>کنترل کمپین</h2>
                <div class="control-buttons">
                    <button @click="startCampaign" class="btn btn-success">
                        شروع
                    </button>
                    <button @click="pauseCampaign" class="btn btn-warning">
                        توقف
                    </button>
                    <button @click="stopCampaign" class="btn btn-danger">
                        قطع
                    </button>
                </div>
            </section>

            <!-- پیام‌ها -->
            <section class="messages-section">
                <h2>پیام‌ها</h2>
                <div class="messages-controls">
                    <button @click="clearMessages" class="btn btn-secondary">
                        پاکسازی
                    </button>
                </div>
                <div class="messages-container">
                    <div 
                        v-for="msg in messages" 
                        :key="msg.id" 
                        :class="`message-item ${msg.type}`"
                    >
                        <span class="message-text">{{ msg.message }}</span>
                        <span class="message-timestamp">{{ msg.timestamp }}</span>
                    </div>
                </div>
            </section>
        </main>
    </div>
</template>

<script>
export default {
    name: 'WhatsAppCampaign',
    props: {
        campaignId: {
            type: [String, Number],
            required: true
        },
        userId: {
            type: [String, Number],
            required: true
        },
        token: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            socket: null,
            isConnected: false,
            qrCode: null,
            status: 'disconnected',
            progress: { sent: 0, total: 0, failed: 0 },
            messages: [],
            campaignStatus: 'DRAFT',
            whatsappStatus: 'disconnected',
            reconnectAttempts: 0,
            maxReconnectAttempts: 5
        };
    },
    computed: {
        isImageQR() {
            return this.qrCode && this.qrCode.startsWith('data:image/');
        },
        progressPercentage() {
            return this.progress.total > 0 ? (this.progress.sent / this.progress.total) * 100 : 0;
        }
    },
    mounted() {
        this.connectWebSocket();
    },
    beforeDestroy() {
        if (this.socket) {
            this.socket.close();
        }
    },
    methods: {
        connectWebSocket() {
            const url = `ws://localhost:3000/ws/campaigns?campaignId=${this.campaignId}&userId=${this.userId}`;
            this.socket = new WebSocket(url);
            
            this.socket.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.status = 'connected';
                this.reconnectAttempts = 0;
                this.addMessage('WebSocket connected', 'success');
            };
            
            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };
            
            this.socket.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.status = 'disconnected';
                this.addMessage('WebSocket disconnected', 'error');
                this.handleReconnect();
            };
            
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.status = 'error';
                this.addMessage(`WebSocket error: ${error}`, 'error');
            };
        },
        
        handleReconnect() {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                
                setTimeout(() => {
                    this.connectWebSocket();
                }, 5000 * this.reconnectAttempts);
            } else {
                console.error('Max reconnection attempts reached');
                this.addMessage('Max reconnection attempts reached', 'error');
            }
        },
        
        handleMessage(data) {
            console.log('Received message:', data.type);
            
            switch (data.type) {
                case 'qr_code':
                    this.qrCode = data.data.qrCode;
                    this.status = 'waiting';
                    this.addMessage('QR Code received', 'success');
                    break;
                case 'status_update':
                    this.whatsappStatus = data.data.status;
                    this.addMessage(`Status: ${data.data.message}`, 'info');
                    break;
                case 'progress_update':
                    this.progress = data.data.progress;
                    this.addMessage(`Progress: ${data.data.progress.sent}/${data.data.progress.total}`, 'info');
                    break;
                case 'error_update':
                    this.addMessage(`Error: ${data.data.error}`, 'error');
                    break;
                case 'completion_update':
                    this.addMessage('Campaign completed', 'success');
                    break;
                case 'campaign_update':
                    this.campaignStatus = data.data.status;
                    this.addMessage(`Campaign status: ${data.data.status}`, 'info');
                    break;
                default:
                    this.addMessage(`Unknown message type: ${data.type}`, 'warning');
            }
        },
        
        addMessage(message, type = 'info') {
            const newMessage = {
                id: Date.now(),
                message,
                type,
                timestamp: new Date().toLocaleTimeString()
            };
            this.messages.push(newMessage);
        },
        
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
                
                this.addMessage('QR Code generation initiated', 'info');
            } catch (error) {
                this.addMessage(`Error generating QR code: ${error.message}`, 'error');
            }
        },
        
        async startCampaign() {
            try {
                const response = await fetch(`/api/campaigns/${this.campaignId}/start`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to start campaign');
                }
                
                this.addMessage('Campaign started', 'success');
            } catch (error) {
                this.addMessage(`Error starting campaign: ${error.message}`, 'error');
            }
        },
        
        async pauseCampaign() {
            try {
                const response = await fetch(`/api/campaigns/${this.campaignId}/pause`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to pause campaign');
                }
                
                this.addMessage('Campaign paused', 'warning');
            } catch (error) {
                this.addMessage(`Error pausing campaign: ${error.message}`, 'error');
            }
        },
        
        async stopCampaign() {
            try {
                const response = await fetch(`/api/campaigns/${this.campaignId}/stop`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to stop campaign');
                }
                
                this.addMessage('Campaign stopped', 'error');
            } catch (error) {
                this.addMessage(`Error stopping campaign: ${error.message}`, 'error');
            }
        },
        
        clearMessages() {
            this.messages = [];
        }
    }
};
</script>

<style scoped>
/* استایل‌های مشابه React component */
.whatsapp-campaign {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.campaign-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 20px;
}

.connection-status {
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
.status-dot.waiting { background: #ffc107; }
.status-dot.error { background: #dc3545; }

/* سایر استایل‌ها مشابه React component */
</style>
```

## 🎨 نمونه کامل Angular

### 1. کامپوننت اصلی

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-whatsapp-campaign',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './whatsapp-campaign.component.html',
  styleUrls: ['./whatsapp-campaign.component.css']
})
export class WhatsAppCampaignComponent implements OnInit, OnDestroy {
  socket: WebSocket | null = null;
  isConnected = false;
  qrCode: string | null = null;
  status = 'disconnected';
  progress = { sent: 0, total: 0, failed: 0 };
  messages: Array<{id: number, message: string, type: string, timestamp: string}> = [];
  campaignStatus = 'DRAFT';
  whatsappStatus = 'disconnected';
  reconnectAttempts = 0;
  maxReconnectAttempts = 5;

  constructor(
    private campaignId: string,
    private userId: string,
    private token: string
  ) {}

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
    
    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.status = 'connected';
      this.reconnectAttempts = 0;
      this.addMessage('WebSocket connected', 'success');
    };
    
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
    
    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
      this.status = 'disconnected';
      this.addMessage('WebSocket disconnected', 'error');
      this.handleReconnect();
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.status = 'error';
      this.addMessage(`WebSocket error: ${error}`, 'error');
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connectWebSocket();
      }, 5000 * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.addMessage('Max reconnection attempts reached', 'error');
    }
  }

  handleMessage(data: any) {
    console.log('Received message:', data.type);
    
    switch (data.type) {
      case 'qr_code':
        this.qrCode = data.data.qrCode;
        this.status = 'waiting';
        this.addMessage('QR Code received', 'success');
        break;
      case 'status_update':
        this.whatsappStatus = data.data.status;
        this.addMessage(`Status: ${data.data.message}`, 'info');
        break;
      case 'progress_update':
        this.progress = data.data.progress;
        this.addMessage(`Progress: ${data.data.progress.sent}/${data.data.progress.total}`, 'info');
        break;
      case 'error_update':
        this.addMessage(`Error: ${data.data.error}`, 'error');
        break;
      case 'completion_update':
        this.addMessage('Campaign completed', 'success');
        break;
      case 'campaign_update':
        this.campaignStatus = data.data.status;
        this.addMessage(`Campaign status: ${data.data.status}`, 'info');
        break;
      default:
        this.addMessage(`Unknown message type: ${data.type}`, 'warning');
    }
  }

  addMessage(message: string, type: string = 'info') {
    const newMessage = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    this.messages.push(newMessage);
  }

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
      
      this.addMessage('QR Code generation initiated', 'info');
    } catch (error) {
      this.addMessage(`Error generating QR code: ${error}`, 'error');
    }
  }

  async startCampaign() {
    try {
      const response = await fetch(`/api/campaigns/${this.campaignId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to start campaign');
      }
      
      this.addMessage('Campaign started', 'success');
    } catch (error) {
      this.addMessage(`Error starting campaign: ${error}`, 'error');
    }
  }

  async pauseCampaign() {
    try {
      const response = await fetch(`/api/campaigns/${this.campaignId}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to pause campaign');
      }
      
      this.addMessage('Campaign paused', 'warning');
    } catch (error) {
      this.addMessage(`Error pausing campaign: ${error}`, 'error');
    }
  }

  async stopCampaign() {
    try {
      const response = await fetch(`/api/campaigns/${this.campaignId}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to stop campaign');
      }
      
      this.addMessage('Campaign stopped', 'error');
    } catch (error) {
      this.addMessage(`Error stopping campaign: ${error}`, 'error');
    }
  }

  clearMessages() {
    this.messages = [];
  }

  get isImageQR() {
    return this.qrCode && this.qrCode.startsWith('data:image/');
  }

  get progressPercentage() {
    return this.progress.total > 0 ? (this.progress.sent / this.progress.total) * 100 : 0;
  }
}
```

### 2. Template

```html
<div class="whatsapp-campaign">
    <header class="campaign-header">
        <h1>📱 WhatsApp Campaign Manager</h1>
        <div class="connection-status">
            <span [class]="`status-dot ${status}`"></span>
            <span class="status-text">{{ status }}</span>
        </div>
    </header>

    <main class="campaign-main">
        <!-- وضعیت کلی -->
        <section class="status-section">
            <h2>وضعیت کلی</h2>
            <div class="status-grid">
                <div class="status-card">
                    <div class="status-icon">📱</div>
                    <div class="status-content">
                        <h3>WhatsApp</h3>
                        <div [class]="`status-indicator ${whatsappStatus}`">
                            <span class="status-dot"></span>
                            <span class="status-text">{{ whatsappStatus }}</span>
                        </div>
                    </div>
                </div>
                
                <div class="status-card">
                    <div class="status-icon">📊</div>
                    <div class="status-content">
                        <h3>کمپین</h3>
                        <div [class]="`status-indicator ${campaignStatus.toLowerCase()}`">
                            <span class="status-dot"></span>
                            <span class="status-text">{{ campaignStatus }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- QR Code -->
        <section class="qr-section">
            <h2>QR Code</h2>
            <div class="qr-container">
                <div *ngIf="qrCode" class="qr-code-display">
                    <img 
                        *ngIf="isImageQR" 
                        [src]="qrCode" 
                        alt="WhatsApp QR Code" 
                        class="qr-code-image"
                    />
                    <div *ngIf="!isImageQR" class="qr-code-text">
                        <pre>{{ qrCode }}</pre>
                    </div>
                    <div class="qr-instructions">
                        <h4>نحوه اتصال:</h4>
                        <ol>
                            <li>WhatsApp را در گوشی خود باز کنید</li>
                            <li>به Settings > Linked Devices بروید</li>
                            <li>Link a Device را انتخاب کنید</li>
                            <li>QR Code بالا را اسکن کنید</li>
                        </ol>
                    </div>
                </div>
                <div *ngIf="!qrCode" class="qr-placeholder">
                    <p>QR Code در دسترس نیست</p>
                    <button (click)="generateQRCode()" class="btn btn-primary">
                        تولید QR Code
                    </button>
                </div>
            </div>
        </section>

        <!-- پیشرفت -->
        <section class="progress-section">
            <h2>پیشرفت</h2>
            <div class="progress-container">
                <div class="progress-bar">
                    <div 
                        class="progress-fill" 
                        [style.width.%]="progressPercentage"
                    />
                </div>
                <div class="progress-stats">
                    <div class="stat-item">
                        <span class="stat-label">کل:</span>
                        <span class="stat-value">{{ progress.total }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">ارسال شده:</span>
                        <span class="stat-value">{{ progress.sent }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">ناموفق:</span>
                        <span class="stat-value">{{ progress.failed }}</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- کنترل‌ها -->
        <section class="controls-section">
            <h2>کنترل کمپین</h2>
            <div class="control-buttons">
                <button (click)="startCampaign()" class="btn btn-success">
                    شروع
                </button>
                <button (click)="pauseCampaign()" class="btn btn-warning">
                    توقف
                </button>
                <button (click)="stopCampaign()" class="btn btn-danger">
                    قطع
                </button>
            </div>
        </section>

        <!-- پیام‌ها -->
        <section class="messages-section">
            <h2>پیام‌ها</h2>
            <div class="messages-controls">
                <button (click)="clearMessages()" class="btn btn-secondary">
                    پاکسازی
                </button>
            </div>
            <div class="messages-container">
                <div 
                    *ngFor="let msg of messages" 
                    [class]="`message-item ${msg.type}`"
                >
                    <span class="message-text">{{ msg.message }}</span>
                    <span class="message-timestamp">{{ msg.timestamp }}</span>
                </div>
            </div>
        </section>
    </main>
</div>
```

## 🚀 راه‌اندازی سریع

### 1. نصب وابستگی‌ها

```bash
# React
npm install qrcode.react

# Vue
npm install vue-qr

# Angular
npm install @angular/common
```

### 2. استفاده

```javascript
// React
import WhatsAppCampaign from './WhatsAppCampaign';

<WhatsAppCampaign 
    campaignId={1} 
    userId={1} 
    token="your-jwt-token" 
/>

// Vue
<WhatsAppCampaign 
    :campaign-id="1" 
    :user-id="1" 
    token="your-jwt-token" 
/>

// Angular
<app-whatsapp-campaign 
    [campaignId]="1" 
    [userId]="1" 
    [token]="'your-jwt-token'">
</app-whatsapp-campaign>
```

### 3. تنظیمات

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

---

**نکته**: این راهنما به‌روزرسانی می‌شود. لطفاً آخرین نسخه را بررسی کنید.
