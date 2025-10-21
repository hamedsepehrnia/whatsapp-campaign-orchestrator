/**
 * تست سریع ورود
 */

const axios = require('axios');

async function testLogin() {
    try {
        console.log('🔐 تست ورود با اطلاعات پیش‌فرض...');
        
        const response = await axios.post('http://localhost:3000/api/user/login', {
            email: 'ali@example.com',
            password: 'password123'
        });

        console.log('✅ ورود موفق!');
        console.log('📊 اطلاعات کاربر:');
        console.log(`   - ID: ${response.data.user.id}`);
        console.log(`   - Email: ${response.data.user.email}`);
        console.log(`   - Role: ${response.data.user.role}`);
        console.log(`   - Token: ${response.data.token.substring(0, 20)}...`);
        
        return {
            success: true,
            token: response.data.token,
            userId: response.data.user.id
        };
        
    } catch (error) {
        console.log('❌ خطا در ورود:');
        console.log(`   - Status: ${error.response?.status}`);
        console.log(`   - Message: ${error.response?.data?.message || error.message}`);
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Run test
testLogin().then(result => {
    if (result.success) {
        console.log('\n🎉 تست ورود موفق بود!');
        console.log('📋 مراحل بعدی:');
        console.log('1. سرور را اجرا کنید: npm start');
        console.log('2. فایل تست را باز کنید: http://localhost:3000/whatsapp-qr-test.html');
        console.log('3. دکمه ورود را کلیک کنید');
    } else {
        console.log('\n❌ تست ورود ناموفق بود!');
        console.log('🔧 بررسی کنید:');
        console.log('1. سرور اجرا شده باشد');
        console.log('2. کاربر ali@example.com وجود داشته باشد');
        console.log('3. رمز عبور password123 باشد');
    }
});
