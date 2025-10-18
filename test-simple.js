const axios = require('axios');

async function test() {
    try {
        console.log('Testing server connection...');
        
        const response = await axios.get('http://localhost:3000/api/user/profile', {
            headers: {
                'Authorization': 'Bearer test-token'
            }
        });
        
        console.log('Server is running!');
        console.log('Response:', response.data);
        
    } catch (error) {
        console.log('Error:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        }
    }
}

test();
