const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

describe('Session-Based Authentication', () => {
    let testUser;
    let userSession;

    beforeAll(async () => {
        // Create test user
        const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
        testUser = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: hashedPassword,
            role: 'user',
            profile: {
                phone: '09123456789'
            }
        });
        await testUser.save();
    });

    afterAll(async () => {
        await User.deleteMany({ email: 'test@example.com' });
    });

    describe('Login with Session Storage', () => {
        test('Should store JWT token in session after login', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'TestPassword123!'
                })
                .expect(200);

            expect(response.body.message).toBe('Login successful');
            expect(response.body.accessToken).toBeDefined();
            expect(response.body.refreshToken).toBeDefined();
            expect(response.body.user).toBeDefined();

            // Store session for next tests
            userSession = response.headers['set-cookie'];
        });
    });

    describe('Session-Based Authentication', () => {
        test('Should authenticate using session cookie', async () => {
            const response = await request(app)
                .get('/api/campaigns')
                .set('Cookie', userSession)
                .expect(200);

            expect(response.body).toBeDefined();
        });

        test('Should work with both Authorization header and session', async () => {
            // First get token from login
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'TestPassword123!'
                });

            const token = loginResponse.body.accessToken;

            // Test with Authorization header
            const headerResponse = await request(app)
                .get('/api/campaigns')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(headerResponse.body).toBeDefined();

            // Test with session cookie
            const sessionResponse = await request(app)
                .get('/api/campaigns')
                .set('Cookie', userSession)
                .expect(200);

            expect(sessionResponse.body).toBeDefined();
        });

        test('Should fail without authentication', async () => {
            const response = await request(app)
                .get('/api/campaigns')
                .expect(401);

            expect(response.body.message).toContain('Authorization token missing');
        });
    });

    describe('Logout with Session Cleanup', () => {
        test('Should clear session on logout', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', userSession)
                .send({
                    refreshToken: 'some-refresh-token'
                })
                .expect(200);

            expect(response.body.message).toBe('Logout successful');
        });
    });

    describe('Middleware Functions', () => {
        test('authenticateJwt should work with session', async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'TestPassword123!'
                });

            const session = loginResponse.headers['set-cookie'];

            const response = await request(app)
                .get('/api/campaigns')
                .set('Cookie', session)
                .expect(200);

            expect(response.body).toBeDefined();
        });

        test('authenticateSession should work with session', async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'TestPassword123!'
                });

            const session = loginResponse.headers['set-cookie'];

            const response = await request(app)
                .get('/api/campaigns')
                .set('Cookie', session)
                .expect(200);

            expect(response.body).toBeDefined();
        });
    });
});
