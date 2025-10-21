/**
 * تست ساده اتصال
 */

const axios = require('axios');

async function testConnection() {
    console.log('🔍 تست اتصال ساده...');
    
    try {
        // تست 1: تست سرور
        console.log('\n📋 تست 1: بررسی سرور');
        const response1 = await axios.get('http://localhost:3000/test');
        console.log('✅ سرور کار می‌کند - Status:', response1.status);
        console.log('📊 Response:', response1.data.message);
        
    } catch (error) {
        console.log('❌ سرور کار نمی‌کند - Message:', error.message);
        return;
    }
    
    try {
        // تست 2: تست login
        console.log('\n📋 تست 2: تست login');
        const response2 = await axios.post('http://localhost:3000/api/user/login', {
            email: 'ali@example.com',
            password: 'password123'
        });
        console.log('✅ Login موفق - Status:', response2.status);
        console.log('📊 User ID:', response2.data.user.id);
        console.log('📊 Token:', response2.data.token.substring(0, 20) + '...');
        
    } catch (error) {
        console.log('❌ Login ناموفق - Status:', error.response?.status);
        console.log('❌ Login ناموفق - Message:', error.response?.data?.message);
        console.log('❌ Login ناموفق - Error:', error.message);
    }
}

// Run test
testConnection().catch(console.error);
