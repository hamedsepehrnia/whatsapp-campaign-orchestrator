// مثال کامل استفاده از Refresh Token در Frontend

class AuthManager {
    constructor() {
        this.accessToken = localStorage.getItem('accessToken');
        this.refreshToken = localStorage.getItem('refreshToken');
        this.tokenExpiry = null;
    }
    
    // لاگین و دریافت tokens
    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // ذخیره tokens
                this.accessToken = data.accessToken;
                this.refreshToken = data.refreshToken;
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                
                // محاسبه زمان انقضای access token (15 دقیقه)
                this.tokenExpiry = Date.now() + (15 * 60 * 1000);
                
                return { success: true, user: data.user };
            } else {
                const error = await response.json();
                return { success: false, message: error.message };
            }
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    }
    
    // بررسی اعتبار access token
    isAccessTokenValid() {
        if (!this.accessToken || !this.tokenExpiry) {
            return false;
        }
        return Date.now() < this.tokenExpiry;
    }
    
    // دریافت access token جدید با refresh token
    async refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }
        
        try {
            const response = await fetch('/api/refresh/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // ذخیره access token جدید
                this.accessToken = data.accessToken;
                localStorage.setItem('accessToken', data.accessToken);
                
                // محاسبه زمان انقضای جدید
                this.tokenExpiry = Date.now() + (15 * 60 * 1000);
                
                return data.accessToken;
            } else {
                // Refresh token منقضی شده - کاربر باید دوباره لاگین کند
                this.logout();
                throw new Error('Refresh token expired');
            }
        } catch (error) {
            this.logout();
            throw error;
        }
    }
    
    // درخواست API با مدیریت خودکار token
    async makeAuthenticatedRequest(url, options = {}) {
        // اگر access token منقضی شده، refresh کن
        if (!this.isAccessTokenValid()) {
            try {
                await this.refreshAccessToken();
            } catch (error) {
                // اگر refresh هم ناموفق بود، کاربر را به لاگین هدایت کن
                this.redirectToLogin();
                return;
            }
        }
        
        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        try {
            const response = await fetch(url, {
                ...options,
                headers
            });
            
            // اگر access token نامعتبر بود، سعی کن refresh کن
            if (response.status === 401) {
                try {
                    await this.refreshAccessToken();
                    
                    // دوباره درخواست را ارسال کن
                    const retryResponse = await fetch(url, {
                        ...options,
                        headers: {
                            ...headers,
                            'Authorization': `Bearer ${this.accessToken}`
                        }
                    });
                    
                    return retryResponse;
                } catch (error) {
                    this.redirectToLogin();
                    return;
                }
            }
            
            return response;
        } catch (error) {
            console.error('Request failed:', error);
            throw error;
        }
    }
    
    // لاگ اوت
    async logout() {
        if (this.refreshToken) {
            try {
                await fetch('/api/refresh/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: this.refreshToken })
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }
        
        // پاک کردن tokens
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }
    
    // لاگ اوت از تمام دستگاه‌ها
    async logoutAll() {
        try {
            await this.makeAuthenticatedRequest('/api/refresh/logout-all', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout all error:', error);
        }
        
        this.logout();
    }
    
    // هدایت به صفحه لاگین
    redirectToLogin() {
        this.logout();
        window.location.href = '/login';
    }
    
    // شروع countdown برای access token
    startTokenCountdown() {
        const timer = setInterval(() => {
            if (!this.isAccessTokenValid()) {
                clearInterval(timer);
                // Token منقضی شده - سعی کن refresh کن
                this.refreshAccessToken().catch(() => {
                    this.redirectToLogin();
                });
                return;
            }
            
            const remaining = this.tokenExpiry - Date.now();
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            
            this.updateTokenDisplay(minutes, seconds);
        }, 1000);
    }
    
    updateTokenDisplay(minutes, seconds) {
        const display = document.getElementById('token-countdown');
        if (display) {
            display.textContent = `Access token expires in: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
}

// استفاده:
const authManager = new AuthManager();

// لاگین
async function login(email, password) {
    const result = await authManager.login(email, password);
    if (result.success) {
        authManager.startTokenCountdown();
        console.log('Login successful:', result.user);
    } else {
        console.error('Login failed:', result.message);
    }
}

// استفاده از API
async function getCampaigns() {
    try {
        const response = await authManager.makeAuthenticatedRequest('/api/campaigns');
        if (response) {
            const data = await response.json();
            console.log('Campaigns:', data);
        }
    } catch (error) {
        console.error('Error fetching campaigns:', error);
    }
}

// لاگ اوت
async function logout() {
    await authManager.logout();
    console.log('Logged out successfully');
}

// لاگ اوت از تمام دستگاه‌ها
async function logoutAll() {
    await authManager.logoutAll();
    console.log('Logged out from all devices');
}

// مثال استفاده در React
/*
function App() {
    const [user, setUser] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    
    useEffect(() => {
        // بررسی اینکه کاربر قبلاً لاگین کرده
        if (authManager.accessToken) {
            // دریافت اطلاعات کاربر
            authManager.makeAuthenticatedRequest('/api/user/profile')
                .then(response => response.json())
                .then(data => setUser(data.user))
                .catch(() => authManager.redirectToLogin());
        }
    }, []);
    
    const handleLogin = async (email, password) => {
        const result = await authManager.login(email, password);
        if (result.success) {
            setUser(result.user);
            authManager.startTokenCountdown();
        }
    };
    
    const handleLogout = async () => {
        await authManager.logout();
        setUser(null);
    };
    
    const fetchCampaigns = async () => {
        const response = await authManager.makeAuthenticatedRequest('/api/campaigns');
        const data = await response.json();
        setCampaigns(data.campaigns);
    };
    
    return (
        <div>
            {user ? (
                <div>
                    <h1>Welcome, {user.name}!</h1>
                    <button onClick={fetchCampaigns}>Get Campaigns</button>
                    <button onClick={handleLogout}>Logout</button>
                    <div id="token-countdown"></div>
                </div>
            ) : (
                <LoginForm onLogin={handleLogin} />
            )}
        </div>
    );
}
*/
