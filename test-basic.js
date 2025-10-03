const http = require('http');

console.log('🧪 Testing Basic Server Connection...');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
};

const req = http.request(options, (res) => {
    console.log(`✅ Server is running! Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response:', data);
        console.log('🎉 Server is working correctly!');
        process.exit(0);
    });
});

req.on('error', (err) => {
    console.log('❌ Server connection failed:', err.message);
    console.log('💡 Make sure server is running with: node server.js');
    process.exit(1);
});

req.on('timeout', () => {
    console.log('❌ Request timeout - server may not be responding');
    req.destroy();
    process.exit(1);
});

req.setTimeout(5000);
req.end();
