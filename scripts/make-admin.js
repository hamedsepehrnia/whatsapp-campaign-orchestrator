// Script to make a user admin
const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function makeUserAdmin() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to database');

        // Get user email from command line arguments
        const userEmail = process.argv[2];
        
        if (!userEmail) {
            console.log('Usage: node make-admin.js <user-email>');
            console.log('Example: node make-admin.js admin@example.com');
            process.exit(1);
        }

        // Find user by email
        const user = await User.findOne({ email: userEmail });
        
        if (!user) {
            console.log(`❌ User with email ${userEmail} not found`);
            process.exit(1);
        }

        // Check if user is already admin
        if (user.role === 'admin') {
            console.log(`✅ User ${userEmail} is already an admin`);
            process.exit(0);
        }

        // Update user role to admin
        await User.findByIdAndUpdate(user._id, { role: 'admin' });
        
        console.log(`✅ User ${userEmail} has been made admin successfully!`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: admin`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database');
    }
}

// Run the script
makeUserAdmin();
