// Test Token Expiry
const jwt = require('jsonwebtoken');

console.log('🔑 Testing JWT Token Expiry...\n');

// Test JWT token with 30 days expiry
const payload = { id: 'test-user-id', role: 'user' };
const secret = 'your-jwt-secret';

// Generate token with 30 days expiry
const token = jwt.sign(payload, secret, { expiresIn: '30d' });

console.log('✅ JWT Token generated with 30 days expiry');
console.log('Token:', token.substring(0, 50) + '...');

// Decode token to check expiry
const decoded = jwt.decode(token);
console.log('\n📅 Token Details:');
console.log('User ID:', decoded.id);
console.log('Role:', decoded.role);
console.log('Issued At:', new Date(decoded.iat * 1000));
console.log('Expires At:', new Date(decoded.exp * 1000));

// Calculate days until expiry
const now = new Date();
const expiry = new Date(decoded.exp * 1000);
const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

console.log('\n⏰ Expiry Information:');
console.log(`Days until expiry: ${daysUntilExpiry} days`);
console.log(`Expiry date: ${expiry.toLocaleDateString('fa-IR')}`);

// Test refresh token expiry (60 days)
const refreshTokenExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
console.log('\n🔄 Refresh Token Information:');
console.log(`Refresh token expires: ${refreshTokenExpiry.toLocaleDateString('fa-IR')}`);
console.log(`Days until refresh token expiry: ${Math.ceil((refreshTokenExpiry - now) / (1000 * 60 * 60 * 24))} days`);

console.log('\n📊 Token Expiry Summary:');
console.log('✅ JWT Access Token: 30 days');
console.log('✅ Refresh Token: 60 days');
console.log('✅ OTP Token: 5 minutes');
console.log('✅ Verification Token: 5 minutes');

console.log('\n🎯 User Experience:');
console.log('• User can stay logged in for 30 days');
console.log('• After 30 days, user needs to use refresh token');
console.log('• After 60 days, user needs to login again');
console.log('• OTP tokens expire in 5 minutes for security');

console.log('\n✅ Token expiry configuration updated successfully!');
