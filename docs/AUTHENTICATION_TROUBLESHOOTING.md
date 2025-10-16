# راهنمای عیب‌یابی مشکلات احراز هویت

## 🔍 مشکلات رایج و راه‌حل‌ها

### 1. مشکل "User not found" بعد از لاگ‌اوت

#### علل احتمالی:
- **Session Management**: سشن بعد از لاگ‌اوت پاک نمی‌شه
- **Cookie Issues**: مرورگر کوکی‌ها رو درست ذخیره نمی‌کنه
- **CORS**: مشکل در ارسال Credentials

#### راه‌حل‌ها:

**1. بررسی Cookie Settings در مرورگر**
```javascript
// در src/app.js
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,      // برای HTTPS باید true باشه
        sameSite: "lax",    // یا "none" برای cross-origin
        maxAge: 24 * 60 * 60 * 1000  // 24 ساعت
    }
}));
```

**2. بررسی CORS Settings**
```javascript
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true  // مهم: برای ارسال کوکی‌ها
}));
```

**3. بررسی Frontend (Axios)**
```javascript
// در frontend باید withCredentials: true باشه
axios.post('http://localhost:3000/api/user/login', {
    email: 'test@example.com',
    password: '123456'
}, {
    withCredentials: true  // مهم: برای دریافت و ارسال کوکی‌ها
});
```

**4. بررسی Postman Settings**
- در Postman تب "Cookies" رو چک کنید
- مطمئن شوید که cookies بعد از لاگین ذخیره می‌شه
- برای هر request، cookies باید automatically ارسال بشه

### 2. مشکل ثبت‌نام تکراری با ایمیل یکسان

#### علل احتمالی:
- **Validation Issue**: چک کردن ایمیل تکراری کار نمی‌کنه
- **Database Constraints**: constraint های دیتابیس درست تنظیم نشده

#### راه‌حل‌ها:

**1. بررسی Prisma Schema**
```prisma
model User {
  id       Int     @id @default(autoincrement())
  email    String  @unique  // مهم: باید unique باشه
  username String  @unique  // مهم: باید unique باشه
  phone    String? @unique  // مهم: باید unique باشه
  // ...
}
```

**2. اجرای Migration**
```bash
npx prisma migrate dev
```

**3. بررسی Controller**
```javascript
// در src/controllers/userController.js
// چک کردن email
const existingEmail = await User.findByEmail(email);
if (existingEmail) {
    return res.status(400).json({ message: "Email already exists" });
}

// چک کردن username
const existingUsername = await User.findByUsername(username);
if (existingUsername) {
    return res.status(400).json({ message: "Username already exists" });
}

// چک کردن phone
if (phone) {
    const existingPhone = await User.findByPhone(phone);
    if (existingPhone) {
        return res.status(400).json({ message: "Phone number already exists" });
    }
}
```

### 3. مشکل Session بعد از Restart سرور

#### علل احتمالی:
- **In-Memory Session Storage**: sessions در memory ذخیره می‌شه

#### راه‌حل:
استفاده از **Session Store** مثل Redis یا MySQL:

```bash
npm install connect-session-sequelize express-mysql-session
```

```javascript
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,  // استفاده از MySQL برای ذخیره sessions
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
    }
}));
```

### 4. مشکل Passport Deserialize

#### علل احتمالی:
- **User Not Found**: کاربر در دیتابیس حذف شده یا ID اشتباه هست

#### راه‌حل:

```javascript
// در src/config/passport.js
passport.deserializeUser(async (id, done) => {
    try {
        console.log('🔍 Deserializing user:', id);
        const user = await User.findById(id);
        
        if (!user) {
            console.log('❌ User not found during deserialization:', id);
            return done(null, false);  // مهم: return false به جای throw error
        }
        
        console.log('👤 User found:', user.id, user.email);
        done(null, user);
    } catch (err) {
        console.error('💥 Deserialize Error:', err);
        done(err, null);
    }
});
```

## 🧪 تست کامل

برای تست کامل سیستم احراز هویت، فایل `test-complete-flow.js` رو اجرا کنید:

```bash
node test-complete-flow.js
```

این تست شامل موارد زیر هست:
1. ✅ ثبت‌نام کاربر جدید
2. ✅ لاگین
3. ✅ لاگ‌اوت
4. ✅ لاگین مجدد
5. ✅ تلاش برای ثبت‌نام تکراری
6. ✅ تلاش برای ثبت‌نام با ایمیل تکراری

## 🔧 دستورات مفید برای Debug

### 1. بررسی کاربران در دیتابیس
```bash
node debug-user-issue.js
```

### 2. بررسی Session ها
```bash
# در MySQL
SELECT * FROM sessions;
```

### 3. پاک کردن همه Sessions
```bash
# در MySQL
TRUNCATE TABLE sessions;
```

### 4. بررسی Logs سرور
```bash
npm start
# و بعد request های خودتون رو بزنید
```

## 📝 نکات مهم

1. **همیشه** `withCredentials: true` رو در frontend تنظیم کنید
2. **همیشه** `credentials: true` رو در CORS تنظیم کنید
3. **همیشه** از HTTPS برای production استفاده کنید (cookie.secure = true)
4. **همیشه** Session Store مناسب برای production استفاده کنید (Redis/MySQL)
5. **همیشه** constraints دیتابیس رو چک کنید (@unique در Prisma)

## 🆘 اگر همچنان مشکل دارید

1. لاگ‌های سرور رو چک کنید (console.log های اضافه شده)
2. Network Tab مرورگر رو چک کنید (Cookies, Headers)
3. Postman Console رو چک کنید
4. دیتابیس رو مستقیماً چک کنید

اگر مشکل همچنان وجود داشت، یک Issue در GitHub ایجاد کنید با:
- لاگ‌های کامل سرور
- Screenshot از Network Tab
- نسخه Node.js و npm
- سیستم عامل
