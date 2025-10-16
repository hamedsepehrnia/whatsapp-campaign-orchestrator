@echo off
echo Testing Simple Registration with cURL
echo =====================================

echo.
echo 1. Simple Registration:
echo ------------------------
curl -X POST http://localhost:3000/api/user/register-simple ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"علی احمدی\",\"username\":\"ali_ahmadi\",\"email\":\"ali@example.com\",\"phone\":\"09120000000\",\"password\":\"Passw0rd123!\"}"

echo.
echo.
echo 2. Login:
echo ---------
curl -X POST http://localhost:3000/api/user/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"ali@example.com\",\"password\":\"Passw0rd123!\"}"

echo.
echo.
echo 3. Get Profile (replace YOUR_TOKEN with actual token):
echo --------------------------------------------------------
echo curl -X GET http://localhost:3000/api/user/profile ^
echo   -H "Authorization: Bearer YOUR_TOKEN" ^
echo   -H "Content-Type: application/json"

pause
