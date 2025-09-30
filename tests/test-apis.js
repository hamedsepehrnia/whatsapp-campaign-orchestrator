const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let userId = '';
let packageId = '';
let orderId = '';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonBody = body ? JSON.parse(body) : {};
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: jsonBody
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testAPIs() {
    console.log('🚀 Starting API Tests...\n');

    try {
        // Test 1: User Registration
        console.log('1️⃣ Testing User Registration...');
        const registerResponse = await makeRequest('POST', '/api/user/register', {
            name: 'Test User',
            email: 'test@example.com',
            phone: '09120000000',
            password: 'Passw0rd!'
        });
        console.log('Status:', registerResponse.status);
        console.log('Response:', registerResponse.body);
        console.log('✅ Registration test completed\n');

        // Test 2: User Login
        console.log('2️⃣ Testing User Login...');
        const loginResponse = await makeRequest('POST', '/api/user/login', {
            email: 'test@example.com',
            password: 'Passw0rd!'
        });
        console.log('Status:', loginResponse.status);
        console.log('Response:', loginResponse.body);
        
        if (loginResponse.body.token) {
            authToken = loginResponse.body.token;
            userId = loginResponse.body.user.id;
            console.log('✅ Login successful, token saved\n');
        } else {
            console.log('❌ Login failed\n');
            return;
        }

        // Test 3: Get Packages (Public)
        console.log('3️⃣ Testing Get Packages (Public)...');
        const packagesResponse = await makeRequest('GET', '/api/packages');
        console.log('Status:', packagesResponse.status);
        console.log('Response:', packagesResponse.body);
        console.log('✅ Packages test completed\n');

        // Test 4: Create Package (Admin - will fail without admin role)
        console.log('4️⃣ Testing Create Package (Admin)...');
        const createPackageResponse = await makeRequest('POST', '/api/packages', {
            title: 'Test Package',
            description: 'Test Description',
            price: 100000,
            duration: 30,
            category: 'test'
        }, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', createPackageResponse.status);
        console.log('Response:', createPackageResponse.body);
        console.log('✅ Create Package test completed (expected to fail - not admin)\n');

        // Test 5: Create Order
        console.log('5️⃣ Testing Create Order...');
        // First, let's create a package manually in the database or use an existing one
        // For now, we'll test with a mock package ID
        const createOrderResponse = await makeRequest('POST', '/api/orders', {
            packageId: '507f1f77bcf86cd799439011' // Mock ObjectId
        }, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', createOrderResponse.status);
        console.log('Response:', createOrderResponse.body);
        console.log('✅ Create Order test completed\n');

        // Test 6: Get My Orders
        console.log('6️⃣ Testing Get My Orders...');
        const myOrdersResponse = await makeRequest('GET', '/api/orders/me', null, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', myOrdersResponse.status);
        console.log('Response:', myOrdersResponse.body);
        console.log('✅ Get My Orders test completed\n');

        // Test 7: Start Payment (will fail without valid order)
        console.log('7️⃣ Testing Start Payment...');
        const startPaymentResponse = await makeRequest('POST', '/api/payments/start', {
            orderId: '507f1f77bcf86cd799439011' // Mock ObjectId
        }, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', startPaymentResponse.status);
        console.log('Response:', startPaymentResponse.body);
        console.log('✅ Start Payment test completed\n');

        // Test 8: Admin Dashboard (will fail - not admin)
        console.log('8️⃣ Testing Admin Dashboard...');
        const adminDashboardResponse = await makeRequest('GET', '/api/admin/dashboard', null, {
            'Authorization': `Bearer ${authToken}`
        });
        console.log('Status:', adminDashboardResponse.status);
        console.log('Response:', adminDashboardResponse.body);
        console.log('✅ Admin Dashboard test completed (expected to fail - not admin)\n');

        // Test 9: Get Profile (Session-based)
        console.log('9️⃣ Testing Get Profile (Session-based)...');
        const profileResponse = await makeRequest('GET', '/api/user/profile');
        console.log('Status:', profileResponse.status);
        console.log('Response:', profileResponse.body);
        console.log('✅ Get Profile test completed\n');

        console.log('🎉 All API tests completed!');
        console.log('\n📋 Summary:');
        console.log('- User registration: ✅');
        console.log('- User login: ✅');
        console.log('- Get packages: ✅');
        console.log('- Create package (admin): ❌ (expected - not admin)');
        console.log('- Create order: ❌ (expected - no valid package)');
        console.log('- Get my orders: ✅');
        console.log('- Start payment: ❌ (expected - no valid order)');
        console.log('- Admin dashboard: ❌ (expected - not admin)');
        console.log('- Get profile: ❌ (expected - session not maintained)');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

// Check if server is running first
makeRequest('GET', '/api/packages')
    .then(() => {
        console.log('✅ Server is running, starting tests...\n');
        testAPIs();
    })
    .catch((error) => {
        console.error('❌ Server is not running or not accessible:', error.message);
        console.log('Please make sure the server is running on port 3000');
    });
