// تست ثبت نام ساده (Simple Register)
const BASE_URL = 'http://localhost:3000';

async function testSimpleRegister() {
    console.log('🚀 Testing Simple Registration...\n');
    
    try {
        // 1. تست ثبت نام ساده
        console.log('📝 Step 1: Simple Registration');
        const registerResponse = await fetch(`${BASE_URL}/api/user/register-simple`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: "علی احمدی",
                username: "ali_ahmadi",
                email: "ali@example.com",
                phone: "09120000000", // اختیاری
                password: "Passw0rd123!"
            })
        });
        
        if (registerResponse.ok) {
            const registerData = await registerResponse.json();
            console.log('✅ Registration successful:', registerData);
            
            // 2. تست لاگین
            console.log('\n🔐 Step 2: Login');
            const loginResponse = await fetch(`${BASE_URL}/api/user/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: "ali@example.com",
                    password: "Passw0rd123!"
                })
            });
            
            if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                console.log('✅ Login successful:', loginData);
                
                // 3. تست دریافت پروفایل
                console.log('\n👤 Step 3: Get Profile');
                const profileResponse = await fetch(`${BASE_URL}/api/user/profile`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${loginData.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (profileResponse.ok) {
                    const profileData = await profileResponse.json();
                    console.log('✅ Profile retrieved:', profileData);
                } else {
                    console.log('❌ Profile error:', profileResponse.status);
                }
                
            } else {
                const loginError = await loginResponse.json();
                console.log('❌ Login failed:', loginError);
            }
            
        } else {
            const registerError = await registerResponse.json();
            console.log('❌ Registration failed:', registerError);
        }
        
    } catch (error) {
        console.log('❌ Connection error:', error.message);
    }
}

// اجرای تست
testSimpleRegister();
