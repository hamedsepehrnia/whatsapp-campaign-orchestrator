
/**
 * QR Code Helper Functions
 * Utility functions for handling WhatsApp QR codes
 */

/**
 * Convert raw QR code to WhatsApp Web URL format
 * @param {string} qrCode - Raw QR code from whatsapp-web.js
 * @returns {string} - WhatsApp Web URL
 */
function convertQRToWhatsAppURL(qrCode) {
    // If QR code already contains WhatsApp URL, return as is
    if (qrCode.includes('wa.me') || qrCode.includes('whatsapp.com')) {
        return qrCode;
    }
    
    // Convert raw QR code to WhatsApp Web URL
    return `https://wa.me/settings/linked_devices#${qrCode}`;
}

/**
 * Generate QR Code image from WhatsApp URL
 * @param {string} whatsappURL - WhatsApp Web URL
 * @param {string} containerId - DOM element ID to display QR code
 * @returns {Promise<void>}
 */
async function generateQRCodeImage(whatsappURL, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('QR Code container not found');
        return;
    }

    // Clear previous content
    container.innerHTML = '';

    // Check if QRCode library is available
    if (typeof QRCode !== 'undefined') {
        // Generate QR code using QRCode library
        new QRCode(container, {
            text: whatsappURL,
            width: 300,
            height: 300,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    } else {
        // Fallback: display URL as text
        container.innerHTML = `
            <div class="qr-code-fallback">
                <h3>📱 WhatsApp QR Code</h3>
                <div class="qr-url">
                    <p><strong>URL:</strong></p>
                    <code>${whatsappURL}</code>
                </div>
                <p class="qr-instruction">این URL را در مرورگر باز کنید یا QR Code را اسکن کنید</p>
            </div>
        `;
    }
}

/**
 * Display QR Code with proper formatting
 * @param {string} qrData - QR code data (raw or URL)
 * @param {string} containerId - DOM element ID
 * @returns {Promise<void>}
 */
async function displayQRCode(qrData, containerId) {
    // Convert to WhatsApp URL if needed
    const whatsappURL = convertQRToWhatsAppURL(qrData);
    
    // Generate QR code image
    await generateQRCodeImage(whatsappURL, containerId);
    
    // Show instructions
    showQRInstructions(containerId);
}

/**
 * Show QR code instructions
 * @param {string} containerId - DOM element ID
 */
function showQRInstructions(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Add instructions if not already present
    if (!container.querySelector('.qr-instructions')) {
        const instructions = document.createElement('div');
        instructions.className = 'qr-instructions';
        instructions.innerHTML = `
            <h4>📱 نحوه اتصال:</h4>
            <ol>
                <li>WhatsApp را در گوشی خود باز کنید</li>
                <li>به Settings > Linked Devices بروید</li>
                <li>Link a Device را انتخاب کنید</li>
                <li>QR Code بالا را اسکن کنید</li>
            </ol>
            <p><strong>نکته:</strong> QR Code فقط 5 دقیقه معتبر است</p>
        `;
        container.appendChild(instructions);
    }
}

/**
 * Validate QR code format
 * @param {string} qrCode - QR code to validate
 * @returns {boolean} - True if valid
 */
function isValidQRCode(qrCode) {
    if (!qrCode || typeof qrCode !== 'string') {
        return false;
    }
    
    // Check if it's a WhatsApp URL
    if (qrCode.includes('wa.me') || qrCode.includes('whatsapp.com')) {
        return true;
    }
    
    // Check if it's a raw QR code (contains base64-like characters)
    const base64Pattern = /^[A-Za-z0-9+/=,]+$/;
    return base64Pattern.test(qrCode);
}

/**
 * Get QR code type
 * @param {string} qrCode - QR code to analyze
 * @returns {string} - 'url', 'raw', or 'invalid'
 */
function getQRCodeType(qrCode) {
    if (!qrCode || typeof qrCode !== 'string') {
        return 'invalid';
    }
    
    if (qrCode.includes('wa.me') || qrCode.includes('whatsapp.com')) {
        return 'url';
    }
    
    if (isValidQRCode(qrCode)) {
        return 'raw';
    }
    
    return 'invalid';
}

module.exports = {
    convertQRToWhatsAppURL,
    generateQRCodeImage,
    displayQRCode,
    showQRInstructions,
    isValidQRCode,
    getQRCodeType
};
