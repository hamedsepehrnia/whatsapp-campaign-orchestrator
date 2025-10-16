# 🔒 راهنمای امنیت

راهنمای کامل امنیت و بهترین شیوه‌های امنیتی سیستم

## 🛡️ امنیت احراز هویت

### JWT Tokens
```javascript
// تولید توکن امن
const token = jwt.sign(
  { id: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '30d' }
);

// اعتبارسنجی توکن
const payload = jwt.verify(token, process.env.JWT_SECRET);
```

### رمزنگاری رمز عبور
```javascript
// هش کردن رمز عبور
const hashedPassword = await bcrypt.hash(password, 10);

// بررسی رمز عبور
const isMatch = await bcrypt.compare(password, hashedPassword);
```

### Session Management
```javascript
// تنظیمات session امن
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 ساعت
  }
}));
```

## 🔐 کنترل دسترسی

### Role-based Access Control
```javascript
// میدل‌ویر کنترل دسترسی
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    next();
  };
};

// استفاده
router.get('/admin/users', authenticateSession, authorizeRoles('admin', 'superAdmin'), listUsers);
```

### Resource Ownership
```javascript
// بررسی مالکیت منابع
exports.checkCampaignOwnership = async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.campaignId);
  
  if (!campaign) {
    return res.status(404).json({ message: 'Campaign not found' });
  }
  
  if (campaign.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  req.campaign = campaign;
  next();
};
```

## 🚫 Rate Limiting

### محدودیت نرخ درخواست
```javascript
const rateLimit = require('express-rate-limit');

// محدودیت عمومی
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقیقه
  max: 200, // حداکثر 200 درخواست
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

// محدودیت برای API های حساس
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // حداکثر 10 درخواست
  message: 'Too many sensitive requests from this IP'
});

app.use('/api/auth', strictLimiter);
app.use('/api', generalLimiter);
```

### محدودیت آپلود فایل
```javascript
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 دقیقه
  max: 5, // حداکثر 5 آپلود در دقیقه
  message: 'Too many file uploads'
});

router.post('/upload', uploadLimiter, uploadFile);
```

## 🔍 اعتبارسنجی ورودی‌ها

### Schema Validation
```javascript
const { z } = require('zod');

// اعتبارسنجی ورودی کاربر
const userRegisterSchema = {
  body: z.object({
    name: z.string().min(2).max(100),
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
    email: z.string().email(),
    phone: z.string().regex(/^09\d{9}$/),
    password: z.string().min(6).max(100)
  })
};

// میدل‌ویر اعتبارسنجی
exports.validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.body.parse(req.body);
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

### Sanitization
```javascript
const validator = require('validator');

// پاکسازی ورودی‌ها
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return validator.escape(input.trim());
  }
  return input;
};

// اعمال به تمام ورودی‌ها
app.use((req, res, next) => {
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  next();
});
```

## 🛡️ امنیت فایل‌ها

### محدودیت نوع فایل
```javascript
const multer = require('multer');

// فیلتر فایل‌های خطرناک
const fileFilter = (req, file, cb) => {
  const dangerousMimes = [
    'application/x-executable',
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/x-winexe',
    'application/x-msi'
  ];
  
  if (dangerousMimes.includes(file.mimetype)) {
    cb(new Error('File type not allowed for security reasons'), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  },
  fileFilter: fileFilter
});
```

### بررسی محتوای فایل
```javascript
const fileType = require('file-type');

// بررسی نوع واقعی فایل
const checkFileType = async (filePath) => {
  const type = await fileType.fromFile(filePath);
  
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'application/pdf'
  ];
  
  if (!allowedTypes.includes(type.mime)) {
    throw new Error('Invalid file type');
  }
};
```

## 🔒 امنیت پایگاه داده

### SQL Injection Prevention
```javascript
// استفاده از Prisma ORM (خودکار)
const user = await prisma.user.findUnique({
  where: { email: userEmail }
});

// اگر از raw queries استفاده می‌کنید
const query = 'SELECT * FROM users WHERE email = ?';
const result = await db.query(query, [userEmail]);
```

### Connection Security
```javascript
// تنظیمات امن اتصال پایگاه داده
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true
  },
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000
};
```

## 🌐 امنیت HTTP

### CORS Configuration
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));
```

### Security Headers
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## 🔐 امنیت متغیرهای محیطی

### مدیریت Secrets
```javascript
// استفاده از dotenv
require('dotenv').config();

// بررسی وجود متغیرهای ضروری
const requiredEnvVars = [
  'JWT_SECRET',
  'SESSION_SECRET',
  'DATABASE_URL'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

### رمزنگاری متغیرهای حساس
```javascript
const crypto = require('crypto');

// رمزنگاری داده‌های حساس
const encrypt = (text) => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};
```

## 🚨 مانیتورینگ امنیت

### لاگ‌گیری امنیتی
```javascript
const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'security.log' })
  ]
});

// لاگ درخواست‌های مشکوک
app.use((req, res, next) => {
  if (req.headers['user-agent']?.includes('bot')) {
    securityLogger.warn('Suspicious request', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      url: req.url
    });
  }
  next();
});
```

### تشخیص حملات
```javascript
// تشخیص brute force
const failedAttempts = new Map();

const checkBruteForce = (ip) => {
  const attempts = failedAttempts.get(ip) || 0;
  
  if (attempts >= 5) {
    securityLogger.warn('Brute force attempt detected', { ip });
    return true;
  }
  
  return false;
};

// افزایش تعداد تلاش‌های ناموفق
const incrementFailedAttempts = (ip) => {
  const attempts = failedAttempts.get(ip) || 0;
  failedAttempts.set(ip, attempts + 1);
  
  // پاکسازی بعد از 15 دقیقه
  setTimeout(() => {
    failedAttempts.delete(ip);
  }, 15 * 60 * 1000);
};
```

## 🔄 به‌روزرسانی امنیت

### وابستگی‌های امن
```bash
# بررسی آسیب‌پذیری‌ها
npm audit

# به‌روزرسانی خودکار
npm audit fix

# به‌روزرسانی دستی
npm update
```

### Security Headers Check
```javascript
// بررسی headers امنیتی
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

## 🛠️ تست امنیت

### تست نفوذ
```javascript
// تست SQL Injection
const testSQLInjection = async () => {
  const maliciousInput = "'; DROP TABLE users; --";
  
  try {
    await prisma.user.findMany({
      where: { email: maliciousInput }
    });
    console.log('SQL Injection test passed');
  } catch (error) {
    console.log('SQL Injection test failed:', error.message);
  }
};
```

### تست XSS
```javascript
// تست XSS
const testXSS = (input) => {
  const xssPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  return xssPattern.test(input);
};
```

## 📋 چک‌لیست امنیت

### ✅ موارد ضروری
- [ ] رمز عبور قوی و هش شده
- [ ] JWT tokens امن
- [ ] Rate limiting فعال
- [ ] CORS تنظیم شده
- [ ] Security headers فعال
- [ ] Input validation کامل
- [ ] File upload امن
- [ ] SQL injection prevention
- [ ] Error handling مناسب
- [ ] Logging امنیتی

### ✅ موارد پیشرفته
- [ ] 2FA فعال
- [ ] Session management امن
- [ ] Encryption در rest
- [ ] API versioning
- [ ] Monitoring فعال
- [ ] Backup امن
- [ ] Disaster recovery
- [ ] Security testing
- [ ] Penetration testing
- [ ] Security audit

---

**نکته**: امنیت یک فرآیند مداوم است. لطفاً به‌روزرسانی‌های امنیتی را پیگیری کنید.
