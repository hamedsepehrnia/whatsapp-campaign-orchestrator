@echo off
echo 🚀 شروع تست WhatsApp QR Code
echo.

echo 📋 بررسی پیش‌نیازها...
node --version
npm --version

echo.
echo 🔧 نصب وابستگی‌ها...
npm install axios ws

echo.
echo 🚀 اجرای تست...
node scripts/test-whatsapp-qr.js

echo.
echo ✅ تست کامل شد
pause
