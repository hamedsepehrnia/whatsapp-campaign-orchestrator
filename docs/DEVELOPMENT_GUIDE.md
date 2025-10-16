# 🛠️ راهنمای توسعه

راهنمای کامل توسعه و کدنویسی در سیستم

## 🏗️ ساختار پروژه

### سازماندهی فایل‌ها
```
src/
├── app.js                 # تنظیمات اصلی Express
├── config/               # تنظیمات سیستم
├── controllers/         # کنترلرهای API
├── middlewares/        # میدل‌ویرها
├── models/             # مدل‌های Prisma
├── routes/             # مسیرهای API
├── services/           # سرویس‌های کسب‌وکار
├── utils/              # ابزارهای کمکی
└── validators/         # اعتبارسنجی ورودی‌ها
```

### اصول کدنویسی
- **Modularity**: ساختار ماژولار
- **Separation of Concerns**: جداسازی نگرانی‌ها
- **DRY Principle**: عدم تکرار کد
- **SOLID Principles**: اصول SOLID

## 📝 استانداردهای کدنویسی

### نام‌گذاری
```javascript
// متغیرها و توابع: camelCase
const userName = 'ali_ahmadi';
const getUserProfile = () => {};

// کلاس‌ها: PascalCase
class UserController {}

// ثابت‌ها: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;

// فایل‌ها: kebab-case
user-controller.js
campaign-service.js
```

### کامنت‌گذاری
```javascript
/**
 * ایجاد کمپین جدید
 * @param {Object} req - درخواست HTTP
 * @param {Object} res - پاسخ HTTP
 * @returns {Promise<void>}
 */
exports.createCampaign = async (req, res) => {
  try {
    // بررسی اعتبارسنجی ورودی
    const { message, title } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        message: "Message is required" 
      });
    }

    // ایجاد کمپین در پایگاه داده
    const campaign = await Campaign.create({
      userId: req.user.id,
      message,
      title: title?.trim()
    });

    res.status(201).json({
      message: "Campaign created successfully",
      campaign: {
        id: campaign.id,
        title: campaign.title,
        status: campaign.status
      }
    });

  } catch (err) {
    console.error('Campaign creation error:', err);
    res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
};
```

## 🔧 ساختار کنترلرها

### الگوی کنترلر
```javascript
const { Model } = require('../models');
const { validate } = require('../middlewares/validate');
const { schema } = require('../validators/schemas');

class Controller {
  // لیست آیتم‌ها
  async list(req, res) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      
      const items = await Model.findAll(filters, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: items.length
        }
      });
    } catch (err) {
      console.error('List error:', err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // دریافت آیتم خاص
  async getById(req, res) {
    try {
      const { id } = req.params;
      const item = await Model.findById(id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      res.json({ item });
    } catch (err) {
      console.error('Get by ID error:', err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // ایجاد آیتم جدید
  async create(req, res) {
    try {
      const item = await Model.create(req.body);
      
      res.status(201).json({
        message: "Item created successfully",
        item
      });
    } catch (err) {
      console.error('Create error:', err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // به‌روزرسانی آیتم
  async update(req, res) {
    try {
      const { id } = req.params;
      const item = await Model.update(id, req.body);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      res.json({
        message: "Item updated successfully",
        item
      });
    } catch (err) {
      console.error('Update error:', err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // حذف آیتم
  async delete(req, res) {
    try {
      const { id } = req.params;
      const item = await Model.delete(id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      res.json({ message: "Item deleted successfully" });
    } catch (err) {
      console.error('Delete error:', err);
      res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = new Controller();
```

## 🛡️ ساختار میدل‌ویرها

### میدل‌ویر احراز هویت
```javascript
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.authenticateSession = async (req, res, next) => {
  try {
    // بررسی session
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user) {
        req.user = user;
        return next();
      }
    }

    // بررسی JWT token
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ 
        message: "Authentication required" 
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401).json({ message: "Invalid token" });
  }
};

// استخراج توکن از درخواست
const extractToken = (req) => {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  
  if (req.session && req.session.token) {
    return req.session.token;
  }
  
  return null;
};
```

### میدل‌ویر اعتبارسنجی
```javascript
const { z } = require('zod');

exports.validate = (schema) => {
  return (req, res, next) => {
    try {
      // اعتبارسنجی body
      if (schema.body) {
        schema.body.parse(req.body);
      }
      
      // اعتبارسنجی query
      if (schema.query) {
        schema.query.parse(req.query);
      }
      
      // اعتبارسنجی params
      if (schema.params) {
        schema.params.parse(req.params);
      }
      
      next();
    } catch (error) {
      res.status(400).json({
        message: 'Validation error',
        errors: error.errors
      });
    }
  };
};
```

## 🗄️ ساختار مدل‌ها

### الگوی مدل Prisma
```javascript
const { prisma } = require('./index');

class Model {
  // ایجاد رکورد جدید
  static async create(data) {
    try {
      const item = await prisma.model.create({
        data: {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      return item;
    } catch (error) {
      console.error('Create error:', error);
      throw error;
    }
  }

  // دریافت رکورد بر اساس ID
  static async findById(id) {
    try {
      const item = await prisma.model.findUnique({
        where: { id: parseInt(id) },
        include: {
          // روابط مورد نیاز
        }
      });
      
      return item;
    } catch (error) {
      console.error('Find by ID error:', error);
      throw error;
    }
  }

  // دریافت تمام رکوردها
  static async findAll(filters = {}, options = {}) {
    try {
      const { page = 1, limit = 10, orderBy = 'createdAt', order = 'desc' } = options;
      
      const items = await prisma.model.findMany({
        where: filters,
        orderBy: { [orderBy]: order },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          // روابط مورد نیاز
        }
      });
      
      return items;
    } catch (error) {
      console.error('Find all error:', error);
      throw error;
    }
  }

  // به‌روزرسانی رکورد
  static async update(id, data) {
    try {
      const item = await prisma.model.update({
        where: { id: parseInt(id) },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
      
      return item;
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  }

  // حذف رکورد
  static async delete(id) {
    try {
      const item = await prisma.model.delete({
        where: { id: parseInt(id) }
      });
      
      return item;
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }
}

module.exports = Model;
```

## 🔄 ساختار سرویس‌ها

### الگوی سرویس
```javascript
const { Model } = require('../models');
const websocketService = require('./websocketService');

class Service {
  constructor() {
    this.isInitialized = false;
  }

  // مقداردهی اولیه سرویس
  async init() {
    if (this.isInitialized) {
      return;
    }

    try {
      // تنظیمات اولیه
      await this.setup();
      this.isInitialized = true;
      console.log('Service initialized successfully');
    } catch (error) {
      console.error('Service initialization error:', error);
      throw error;
    }
  }

  // تنظیمات اولیه
  async setup() {
    // پیاده‌سازی تنظیمات
  }

  // عملیات اصلی سرویس
  async performOperation(data) {
    try {
      // اعتبارسنجی ورودی
      this.validateInput(data);

      // پردازش داده
      const result = await this.processData(data);

      // ارسال به‌روزرسانی
      await this.notifyUpdate(result);

      return result;
    } catch (error) {
      console.error('Service operation error:', error);
      throw error;
    }
  }

  // اعتبارسنجی ورودی
  validateInput(data) {
    if (!data) {
      throw new Error('Data is required');
    }
    // اعتبارسنجی‌های بیشتر
  }

  // پردازش داده
  async processData(data) {
    // پیاده‌سازی پردازش
    return data;
  }

  // ارسال به‌روزرسانی
  async notifyUpdate(result) {
    try {
      await websocketService.sendUpdate(result);
    } catch (error) {
      console.error('Notification error:', error);
    }
  }
}

module.exports = new Service();
```

## 🧪 تست‌ها

### ساختار تست
```javascript
const request = require('supertest');
const app = require('../app');
const { prisma } = require('../models');

describe('Campaign API', () => {
  let authToken;
  let testUser;
  let testCampaign;

  // Setup قبل از تست‌ها
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
    const response = await request(app)
      .post('/api/user/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = response.body.token;
  });

  // Cleanup بعد از تست‌ها
  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' }
    });
  });

  // تست ایجاد کمپین
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
      
      testCampaign = response.body.campaign;
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/campaigns')
        .send({ message: 'Test' })
        .expect(401);

      expect(response.body.message).toBe('Authentication required');
    });
  });

  // تست دریافت کمپین‌ها
  describe('GET /api/campaigns', () => {
    it('should return user campaigns', async () => {
      const response = await request(app)
        .get('/api/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.campaigns).toBeDefined();
      expect(Array.isArray(response.body.campaigns)).toBe(true);
    });
  });
});
```

### تست واحد
```javascript
const { CampaignService } = require('../services/campaignService');

describe('CampaignService', () => {
  let campaignService;

  beforeEach(() => {
    campaignService = new CampaignService();
  });

  describe('validateCampaignData', () => {
    it('should validate correct data', () => {
      const validData = {
        message: 'Test message',
        title: 'Test campaign'
      };

      expect(() => {
        campaignService.validateCampaignData(validData);
      }).not.toThrow();
    });

    it('should throw error for invalid data', () => {
      const invalidData = {
        message: '',
        title: 'Test campaign'
      };

      expect(() => {
        campaignService.validateCampaignData(invalidData);
      }).toThrow('Message is required');
    });
  });
});
```

## 🔧 ابزارهای توسعه

### ESLint Configuration
```json
{
  "extends": ["eslint:recommended"],
  "env": {
    "node": true,
    "es6": true
  },
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### Git Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm test"
    }
  },
  "lint-staged": {
    "*.js": ["eslint --fix", "prettier --write"]
  }
}
```

## 📊 مانیتورینگ و لاگ‌گیری

### Logger Configuration
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

module.exports = logger;
```

### Performance Monitoring
```javascript
const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${duration}ms`);
    
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration
      });
    }
  });
  
  next();
};
```

## 🚀 استقرار

### Docker Configuration
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Environment Variables
```env
# Development
NODE_ENV=development
DATABASE_URL=mysql://user:pass@localhost:3306/whatsapp_campaign_dev

# Production
NODE_ENV=production
DATABASE_URL=mysql://user:pass@localhost:3306/whatsapp_campaign_prod
```

---

**نکته**: این راهنما به‌روزرسانی می‌شود. لطفاً آخرین نسخه را بررسی کنید.
