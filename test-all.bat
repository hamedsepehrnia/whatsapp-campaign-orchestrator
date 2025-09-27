@echo off
echo Testing All WhatsApp APIs...
echo.

echo Starting server...
start /B npm start

echo Waiting for server to start...
timeout /t 5 /nobreak > nul

echo Running API tests...
node test-complete-apis.js

echo.
echo Test completed!
pause
