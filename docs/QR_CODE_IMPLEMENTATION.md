# 📱 راهنمای پیاده‌سازی QR Code برای WhatsApp

راهنمای کامل برای نمایش و مدیریت QR Code در فرانت‌اند

## 🎯 نمای کلی

QR Code برای اتصال WhatsApp از طریق WebSocket دریافت می‌شود و باید به صورت مناسب در UI نمایش داده شود.

## 🔧 کتابخانه‌های مورد نیاز

### 1. QRCode.js (Vanilla JavaScript)

```html
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
```

### 2. React QR Code

```bash
npm install qrcode.react
```

### 3. Vue QR Code

```bash
npm install vue-qr
```

## 📱 پیاده‌سازی QR Code

### 1. نمایش QR Code با JavaScript خالص

```javascript
class QRCodeDisplay {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.qrCode = null;
    }

    // نمایش QR Code
    displayQRCode(qrData) {
        if (!this.container) {
            console.error('Container not found');
            return;
        }

        // پاکسازی محتوای قبلی
        this.container.innerHTML = '';

        // بررسی نوع QR Code
        if (qrData.startsWith('data:image/')) {
            this.displayImageQRCode(qrData);
        } else {
            this.displayTextQRCode(qrData);
        }
    }

    // نمایش QR Code به صورت تصویر
    displayImageQRCode(imageData) {
        const img = document.createElement('img');
        img.src = imageData;
        img.alt = 'WhatsApp QR Code';
        img.className = 'qr-code-image';
        img.style.maxWidth = '300px';
        img.style.height = 'auto';
        img.style.border = '2px solid #dee2e6';
        img.style.borderRadius = '8px';
        
        this.container.appendChild(img);
    }

    // نمایش QR Code به صورت متن (نیاز به کتابخانه QRCode)
    displayTextQRCode(qrData) {
        if (typeof QRCode === 'undefined') {
            console.error('QRCode library not loaded');
            this.displayFallbackQRCode(qrData);
            return;
        }

        // ایجاد عنصر برای QR Code
        const qrDiv = document.createElement('div');
        qrDiv.className = 'qr-code-container';
        
        // تولید QR Code
        new QRCode(qrDiv, {
            text: qrData,
            width: 300,
            height: 300,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        this.container.appendChild(qrDiv);
    }

    // نمایش QR Code به صورت متن (بدون کتابخانه)
    displayFallbackQRCode(qrData) {
        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'qr-code-fallback';
        fallbackDiv.innerHTML = `
            <div class="qr-text">
                <h3>QR Code:</h3>
                <pre class="qr-data">${qrData}</pre>
                <p class="qr-instruction">این کد را با WhatsApp اسکن کنید</p>
            </div>
        `;
        
        this.container.appendChild(fallbackDiv);
    }

    // مخفی کردن QR Code
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    // نمایش QR Code
    show() {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    // پاکسازی QR Code
    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.qrCode = null;
    }
}
```

### 2. پیاده‌سازی با React

```jsx
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';

const WhatsAppQRCode = ({ qrData, isVisible, onQRCodeScanned }) => {
    const [qrCode, setQrCode] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (qrData) {
            setQrCode(qrData);
            setIsLoading(false);
        }
    }, [qrData]);

    const handleQRCodeGenerate = () => {
        setIsLoading(true);
        // منطق تولید QR Code
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="qr-code-container">
            <h3>📱 WhatsApp QR Code</h3>
            
            {isLoading ? (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>در حال تولید QR Code...</p>
                </div>
            ) : qrCode ? (
                <div className="qr-code-display">
                    {qrData.startsWith('data:image/') ? (
                        <img 
                            src={qrData} 
                            alt="WhatsApp QR Code" 
                            className="qr-code-image"
                        />
                    ) : (
                        <QRCode 
                            value={qrData} 
                            size={300}
                            level="H"
                            includeMargin={true}
                        />
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
                <div className="no-qr-code">
                    <p>QR Code در دسترس نیست</p>
                    <button onClick={handleQRCodeGenerate}>
                        تولید QR Code
                    </button>
                </div>
            )}
        </div>
    );
};

export default WhatsAppQRCode;
```

### 3. پیاده‌سازی با Vue.js

```vue
<template>
    <div class="qr-code-container" v-if="isVisible">
        <h3>📱 WhatsApp QR Code</h3>
        
        <div v-if="isLoading" class="loading">
            <div class="spinner"></div>
            <p>در حال تولید QR Code...</p>
        </div>
        
        <div v-else-if="qrData" class="qr-code-display">
            <img 
                v-if="isImageQR" 
                :src="qrData" 
                alt="WhatsApp QR Code" 
                class="qr-code-image"
            />
            <div v-else class="qr-code-text">
                <pre>{{ qrData }}</pre>
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
        
        <div v-else class="no-qr-code">
            <p>QR Code در دسترس نیست</p>
            <button @click="generateQRCode">
                تولید QR Code
            </button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'WhatsAppQRCode',
    props: {
        qrData: String,
        isVisible: Boolean
    },
    data() {
        return {
            isLoading: false
        };
    },
    computed: {
        isImageQR() {
            return this.qrData && this.qrData.startsWith('data:image/');
        }
    },
    methods: {
        async generateQRCode() {
            this.isLoading = true;
            try {
                await this.$emit('generate-qr');
            } catch (error) {
                console.error('Error generating QR code:', error);
            } finally {
                this.isLoading = false;
            }
        }
    }
};
</script>
```

## 🎨 استایل‌های CSS

```css
/* استایل‌های اصلی QR Code */
.qr-code-container {
    text-align: center;
    margin: 20px 0;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

.qr-code-text {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 15px;
    font-family: monospace;
    font-size: 12px;
    word-break: break-all;
    max-width: 300px;
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

/* انیمیشن‌ها */
.loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* ریسپانسیو */
@media (max-width: 768px) {
    .qr-code-container {
        padding: 15px;
    }
    
    .qr-code-image {
        max-width: 250px;
    }
    
    .qr-instructions {
        max-width: 100%;
    }
}

/* حالت تاریک */
@media (prefers-color-scheme: dark) {
    .qr-code-container {
        background: #2d3748;
        color: white;
    }
    
    .qr-code-image {
        border-color: #4a5568;
    }
    
    .qr-instructions {
        background: #2d3748;
        border-color: #4a5568;
        color: white;
    }
}
```

## 🔄 مدیریت وضعیت QR Code

### 1. کلاس مدیریت وضعیت

```javascript
class QRCodeManager {
    constructor() {
        this.qrCode = null;
        this.isVisible = false;
        this.isGenerating = false;
        this.listeners = [];
    }

    // اضافه کردن listener
    addListener(callback) {
        this.listeners.push(callback);
    }

    // حذف listener
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    // اطلاع‌رسانی به listeners
    notifyListeners(event, data) {
        this.listeners.forEach(listener => {
            if (typeof listener === 'function') {
                listener(event, data);
            }
        });
    }

    // تنظیم QR Code
    setQRCode(qrData) {
        this.qrCode = qrData;
        this.notifyListeners('qrCodeUpdated', qrData);
    }

    // نمایش QR Code
    show() {
        this.isVisible = true;
        this.notifyListeners('qrCodeShown', this.qrCode);
    }

    // مخفی کردن QR Code
    hide() {
        this.isVisible = false;
        this.notifyListeners('qrCodeHidden');
    }

    // شروع تولید QR Code
    startGenerating() {
        this.isGenerating = true;
        this.notifyListeners('qrCodeGenerating');
    }

    // پایان تولید QR Code
    stopGenerating() {
        this.isGenerating = false;
        this.notifyListeners('qrCodeGenerated', this.qrCode);
    }

    // پاکسازی QR Code
    clear() {
        this.qrCode = null;
        this.isVisible = false;
        this.isGenerating = false;
        this.notifyListeners('qrCodeCleared');
    }

    // دریافت وضعیت
    getStatus() {
        return {
            qrCode: this.qrCode,
            isVisible: this.isVisible,
            isGenerating: this.isGenerating
        };
    }
}
```

### 2. استفاده از QRCodeManager

```javascript
// ایجاد instance
const qrManager = new QRCodeManager();

// اضافه کردن listener
qrManager.addListener((event, data) => {
    switch (event) {
        case 'qrCodeUpdated':
            console.log('QR Code updated:', data);
            break;
        case 'qrCodeShown':
            console.log('QR Code shown');
            break;
        case 'qrCodeHidden':
            console.log('QR Code hidden');
            break;
        case 'qrCodeGenerating':
            console.log('Generating QR Code...');
            break;
        case 'qrCodeGenerated':
            console.log('QR Code generated:', data);
            break;
        case 'qrCodeCleared':
            console.log('QR Code cleared');
            break;
    }
});

// استفاده
qrManager.startGenerating();
qrManager.setQRCode('qr-data-string');
qrManager.show();
```

## 🔧 تنظیمات پیشرفته

### 1. تنظیمات QR Code

```javascript
const QR_CODE_CONFIG = {
    // تنظیمات کیفیت
    quality: {
        level: 'H', // L, M, Q, H
        margin: 4
    },
    
    // تنظیمات ظاهری
    appearance: {
        width: 300,
        height: 300,
        colorDark: '#000000',
        colorLight: '#ffffff'
    },
    
    // تنظیمات عملکرد
    performance: {
        cache: true,
        lazy: true
    }
};
```

### 2. مدیریت خطا

```javascript
class QRCodeErrorHandler {
    static handleError(error) {
        console.error('QR Code Error:', error);
        
        switch (error.type) {
            case 'GENERATION_FAILED':
                this.showErrorMessage('خطا در تولید QR Code');
                break;
            case 'DISPLAY_FAILED':
                this.showErrorMessage('خطا در نمایش QR Code');
                break;
            case 'SCAN_FAILED':
                this.showErrorMessage('خطا در اسکن QR Code');
                break;
            default:
                this.showErrorMessage('خطای نامشخص');
        }
    }
    
    static showErrorMessage(message) {
        // نمایش پیام خطا به کاربر
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}
```

### 3. بهینه‌سازی عملکرد

```javascript
class QRCodeOptimizer {
    static optimizeForMobile() {
        return {
            width: 250,
            height: 250,
            level: 'M',
            margin: 2
        };
    }
    
    static optimizeForDesktop() {
        return {
            width: 300,
            height: 300,
            level: 'H',
            margin: 4
        };
    }
    
    static detectDevice() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return isMobile ? this.optimizeForMobile() : this.optimizeForDesktop();
    }
}
```

## 📱 نمونه کامل

### HTML

```html
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp QR Code</title>
    <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
    <link rel="stylesheet" href="qr-code.css">
</head>
<body>
    <div class="container">
        <h1>📱 WhatsApp QR Code</h1>
        
        <div id="qr-container" class="qr-code-container">
            <!-- QR Code اینجا نمایش داده می‌شود -->
        </div>
        
        <div class="controls">
            <button id="generate-btn" class="btn btn-primary">تولید QR Code</button>
            <button id="hide-btn" class="btn btn-secondary">مخفی کردن</button>
            <button id="clear-btn" class="btn btn-danger">پاکسازی</button>
        </div>
        
        <div id="status" class="status"></div>
    </div>

    <script src="qr-code.js"></script>
</body>
</html>
```

### JavaScript

```javascript
// راه‌اندازی QR Code Manager
const qrManager = new QRCodeManager();
const qrDisplay = new QRCodeDisplay('qr-container');

// اضافه کردن listeners
qrManager.addListener((event, data) => {
    const status = document.getElementById('status');
    
    switch (event) {
        case 'qrCodeGenerating':
            status.textContent = 'در حال تولید QR Code...';
            status.className = 'status waiting';
            break;
        case 'qrCodeGenerated':
            status.textContent = 'QR Code تولید شد';
            status.className = 'status success';
            qrDisplay.displayQRCode(data);
            break;
        case 'qrCodeShown':
            status.textContent = 'QR Code نمایش داده شد';
            status.className = 'status success';
            break;
        case 'qrCodeHidden':
            status.textContent = 'QR Code مخفی شد';
            status.className = 'status info';
            qrDisplay.hide();
            break;
        case 'qrCodeCleared':
            status.textContent = 'QR Code پاک شد';
            status.className = 'status info';
            qrDisplay.clear();
            break;
    }
});

// مدیریت دکمه‌ها
document.getElementById('generate-btn').onclick = () => {
    qrManager.startGenerating();
    
    // شبیه‌سازی تولید QR Code
    setTimeout(() => {
        const qrData = 'sample-qr-data-' + Date.now();
        qrManager.setQRCode(qrData);
        qrManager.stopGenerating();
        qrManager.show();
    }, 1000);
};

document.getElementById('hide-btn').onclick = () => {
    qrManager.hide();
};

document.getElementById('clear-btn').onclick = () => {
    qrManager.clear();
};
```

## 🚀 راه‌اندازی سریع

### 1. نصب وابستگی‌ها

```bash
# برای React
npm install qrcode.react

# برای Vue
npm install vue-qr

# برای JavaScript خالص
# فقط CDN را اضافه کنید
```

### 2. استفاده

```javascript
// ایجاد QR Code
const qrDisplay = new QRCodeDisplay('container-id');
qrDisplay.displayQRCode('your-qr-data');

// مدیریت وضعیت
const qrManager = new QRCodeManager();
qrManager.addListener((event, data) => {
    console.log('QR Code event:', event, data);
});
```

---

**نکته**: این راهنما به‌روزرسانی می‌شود. لطفاً آخرین نسخه را بررسی کنید.
