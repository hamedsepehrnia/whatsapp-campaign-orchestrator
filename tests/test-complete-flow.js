// تست کامل فلوی لاگین/لاگ‌اوت/ثبت‌نام
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_PREFIX = '/api/user';

async function testCompleteFlow() {
    console.log('🚀 شروع تست کامل...\n');
    
    const testUser = {
        name: 'تست کاربر',
        username: 'testuser123',
        email: 'test@example.com',
        password: '123456',
        phone: '09123456788'
    };
    
    try {
        // 1. ثبت‌نام اولیه
        console.log('1️⃣ ثبت‌نام کاربر جدید...');
        try {
            const registerRes = await axios.post(`${BASE_URL}${API_PREFIX}/register-simple`, testUser);
            console.log('✅ ثبت‌نام موفق:', registerRes.data);
        } catch (err) {
            if (err.response?.data?.message === 'Email already exists' || 
                err.response?.data?.message === 'Username already exists') {
                console.log('⚠️ کاربر قبلاً ثبت‌نام کرده');
            } else {
                throw err;
            }
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 2. لاگین
        console.log('2️⃣ لاگین کاربر...');
        const loginRes = await axios.post(`${BASE_URL}${API_PREFIX}/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('✅ لاگین موفق:', {
            message: loginRes.data.message,
            userId: loginRes.data.user.id,
            email: loginRes.data.user.email
        });
        
        const sessionCookie = loginRes.headers['set-cookie'];
        console.log('🍪 Session Cookie:', sessionCookie ? 'دریافت شد' : 'دریافت نشد');
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 3. لاگ‌اوت
        console.log('3️⃣ لاگ‌اوت کاربر...');
        const logoutRes = await axios.post(`${BASE_URL}${API_PREFIX}/logout`, {}, {
            headers: {
                Cookie: sessionCookie
            }
        });
        console.log('✅ لاگ‌اوت موفق:', logoutRes.data);
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 4. تلاش برای لاگین مجدد
        console.log('4️⃣ تلاش برای لاگین مجدد...');
        try {
            const login2Res = await axios.post(`${BASE_URL}${API_PREFIX}/login`, {
                email: testUser.email,
                password: testUser.password
            });
            console.log('✅ لاگین مجدد موفق:', {
                message: login2Res.data.message,
                userId: login2Res.data.user.id,
                email: login2Res.data.user.email
            });
        } catch (err) {
            console.log('❌ لاگین مجدد ناموفق:', err.response?.data);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 5. تلاش برای ثبت‌نام مجدد با همان اطلاعات
        console.log('5️⃣ تلاش برای ثبت‌نام مجدد با همان اطلاعات...');
        try {
            const register2Res = await axios.post(`${BASE_URL}${API_PREFIX}/register-simple`, testUser);
            console.log('⚠️ ثبت‌نام مجدد موفق شد (این باید خطا بده!):', register2Res.data);
        } catch (err) {
            console.log('✅ ثبت‌نام مجدد خطا داد (صحیح):', err.response?.data);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 6. تلاش برای ثبت‌نام با ایمیل یکسان و شماره متفاوت
        console.log('6️⃣ تلاش برای ثبت‌نام با ایمیل یکسان و شماره متفاوت...');
        try {
            const register3Res = await axios.post(`${BASE_URL}${API_PREFIX}/register-simple`, {
                ...testUser,
                phone: '09123456789', // شماره متفاوت
                username: 'testuser456' // نام کاربری متفاوت
            });
            console.log('⚠️ ثبت‌نام با ایمیل تکراری موفق شد (این باید خطا بده!):', register3Res.data);
        } catch (err) {
            console.log('✅ ثبت‌نام با ایمیل تکراری خطا داد (صحیح):', err.response?.data);
        }
        
    } catch (error) {
        console.error('💥 خطا در تست:', error.message);
        if (error.response) {
            console.error('📋 پاسخ سرور:', error.response.data);
        }
    }
}

// اجرای تست
testCompleteFlow().then(() => {
    console.log('\n✅ تست کامل شد');
    process.exit(0);
}).catch(error => {
    console.error('💥 خطا:', error);
    process.exit(1);
});
