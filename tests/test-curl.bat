@echo off
echo Testing WhatsApp APIs with curl...

echo.
echo 1. Testing Request OTP...
curl -X POST http://localhost:3000/api/auth/request-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"channel\":\"sms\",\"target\":\"09120000000\"}"

echo.
echo 2. Testing Verify OTP...
curl -X POST http://localhost:3000/api/auth/verify-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"channel\":\"sms\",\"target\":\"09120000000\",\"code\":\"123456\"}"

echo.
echo 3. Testing Register User...
curl -X POST http://localhost:3000/api/user/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"علی احمدی\",\"email\":\"ali@example.com\",\"phone\":\"09120000000\",\"password\":\"Passw0rd123!\",\"verificationToken\":\"test-token\"}"

echo.
echo 4. Testing Login...
curl -X POST http://localhost:3000/api/user/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"ali@example.com\",\"password\":\"Passw0rd123!\"}"

echo.
echo 5. Testing Get Subscription Info...
curl -X GET http://localhost:3000/api/campaigns/subscription ^
  -H "Authorization: Bearer test-token"

echo.
echo 6. Testing Create Campaign...
curl -X POST http://localhost:3000/api/campaigns ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer test-token" ^
  -d "{\"title\":\"کمپین تست\",\"message\":\"سلام! پیام تست\",\"interval\":\"10s\"}"

echo.
echo 7. Testing Generate QR Code...
curl -X POST http://localhost:3000/api/campaigns/test-campaign-id/qr-code ^
  -H "Authorization: Bearer test-token"

echo.
echo 8. Testing Check Connection...
curl -X GET http://localhost:3000/api/campaigns/test-campaign-id/connection ^
  -H "Authorization: Bearer test-token"

echo.
echo 9. Testing Start Campaign...
curl -X POST http://localhost:3000/api/campaigns/test-campaign-id/start ^
  -H "Authorization: Bearer test-token"

echo.
echo 10. Testing Get Progress...
curl -X GET http://localhost:3000/api/campaigns/test-campaign-id/progress ^
  -H "Authorization: Bearer test-token"

echo.
echo 11. Testing Pause Campaign...
curl -X POST http://localhost:3000/api/campaigns/test-campaign-id/pause ^
  -H "Authorization: Bearer test-token"

echo.
echo 12. Testing Resume Campaign...
curl -X POST http://localhost:3000/api/campaigns/test-campaign-id/resume ^
  -H "Authorization: Bearer test-token"

echo.
echo 13. Testing Get My Campaigns...
curl -X GET "http://localhost:3000/api/campaigns?status=running&page=1&limit=10" ^
  -H "Authorization: Bearer test-token"

echo.
echo 14. Testing Generate Report...
curl -X GET http://localhost:3000/api/campaigns/test-campaign-id/report ^
  -H "Authorization: Bearer test-token"

echo.
echo 15. Testing Delete Campaign...
curl -X DELETE http://localhost:3000/api/campaigns/test-campaign-id ^
  -H "Authorization: Bearer test-token"

echo.
echo 16. Testing Refresh Token...
curl -X POST http://localhost:3000/api/refresh/refresh ^
  -H "Content-Type: application/json" ^
  -d "{\"refreshToken\":\"test-refresh-token\"}"

echo.
echo 17. Testing Logout...
curl -X POST http://localhost:3000/api/refresh/logout ^
  -H "Authorization: Bearer test-token"

echo.
echo 18. Testing Logout All...
curl -X POST http://localhost:3000/api/refresh/logout-all ^
  -H "Authorization: Bearer test-token"

echo.
echo All API tests completed!
pause
