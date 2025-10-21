/**
 * تست کامل WhatsApp QR Code
 * این اسکریپت کل فرآیند را تست می‌کند
 */

const axios = require('axios');
const WebSocket = require('ws');

class WhatsAppQRTest {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.token = null;
        this.userId = null;
        this.campaignId = null;
        this.socket = null;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            info: '\x1b[36m',    // Cyan
            success: '\x1b[32m',  // Green
            error: '\x1b[31m',   // Red
            warning: '\x1b[33m', // Yellow
            reset: '\x1b[0m'
        };
        
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async testLogin() {
        try {
            this.log('🔐 تست ورود...', 'info');
            
            const response = await axios.post(`${this.baseURL}/api/user/login`, {
                email: 'ali@example.com',
                password: 'password123'
            });

            this.token = response.data.token;
            this.userId = response.data.user.id;
            
            this.log(`✅ ورود موفق - User ID: ${this.userId}`, 'success');
            return true;
        } catch (error) {
            this.log(`❌ خطا در ورود: ${error.message}`, 'error');
            return false;
        }
    }

    async testCreateCampaign() {
        try {
            this.log('📋 تست ایجاد کمپین...', 'info');
            
            const response = await axios.post(`${this.baseURL}/api/campaigns`, {
                title: 'تست QR Code',
                message: 'سلام، این یک پیام تست است',
                recipients: [
                    { phone: '989123456789', name: 'تست' }
                ]
            }, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            this.campaignId = response.data.campaign.id;
            this.log(`✅ کمپین ایجاد شد - ID: ${this.campaignId}`, 'success');
            return true;
        } catch (error) {
            this.log(`❌ خطا در ایجاد کمپین: ${error.message}`, 'error');
            return false;
        }
    }

    async testGenerateQRCode() {
        try {
            this.log('📱 تست تولید QR Code...', 'info');
            
            // Connect to WebSocket first
            await this.connectWebSocket();
            
            // Generate QR Code
            const response = await axios.post(`${this.baseURL}/api/campaigns/${this.campaignId}/qr-code`, {}, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            this.log(`✅ درخواست QR Code ارسال شد: ${response.data.message}`, 'success');
            return true;
        } catch (error) {
            this.log(`❌ خطا در تولید QR Code: ${error.message}`, 'error');
            return false;
        }
    }

    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            const wsUrl = `ws://localhost:3000/ws/campaigns?campaignId=${this.campaignId}&userId=${this.userId}`;
            this.log(`🔌 اتصال به WebSocket: ${wsUrl}`, 'info');
            
            this.socket = new WebSocket(wsUrl);
            
            this.socket.onopen = () => {
                this.log('✅ WebSocket متصل شد', 'success');
                resolve();
            };
            
            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.log(`📨 دریافت پیام WebSocket: ${data.type}`, 'info');
                    this.handleWebSocketMessage(data);
                } catch (error) {
                    this.log(`❌ خطا در پردازش پیام WebSocket: ${error.message}`, 'error');
                }
            };
            
            this.socket.onclose = () => {
                this.log('❌ WebSocket قطع شد', 'warning');
            };
            
            this.socket.onerror = (error) => {
                this.log(`❌ خطا در WebSocket: ${error.message}`, 'error');
                reject(error);
            };
        });
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'qr_code':
                this.log('📱 QR Code دریافت شد', 'success');
                this.log(`📱 QR Code: ${JSON.stringify(data.data).substring(0, 100)}...`, 'info');
                break;
            case 'status_update':
                this.log(`📊 وضعیت: ${data.data.status} - ${data.data.message}`, 'info');
                break;
            case 'error_update':
                this.log(`❌ خطا: ${data.data.error}`, 'error');
                break;
            default:
                this.log(`📨 پیام ناشناخته: ${data.type}`, 'warning');
        }
    }

    async testCheckConnection() {
        try {
            this.log('🔍 تست بررسی اتصال...', 'info');
            
            const response = await axios.get(`${this.baseURL}/api/campaigns/${this.campaignId}/connection`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            this.log(`📊 وضعیت اتصال: ${JSON.stringify(response.data)}`, 'info');
            
            if (response.data.isConnected) {
                this.log('✅ اتصال برقرار است', 'success');
            } else {
                this.log('❌ اتصال برقرار نیست', 'warning');
            }
            
            return response.data.isConnected;
        } catch (error) {
            this.log(`❌ خطا در بررسی اتصال: ${error.message}`, 'error');
            return false;
        }
    }

    async runFullTest() {
        this.log('🚀 شروع تست کامل WhatsApp QR Code', 'info');
        this.log('📋 مراحل: 1) ورود 2) ایجاد کمپین 3) تولید QR Code 4) بررسی اتصال', 'info');
        
        try {
            // Step 1: Login
            const loginSuccess = await this.testLogin();
            if (!loginSuccess) {
                this.log('❌ تست ورود ناموفق', 'error');
                return false;
            }
            
            await this.delay(1000);
            
            // Step 2: Create Campaign
            const campaignSuccess = await this.testCreateCampaign();
            if (!campaignSuccess) {
                this.log('❌ تست ایجاد کمپین ناموفق', 'error');
                return false;
            }
            
            await this.delay(1000);
            
            // Step 3: Generate QR Code
            const qrSuccess = await this.testGenerateQRCode();
            if (!qrSuccess) {
                this.log('❌ تست تولید QR Code ناموفق', 'error');
                return false;
            }
            
            // Wait for QR Code
            this.log('⏳ انتظار برای دریافت QR Code...', 'info');
            await this.delay(5000);
            
            // Step 4: Check Connection
            const connectionSuccess = await this.testCheckConnection();
            
            // Cleanup
            if (this.socket) {
                this.socket.close();
            }
            
            if (connectionSuccess) {
                this.log('✅ تست کامل موفق بود', 'success');
            } else {
                this.log('⚠️ تست کامل با موفقیت نسبی', 'warning');
            }
            
            return true;
            
        } catch (error) {
            this.log(`❌ خطا در تست: ${error.message}`, 'error');
            return false;
        }
    }
}

// Run the test
async function runTest() {
    const test = new WhatsAppQRTest();
    await test.runFullTest();
}

// Export for use in other files
module.exports = WhatsAppQRTest;

// Run if called directly
if (require.main === module) {
    runTest().catch(console.error);
}
