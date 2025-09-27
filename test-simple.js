// Simple API Test
const BASE_URL = 'http://localhost:3000';

async function testAPI() {
    console.log('Testing API endpoints...');
    
    try {
        // Test server health
        const response = await fetch(`${BASE_URL}/api/auth/request-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channel: 'sms',
                target: '09120000000'
            })
        });
        
        if (response.ok) {
            console.log('✅ Server is running');
            const data = await response.json();
            console.log('Response:', data);
        } else {
            console.log('❌ Server error:', response.status);
        }
    } catch (error) {
        console.log('❌ Connection error:', error.message);
    }
}

testAPI();
