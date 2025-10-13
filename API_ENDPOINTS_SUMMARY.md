# 📋 Complete API Endpoints Summary

## 🔐 Authentication & OTP
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/request-otp` | Request OTP for registration | ❌ |
| POST | `/api/auth/verify-otp` | Verify OTP code | ❌ |

## 👤 User Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/user/register` | Register new user (with OTP) | ❌ |
| POST | `/api/user/register-simple` | Register new user (simple - no OTP) | ❌ |
| POST | `/api/user/login` | Login user (session-based) | ❌ |
| GET | `/api/user/profile` | Get user profile | ✅ |
| POST | `/api/user/profile` | Update user profile | ✅ |
| POST | `/api/user/logout` | Logout user | ✅ |

## 📦 Package Management
| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/api/packages` | Get all packages | ❌ | ❌ |
| GET | `/api/packages/:id` | Get package by ID | ❌ | ❌ |
| POST | `/api/packages` | Create new package | ✅ | ✅ |
| PUT | `/api/packages/:id` | Update package | ✅ | ✅ |
| DELETE | `/api/packages/:id` | Delete package | ✅ | ✅ |

## 🛒 Order Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/orders` | Create new order | ✅ |
| GET | `/api/orders/me` | Get user's orders | ✅ |

## 💳 Payment Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payments/start` | Start payment process | ✅ |
| POST | `/api/payments/confirm` | Confirm payment | ✅ |
| GET | `/api/payments/callback` | Payment callback (Zarinpal) | ❌ |

## 📱 Campaign Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/campaigns` | Create new campaign | ✅ |
| GET | `/api/campaigns` | Get user's campaigns | ✅ |
| GET | `/api/campaigns/search` | Search campaigns | ✅ |
| GET | `/api/campaigns/:id` | Get campaign details | ✅ |
| GET | `/api/campaigns/:id?include=progress` | Get campaign with progress | ✅ |
| GET | `/api/campaigns/:id?include=report` | Get campaign with report | ✅ |
| GET | `/api/campaigns/:id?include=progress,report` | Get campaign with multiple includes | ✅ |
| DELETE | `/api/campaigns/:id` | Delete campaign | ✅ |
| PUT | `/api/campaigns/:id/interval` | Set campaign interval | ✅ |

## 📊 Campaign Reports
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/campaigns/:id/report/download` | Download campaign report (Excel) | ✅ |

## 📤 File Uploads
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/campaigns/:id/recipients` | Upload recipients Excel file | ✅ |
| POST | `/api/campaigns/:id/attachment` | Upload campaign attachment | ✅ |
| DELETE | `/api/campaigns/:id/attachment` | Delete campaign attachment | ✅ |
| GET | `/api/campaigns/:id/attachment` | Get attachment details | ✅ |
| GET | `/api/campaigns/excel-template/download` | Download Excel template | ❌ |

## 🎛️ Campaign Control
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/campaigns/:id/start` | Start campaign | ✅ |
| POST | `/api/campaigns/:id/pause` | Pause campaign | ✅ |
| POST | `/api/campaigns/:id/resume` | Resume campaign | ✅ |

## 🔗 WhatsApp Integration
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/campaigns/:id/qr-code` | Generate QR code | ✅ |
| GET | `/api/campaigns/:id/connection` | Check WhatsApp connection | ✅ |
| POST | `/api/campaigns/:id/cleanup-session` | Cleanup WhatsApp session | ✅ |

## 📅 Scheduled Campaigns
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/campaigns/scheduled` | Get scheduled campaigns | ✅ |
| POST | `/api/campaigns/:id/cancel-schedule` | Cancel scheduled campaign | ✅ |

## 🧙 Campaign Wizard
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/campaigns/:id/preview` | Get campaign preview | ✅ |
| POST | `/api/campaigns/:id/confirm-and-start` | Confirm and start campaign | ✅ |
| GET | `/api/campaigns/:id/steps` | Get campaign step status | ✅ |
| POST | `/api/campaigns/:id/navigate` | Navigate to step | ✅ |
| POST | `/api/campaigns/:id/go-back` | Go back step | ✅ |
| POST | `/api/campaigns/:id/reset` | Reset to step | ✅ |

## 👑 Admin Management
| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/api/admin/users` | List all users | ✅ | ✅ |
| PUT | `/api/admin/users/:id/role` | Update user role | ✅ | ✅ |
| PUT | `/api/admin/users/:id/status` | Update user status | ✅ | ✅ |
| GET | `/api/admin/transactions` | List all transactions | ✅ | ✅ |
| GET | `/api/admin/dashboard` | Get dashboard statistics | ✅ | ✅ |

## 🔄 Token Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/refresh/refresh` | Refresh access token | ❌ |
| POST | `/api/refresh/logout` | Logout (revoke token) | ❌ |
| POST | `/api/refresh/logout-all` | Logout from all devices | ✅ |

## 📊 WebSocket
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| WS | `/ws/campaigns` | Real-time campaign updates | ✅ |

## 🔧 Key Changes for Prisma Migration

### Response Format Changes
- **ID Format**: `_id` → `id` (ObjectId → Integer)
- **Enum Values**: Lowercase → UPPERCASE (e.g., `active` → `ACTIVE`)
- **Status Values**: Updated to match Prisma schema

### Authentication
- **Primary**: Session-based authentication (cookies)
- **Fallback**: JWT token in Authorization header
- **Session Management**: Automatic token storage in cookies

### Database Schema
- **Relations**: Proper foreign key relationships
- **Data Types**: MySQL-specific data types
- **Indexes**: Optimized for performance

### File Downloads
- **Excel Reports**: 3-sheet format with Persian dates
- **Templates**: Excel template for recipients
- **Attachments**: File upload with validation

## 🚀 Usage Examples

### Frontend Integration
```javascript
// Session-based authentication
const response = await fetch('/api/campaigns', {
  method: 'GET',
  credentials: 'include' // Important for session cookies
});

// Download Excel report
const downloadReport = async (campaignId) => {
  const response = await fetch(`/api/campaigns/${campaignId}/report/download`, {
    credentials: 'include'
  });
  const blob = await response.blob();
  // Handle file download
};
```

### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:3000/ws/campaigns');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle real-time updates
};
```

---

**Total Endpoints**: 45+ (Optimized)  
**Authentication Methods**: Session-based + JWT  
**File Formats**: JSON, Excel, WebSocket  
**Database**: MySQL with Prisma ORM  
**Optimization**: Reduced redundant endpoints with query parameters
