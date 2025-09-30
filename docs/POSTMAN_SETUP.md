# 📮 Postman Setup Guide

## 🚀 Quick Start

### 1. Import Collection
1. Open Postman
2. Click **Import** button
3. Select `WhatsApp-Campaign-API.postman_collection.json`
4. Click **Import**

### 2. Import Environment
1. Click **Import** button
2. Select `WhatsApp-Campaign-Environment.postman_environment.json`
3. Click **Import**
4. Select the environment from dropdown (top-right)

### 3. Start Server
```bash
npm start
```

## 📋 Collection Structure

### 🔐 Authentication
- **Request OTP** - Send OTP via SMS/Email
- **Verify OTP** - Verify OTP code
- **Register User** - Create new user account
- **Login** - Login and get tokens

### 📱 Campaign Management
- **Get Subscription Info** - Check message limits
- **Create Campaign** - Create new WhatsApp campaign
- **Upload Recipients** - Upload Excel file with phone numbers
- **Upload Attachment** - Upload image/PDF attachment
- **Generate QR Code** - Generate WhatsApp QR code
- **Check WhatsApp Connection** - Check connection status
- **Start Campaign** - Begin sending messages
- **Pause Campaign** - Pause running campaign
- **Resume Campaign** - Resume paused campaign
- **Get Campaign Progress** - Check real-time progress
- **Get My Campaigns** - List user campaigns
- **Generate Campaign Report** - Download campaign report
- **Delete Campaign** - Delete campaign

### 🔌 WebSocket Testing
- **WebSocket Connection Test** - Test real-time updates

### 🔄 Refresh Token
- **Refresh Access Token** - Get new access token
- **Logout (Single Device)** - Logout current device
- **Logout All Devices** - Logout all devices

## 🧪 Testing Workflow

### Step 1: Authentication
1. **Request OTP** - Send OTP to your phone
2. **Verify OTP** - Enter the OTP code
3. **Register User** - Create account (if new user)
4. **Login** - Login and get tokens

### Step 2: Create Campaign
1. **Get Subscription Info** - Check your limits
2. **Create Campaign** - Create new campaign
3. **Upload Recipients** - Upload Excel file
4. **Upload Attachment** - Upload file (optional)

### Step 3: WhatsApp Connection
1. **Generate QR Code** - Get QR code for WhatsApp
2. **Check WhatsApp Connection** - Verify connection
3. **Start Campaign** - Begin sending messages

### Step 4: Monitor Progress
1. **Get Campaign Progress** - Check real-time progress
2. **Pause/Resume Campaign** - Control campaign
3. **Generate Campaign Report** - Get final report

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `base_url` | API base URL | `http://localhost:3000` |
| `access_token` | JWT access token | Auto-set after login |
| `refresh_token` | Refresh token | Auto-set after login |
| `campaign_id` | Current campaign ID | Auto-set after campaign creation |
| `package_id` | Package ID | Set manually |
| `user_id` | User ID | Auto-set |
| `verification_token` | OTP verification token | Auto-set after OTP verification |
| `otp_code` | OTP code | `123456` |
| `phone_number` | Phone number | `09120000000` |
| `email` | Email address | `ali@example.com` |
| `password` | Password | `Passw0rd123!` |
| `campaign_message` | Campaign message | `سلام! پیشنهاد ویژه...` |
| `websocket_url` | WebSocket URL | `ws://localhost:3000/ws/campaigns` |

## 📱 WhatsApp Integration

### QR Code Flow
1. **Generate QR Code** - Creates WhatsApp session
2. **QR Code sent via WebSocket** - Real-time QR code
3. **Scan QR Code** - Use WhatsApp mobile app
4. **Check Connection** - Verify WhatsApp is connected
5. **Start Campaign** - Begin sending messages

### WebSocket Messages
Connect to: `ws://localhost:3000/ws/campaigns?campaignId=:campaignId&userId=:userId`

#### Message Types:
- **`qr_code`** - QR code for WhatsApp connection
- **`status_update`** - Campaign status changes
- **`progress_update`** - Real-time progress updates
- **`error_update`** - Error notifications
- **`completion_update`** - Campaign completion

## 🧪 Test Files

### Excel File for Recipients
Create `sample-recipients.xlsx` with columns:
- `phone` - Phone number (e.g., 09123456789)
- `name` - Recipient name (e.g., علی احمدی)

### Sample Image
Create `sample-image.jpg` for testing attachments.

## 🔍 Troubleshooting

### Common Issues

#### 1. Authentication Errors
- Check if server is running
- Verify environment variables
- Ensure OTP is verified before registration

#### 2. Campaign Creation Errors
- Check subscription limits
- Verify campaign data format
- Ensure user is logged in

#### 3. WhatsApp Connection Errors
- Check if Chrome/Chromium is installed
- Verify WebSocket connection
- Check server logs for errors

#### 4. File Upload Errors
- Check file format (Excel for recipients)
- Verify file size limits
- Ensure proper Content-Type headers

### Debug Steps
1. **Check Server Logs** - Look for error messages
2. **Verify Environment** - Ensure all variables are set
3. **Test Authentication** - Login flow should work
4. **Check WebSocket** - Real-time updates should work
5. **Verify WhatsApp** - QR code should appear

## 📊 Expected Responses

### Successful Login
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_string",
  "user": {
    "id": "user_id",
    "name": "علی احمدی",
    "email": "ali@example.com"
  }
}
```

### Successful Campaign Creation
```json
{
  "message": "Campaign created successfully",
  "campaign": {
    "id": "campaign_id",
    "status": "draft",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### WebSocket QR Code
```json
{
  "type": "qr_code",
  "campaignId": "campaign_id",
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgo...",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## 🎯 Best Practices

### 1. Test Sequence
- Always start with authentication
- Create campaign before testing WhatsApp
- Use WebSocket for real-time updates
- Test with small recipient lists first

### 2. Environment Management
- Use separate environments for dev/prod
- Keep sensitive data in environment variables
- Clear tokens when switching users

### 3. Error Handling
- Check response codes
- Read error messages carefully
- Use Postman console for debugging

### 4. Performance Testing
- Test with different recipient counts
- Monitor WebSocket connections
- Check server resource usage

---

**🎉 Happy Testing!**

For issues or questions, check the server logs and ensure all environment variables are properly configured.
