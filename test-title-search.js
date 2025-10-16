const axios = require('axios');

async function testTitleSearch() {
    try {
        console.log('🧪 Testing Title Search...\n');
        
        // Test 1: String title
        console.log('1️⃣ Testing String Title: "hello"');
        const response1 = await axios.get('http://localhost:3000/api/campaigns?title=hello');
        console.log('✅ String title works:', response1.status === 200);
        
        // Test 2: Number title
        console.log('\n2️⃣ Testing Number Title: 123');
        const response2 = await axios.get('http://localhost:3000/api/campaigns?title=123');
        console.log('✅ Number title works:', response2.status === 200);
        
        // Test 3: Boolean title
        console.log('\n3️⃣ Testing Boolean Title: true');
        const response3 = await axios.get('http://localhost:3000/api/campaigns?title=true');
        console.log('✅ Boolean title works:', response3.status === 200);
        
        console.log('\n🎉 All title search tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testTitleSearch();
