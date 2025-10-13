// Script to make a user admin
const { User } = require('../src/models');
require('dotenv').config();

async function makeUserAdmin() {
    try {
        // Get user email from command line arguments
        const userEmail = process.argv[2];
        
        if (!userEmail) {
            console.log('Usage: node make-admin.js <user-email>');
            console.log('Example: node make-admin.js admin@example.com');
            process.exit(1);
        }

        // Find user by email
        const user = await User.findByEmail(userEmail);
        
        if (!user) {
            console.log(`❌ User with email ${userEmail} not found`);
            process.exit(1);
        }

        // Check if user is already admin
        if (user.role === 'ADMIN') {
            console.log(`✅ User ${userEmail} is already an admin`);
            process.exit(0);
        }

        // Update user role to admin
        await User.update(user.id, { role: 'ADMIN' });
        
        console.log(`✅ User ${userEmail} has been made admin successfully!`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ADMIN`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the script
makeUserAdmin();