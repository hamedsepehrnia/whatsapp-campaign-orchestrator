// تست Multiple Status
const axios = require('axios');

async function testMultipleStatus() {
    console.log('🚀 تست Multiple Status...\n');
    
    try {
        // 1. لاگین
        console.log('1️⃣ لاگین...');
        const loginRes = await axios.post('http://localhost:3000/api/user/login', {
            email: 'test@example.com',
            password: '123456'
        });
        
        console.log('✅ لاگین موفق');
        const cookies = loginRes.headers['set-cookie'];
        
        // 2. تست Single Status
        console.log('\n2️⃣ تست Single Status...');
        try {
            const singleRes = await axios.get('http://localhost:3000/api/campaigns?status=DRAFT', {
                headers: { Cookie: cookies }
            });
            console.log('✅ Single Status کار کرد:', singleRes.data.campaigns?.length || 0, 'کمپین');
        } catch (err) {
            console.log('❌ Single Status خطا:', err.response?.data?.message);
        }
        
        // 3. تست Multiple Status
        console.log('\n3️⃣ تست Multiple Status...');
        try {
            const multiRes = await axios.get('http://localhost:3000/api/campaigns?status=DRAFT&status=READY', {
                headers: { Cookie: cookies }
            });
            console.log('✅ Multiple Status کار کرد:', multiRes.data.campaigns?.length || 0, 'کمپین');
        } catch (err) {
            console.log('❌ Multiple Status خطا:', err.response?.data?.message);
        }
        
        // 4. تست Multiple Status با 3 تا
        console.log('\n4️⃣ تست Multiple Status با 3 تا...');
        try {
            const tripleRes = await axios.get('http://localhost:3000/api/campaigns?status=DRAFT&status=READY&status=RUNNING', {
                headers: { Cookie: cookies }
            });
            console.log('✅ Triple Status کار کرد:', tripleRes.data.campaigns?.length || 0, 'کمپین');
        } catch (err) {
            console.log('❌ Triple Status خطا:', err.response?.data?.message);
        }
        
    } catch (error) {
        console.error('💥 خطا:', error.message);
        if (error.response) {
            console.error('📋 Response:', error.response.data);
        }
    }
}

testMultipleStatus();
