# Test All WhatsApp APIs
$baseUrl = "http://localhost:3000"

Write-Host "Testing WhatsApp APIs..." -ForegroundColor Green

# Test 1: Request OTP
Write-Host "`n1. Testing Request OTP..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/request-otp" -Method POST -ContentType "application/json" -Body '{"channel":"sms","target":"09120000000"}'
    Write-Host "✅ Request OTP: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Request OTP: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Verify OTP
Write-Host "`n2. Testing Verify OTP..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/verify-otp" -Method POST -ContentType "application/json" -Body '{"channel":"sms","target":"09120000000","code":"123456"}'
    Write-Host "✅ Verify OTP: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Verify OTP: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Register User
Write-Host "`n3. Testing Register User..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/user/register" -Method POST -ContentType "application/json" -Body '{"name":"علی احمدی","email":"ali@example.com","phone":"09120000000","password":"Passw0rd123!","verificationToken":"test-token"}'
    Write-Host "✅ Register User: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Register User: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Login
Write-Host "`n4. Testing Login..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/user/login" -Method POST -ContentType "application/json" -Body '{"email":"ali@example.com","password":"Passw0rd123!"}'
    Write-Host "✅ Login: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Login: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Get Subscription Info
Write-Host "`n5. Testing Get Subscription Info..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/campaigns/subscription" -Method GET -Headers @{"Authorization"="Bearer test-token"}
    Write-Host "✅ Get Subscription Info: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Subscription Info: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Create Campaign
Write-Host "`n6. Testing Create Campaign..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/campaigns" -Method POST -ContentType "application/json" -Headers @{"Authorization"="Bearer test-token"} -Body '{"title":"کمپین تست","message":"سلام! پیام تست","interval":"10s"}'
    Write-Host "✅ Create Campaign: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Create Campaign: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Generate QR Code
Write-Host "`n7. Testing Generate QR Code..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/campaigns/test-campaign-id/qr-code" -Method POST -Headers @{"Authorization"="Bearer test-token"}
    Write-Host "✅ Generate QR Code: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Generate QR Code: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: Check Connection
Write-Host "`n8. Testing Check Connection..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/campaigns/test-campaign-id/connection" -Method GET -Headers @{"Authorization"="Bearer test-token"}
    Write-Host "✅ Check Connection: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Check Connection: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 9: Start Campaign
Write-Host "`n9. Testing Start Campaign..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/campaigns/test-campaign-id/start" -Method POST -Headers @{"Authorization"="Bearer test-token"}
    Write-Host "✅ Start Campaign: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Start Campaign: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 10: Get Progress
Write-Host "`n10. Testing Get Progress..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/campaigns/test-campaign-id/progress" -Method GET -Headers @{"Authorization"="Bearer test-token"}
    Write-Host "✅ Get Progress: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Progress: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 11: Pause Campaign
Write-Host "`n11. Testing Pause Campaign..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/campaigns/test-campaign-id/pause" -Method POST -Headers @{"Authorization"="Bearer test-token"}
    Write-Host "✅ Pause Campaign: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Pause Campaign: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 12: Resume Campaign
Write-Host "`n12. Testing Resume Campaign..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/campaigns/test-campaign-id/resume" -Method POST -Headers @{"Authorization"="Bearer test-token"}
    Write-Host "✅ Resume Campaign: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Resume Campaign: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 13: Get My Campaigns
Write-Host "`n13. Testing Get My Campaigns..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/campaigns?status=running&page=1&limit=10" -Method GET -Headers @{"Authorization"="Bearer test-token"}
    Write-Host "✅ Get My Campaigns: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Get My Campaigns: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 14: Generate Report
Write-Host "`n14. Testing Generate Report..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/campaigns/test-campaign-id/report" -Method GET -Headers @{"Authorization"="Bearer test-token"}
    Write-Host "✅ Generate Report: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Generate Report: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 15: Delete Campaign
Write-Host "`n15. Testing Delete Campaign..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/campaigns/test-campaign-id" -Method DELETE -Headers @{"Authorization"="Bearer test-token"}
    Write-Host "✅ Delete Campaign: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Delete Campaign: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 16: Refresh Token
Write-Host "`n16. Testing Refresh Token..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/refresh/refresh" -Method POST -ContentType "application/json" -Body '{"refreshToken":"test-refresh-token"}'
    Write-Host "✅ Refresh Token: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Refresh Token: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 17: Logout
Write-Host "`n17. Testing Logout..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/refresh/logout" -Method POST -Headers @{"Authorization"="Bearer test-token"}
    Write-Host "✅ Logout: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Logout: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 18: Logout All
Write-Host "`n18. Testing Logout All..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/refresh/logout-all" -Method POST -Headers @{"Authorization"="Bearer test-token"}
    Write-Host "✅ Logout All: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Logout All: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nAll API tests completed!" -ForegroundColor Green
