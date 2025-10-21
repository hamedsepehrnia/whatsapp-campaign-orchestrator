/**
 * تست CORS و Headers
 */

const axios = require('axios');

async function testCORS() {
    console.log('🔍 تست CORS و Headers...');
    
    try {
        // تست 1: بدون Headers
        console.log('\n📋 تست 1: بدون Headers اضافی');
        const response1 = await axios.post('http://localhost:3000/api/user/login', {
            email: 'ali@example.com',
            password: 'password123'
        });
        console.log('✅ موفق - Status:', response1.status);
        
    } catch (error) {
        console.log('❌ خطا - Status:', error.response?.status);
        console.log('❌ خطا - Message:', error.response?.data?.message);
        console.log('❌ خطا - Headers:', error.response?.headers);
    }
    
    try {
        // تست 2: با Headers کامل
        console.log('\n📋 تست 2: با Headers کامل');
        const response2 = await axios.post('http://localhost:3000/api/user/login', {
            email: 'ali@example.com',
            password: 'password123'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': 'http://localhost:3000'
            }
        });
        console.log('✅ موفق - Status:', response2.status);
        
    } catch (error) {
        console.log('❌ خطا - Status:', error.response?.status);
        console.log('❌ خطا - Message:', error.response?.data?.message);
    }
    
    try {
        // تست 3: با fetch (مثل مرورگر)
        console.log('\n📋 تست 3: شبیه‌سازی fetch مرورگر');
        const fetch = require('node-fetch').default;
        const response3 = await fetch('http://localhost:3000/api/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: 'ali@example.com',
                password: 'password123'
            })
        });
        
        if (response3.ok) {
            const data = await response3.json();
            console.log('✅ موفق - Status:', response3.status);
            console.log('📊 Response:', data.message);
        } else {
            console.log('❌ خطا - Status:', response3.status);
            console.log('❌ خطا - Status Text:', response3.statusText);
        }
        
    } catch (error) {
        console.log('❌ خطا - Message:', error.message);
    }
}

// Run test
testCORS().catch(console.error);
