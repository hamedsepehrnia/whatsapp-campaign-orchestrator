// Check Environment Variables
console.log('🔍 Checking Environment Variables...\n');

console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('SESSION_SECRET exists:', !!process.env.SESSION_SECRET);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('PORT exists:', !!process.env.PORT);

if (process.env.JWT_SECRET) {
    console.log('JWT_SECRET length:', process.env.JWT_SECRET.length);
    console.log('JWT_SECRET starts with:', process.env.JWT_SECRET.substring(0, 10) + '...');
}

if (process.env.SESSION_SECRET) {
    console.log('SESSION_SECRET length:', process.env.SESSION_SECRET.length);
    console.log('SESSION_SECRET starts with:', process.env.SESSION_SECRET.substring(0, 10) + '...');
}

console.log('\n✅ Environment Variables Status:');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not Set');
console.log('- SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Set' : '❌ Not Set');
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not Set');
console.log('- PORT:', process.env.PORT ? '✅ Set' : '❌ Not Set');

console.log('\n🎯 Conclusion:');
if (process.env.JWT_SECRET && process.env.SESSION_SECRET) {
    console.log('✅ Your system is properly configured with secure secrets!');
    console.log('✅ Authentication should work correctly.');
} else {
    console.log('❌ Missing environment variables. Please check your .env file.');
}
