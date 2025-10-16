# 🧪 راهنمای تست‌ها

راهنمای کامل اجرای تست‌ها و تست‌نویسی در سیستم

## 📋 انواع تست‌ها

### 1. Unit Tests (تست‌های واحد
- تست توابع و متدهای جداگانه
- تست منطق کسب‌وکار
- تست اعتبارسنجی‌ها

### 2. Integration Tests (تست‌های یکپارچگی)
- تست API endpoints
- تست ارتباط با پایگاه داده
- تست سرویس‌های خارجی

### 3. End-to-End Tests (تست‌های کامل)
- تست جریان کامل کاربر
- تست سناریوهای واقعی
- تست رابط کاربری

## 🛠️ ابزارهای تست

### Dependencies
```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.0.0",
    "nodemon": "^2.0.0"
  }
}
```

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

## 🧪 تست‌های واحد

### ساختار تست واحد
```javascript
// tests/unit/campaignService.test.js
const CampaignService = require('../../src/services/campaignService');

describe('CampaignService', () => {
  let campaignService;

  beforeEach(() => {
    campaignService = new CampaignService();
  });

  describe('validateCampaignData', () => {
    it('should validate correct campaign data', () => {
      const validData = {
        message: 'Test message',
        title: 'Test campaign'
      };

      expect(() => {
        campaignService.validateCampaignData(validData);
      }).not.toThrow();
    });

    it('should throw error for empty message', () => {
      const invalidData = {
        message: '',
        title: 'Test campaign'
      };

      expect(() => {
        campaignService.validateCampaignData(invalidData);
      }).toThrow('Message is required');
    });

    it('should throw error for missing title', () => {
      const invalidData = {
        message: 'Test message'
      };

      expect(() => {
        campaignService.validateCampaignData(invalidData);
      }).toThrow('Title is required');
    });
  });

  describe('calculateDeliveryRate', () => {
    it('should calculate delivery rate correctly', () => {
      const stats = {
        total: 100,
        sent: 80,
        failed: 20
      };

      const rate = campaignService.calculateDeliveryRate(stats);
      expect(rate).toBe(80);
    });

    it('should handle zero total messages', () => {
      const stats = {
        total: 0,
        sent: 0,
        failed: 0
      };

      const rate = campaignService.calculateDeliveryRate(stats);
      expect(rate).toBe(0);
    });
  });
});
```

### تست میدل‌ویرها
```javascript
// tests/unit/middleware/auth.test.js
const request = require('supertest');
const express = require('express');
const { authenticateSession } = require('../../src/middlewares/auth');

describe('Authentication Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.get('/protected', authenticateSession, (req, res) => {
      res.json({ user: req.user });
    });
  });

  it('should allow access with valid token', async () => {
    const token = 'valid-jwt-token';
    
    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.user).toBeDefined();
  });

  it('should deny access without token', async () => {
    const response = await request(app)
      .get('/protected')
      .expect(401);

    expect(response.body.message).toBe('Authentication required');
  });

  it('should deny access with invalid token', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(response.body.message).toBe('Invalid or expired token');
  });
});
```

## 🔗 تست‌های یکپارچگی

### تست API Endpoints
```javascript
// tests/integration/campaigns.test.js
const request = require('supertest');
const app = require('../../src/app');
const { prisma } = require('../../src/models');

describe('Campaign API', () => {
  let authToken;
  let testUser;
  let testCampaign;

  beforeAll(async () => {
    // ایجاد کاربر تست
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '09123456789',
        password: 'hashedPassword'
      }
    });

    // دریافت توکن احراز هویت
    const loginResponse = await request(app)
      .post('/api/user/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // پاکسازی داده‌های تست
    await prisma.campaign.deleteMany({
      where: { userId: testUser.id }
    });
    await prisma.user.delete({
      where: { id: testUser.id }
    });
  });

  describe('POST /api/campaigns', () => {
    it('should create a new campaign', async () => {
      const campaignData = {
        message: 'Test message',
        title: 'Test campaign'
      };

      const response = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .send(campaignData)
        .expect(201);

      expect(response.body.message).toBe('Campaign created successfully');
      expect(response.body.campaign.title).toBe('Test campaign');
      expect(response.body.campaign.status).toBe('DRAFT');
      
      testCampaign = response.body.campaign;
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/campaigns')
        .send({ message: 'Test' })
        .expect(401);

      expect(response.body.message).toBe('Authentication required');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test' })
        .expect(400);

      expect(response.body.message).toBe('Message is required');
    });
  });

  describe('GET /api/campaigns', () => {
    it('should return user campaigns', async () => {
      const response = await request(app)
        .get('/api/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.campaigns).toBeDefined();
      expect(Array.isArray(response.body.campaigns)).toBe(true);
    });

    it('should filter campaigns by status', async () => {
      const response = await request(app)
        .get('/api/campaigns?status=DRAFT')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.campaigns).toBeDefined();
    });
  });

  describe('PUT /api/campaigns/:id/interval', () => {
    it('should update campaign interval', async () => {
      const intervalData = {
        interval: '5s',
        sendType: 'immediate'
      };

      const response = await request(app)
        .put(`/api/campaigns/${testCampaign.id}/interval`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(intervalData)
        .expect(200);

      expect(response.body.message).toBe('Campaign settings updated successfully');
    });
  });
});
```

### تست پایگاه داده
```javascript
// tests/integration/database.test.js
const { prisma } = require('../../src/models');

describe('Database Operations', () => {
  afterEach(async () => {
    // پاکسازی داده‌های تست
    await prisma.campaign.deleteMany({
      where: { title: { contains: 'Test' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } }
    });
  });

  describe('User Operations', () => {
    it('should create user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '09123456789',
        password: 'hashedPassword'
      };

      const user = await prisma.user.create({
        data: userData
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
    });

    it('should find user by email', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '09123456789',
          password: 'hashedPassword'
        }
      });

      const foundUser = await prisma.user.findUnique({
        where: { email: 'test@example.com' }
      });

      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(user.id);
    });
  });

  describe('Campaign Operations', () => {
    it('should create campaign with user relation', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '09123456789',
          password: 'hashedPassword'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          userId: user.id,
          title: 'Test Campaign',
          message: 'Test message'
        }
      });

      expect(campaign.id).toBeDefined();
      expect(campaign.userId).toBe(user.id);
    });
  });
});
```

## 🔌 تست WebSocket

### تست WebSocket Events
```javascript
// tests/integration/websocket.test.js
const WebSocket = require('ws');
const { createServer } = require('http');
const app = require('../../src/app');

describe('WebSocket Events', () => {
  let server;
  let wss;
  let client;

  beforeAll((done) => {
    server = createServer(app);
    wss = new WebSocket.Server({ server, path: '/ws/campaigns' });
    server.listen(0, () => {
      const port = server.address().port;
      client = new WebSocket(`ws://localhost:${port}/ws/campaigns?campaignId=1&userId=1`);
      client.on('open', done);
    });
  });

  afterAll(() => {
    client.close();
    wss.close();
    server.close();
  });

  it('should send campaign update', (done) => {
    client.on('message', (data) => {
      const message = JSON.parse(data);
      
      if (message.type === 'campaign_update') {
        expect(message.campaignId).toBe(1);
        expect(message.data).toBeDefined();
        done();
      }
    });

    // شبیه‌سازی به‌روزرسانی کمپین
    setTimeout(() => {
      wss.clients.forEach((ws) => {
        ws.send(JSON.stringify({
          type: 'campaign_update',
          campaignId: 1,
          data: { status: 'RUNNING' }
        }));
      });
    }, 100);
  });

  it('should send progress update', (done) => {
    client.on('message', (data) => {
      const message = JSON.parse(data);
      
      if (message.type === 'progress_update') {
        expect(message.campaignId).toBe(1);
        expect(message.data.progress).toBeDefined();
        done();
      }
    });

    // شبیه‌سازی به‌روزرسانی پیشرفت
    setTimeout(() => {
      wss.clients.forEach((ws) => {
        ws.send(JSON.stringify({
          type: 'progress_update',
          campaignId: 1,
          data: { progress: { sent: 10, total: 100 } }
        }));
      });
    }, 100);
  });
});
```

## 📱 تست WhatsApp Integration

### تست WhatsApp Service
```javascript
// tests/integration/whatsapp.test.js
const WhatsAppService = require('../../src/services/whatsappService');

describe('WhatsApp Service', () => {
  let whatsappService;

  beforeEach(() => {
    whatsappService = new WhatsAppService();
  });

  describe('normalizeNumber', () => {
    it('should normalize phone numbers correctly', () => {
      expect(whatsappService.normalizeNumber('09123456789')).toBe('989123456789');
      expect(whatsappService.normalizeNumber('989123456789')).toBe('989123456789');
      expect(whatsappService.normalizeNumber('+989123456789')).toBe('989123456789');
    });
  });

  describe('getIntervalMs', () => {
    it('should convert intervals to milliseconds', () => {
      expect(whatsappService.getIntervalMs('5s')).toBe(5000);
      expect(whatsappService.getIntervalMs('10s')).toBe(10000);
      expect(whatsappService.getIntervalMs('20s')).toBe(20000);
    });
  });

  describe('hasActiveSession', () => {
    it('should return false for non-existent session', () => {
      expect(whatsappService.hasActiveSession('non-existent')).toBe(false);
    });
  });
});
```

## 🚀 اجرای تست‌ها

### اسکریپت‌های تست
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:campaign": "jest tests/integration/campaigns.test.js",
    "test:whatsapp": "jest tests/integration/whatsapp.test.js",
    "test:all": "jest tests"
  }
}
```

### اجرای تست‌های خاص
```bash
# اجرای تمام تست‌ها
npm test

# اجرای تست‌های واحد
npm run test:unit

# اجرای تست‌های یکپارچگی
npm run test:integration

# اجرای تست‌های کمپین
npm run test:campaign

# اجرای تست‌های WhatsApp
npm run test:whatsapp

# اجرای با coverage
npm run test:coverage

# اجرای در حالت watch
npm run test:watch
```

## 📊 Coverage Report

### تنظیمات Coverage
```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### مشاهده Coverage
```bash
# اجرای تست‌ها با coverage
npm run test:coverage

# مشاهده گزارش HTML
open coverage/lcov-report/index.html
```

## 🔧 تنظیمات تست

### Setup File
```javascript
// tests/setup.js
const { prisma } = require('../src/models');

// پاکسازی پایگاه داده قبل از تست‌ها
beforeAll(async () => {
  await prisma.campaign.deleteMany();
  await prisma.user.deleteMany();
});

// پاکسازی بعد از هر تست
afterEach(async () => {
  await prisma.campaign.deleteMany();
  await prisma.user.deleteMany();
});
```

### Test Utilities
```javascript
// tests/utils/testHelpers.js
const { prisma } = require('../../src/models');

const createTestUser = async (userData = {}) => {
  const defaultData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '09123456789',
    password: 'hashedPassword'
  };

  return await prisma.user.create({
    data: { ...defaultData, ...userData }
  });
};

const createTestCampaign = async (userId, campaignData = {}) => {
  const defaultData = {
    title: 'Test Campaign',
    message: 'Test message'
  };

  return await prisma.campaign.create({
    data: {
      userId,
      ...defaultData,
      ...campaignData
    }
  });
};

module.exports = {
  createTestUser,
  createTestCampaign
};
```

## 🚨 تست‌های خطا

### تست Error Handling
```javascript
describe('Error Handling', () => {
  it('should handle database connection errors', async () => {
    // شبیه‌سازی خطای اتصال به پایگاه داده
    jest.spyOn(prisma.user, 'create').mockRejectedValue(new Error('Connection failed'));

    const response = await request(app)
      .post('/api/user/register-simple')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        phone: '09123456789',
        password: 'password123'
      })
      .expect(500);

    expect(response.body.message).toBe('Server error');
  });

  it('should handle validation errors', async () => {
    const response = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${authToken}`)
      .send({})
      .expect(400);

    expect(response.body.message).toBe('Message is required');
  });
});
```

## 📈 Performance Tests

### تست عملکرد
```javascript
describe('Performance Tests', () => {
  it('should handle large number of recipients', async () => {
    const startTime = Date.now();
    
    // ایجاد کمپین با تعداد زیادی مخاطب
    const campaign = await createTestCampaign(testUser.id);
    
    // آپلود 1000 مخاطب
    const recipients = Array.from({ length: 1000 }, (_, i) => ({
      phone: `0912345${i.toString().padStart(4, '0')}`,
      name: `User ${i}`
    }));

    const response = await request(app)
      .post(`/api/campaigns/${campaign.id}/recipients`)
      .set('Authorization', `Bearer ${authToken}`)
      .attach('recipientsFile', Buffer.from(createExcelBuffer(recipients)), 'recipients.xlsx')
      .expect(200);

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(5000); // کمتر از 5 ثانیه
    expect(response.body.recipientsCount).toBe(1000);
  });
});
```

---

**نکته**: این راهنما به‌روزرسانی می‌شود. لطفاً آخرین نسخه را بررسی کنید.
