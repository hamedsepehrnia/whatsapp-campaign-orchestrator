const http = require('http');

// Test if server is running
const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/health',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`✅ Server is running on port 3000`);
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response:', data);
        process.exit(0);
    });
});

req.on('error', (err) => {
    console.log('❌ Server is not running or not accessible:', err.message);
    process.exit(1);
});

req.setTimeout(5000, () => {
    console.log('❌ Request timeout - server may not be running');
    process.exit(1);
});

req.end();
