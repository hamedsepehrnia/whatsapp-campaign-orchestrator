const prisma = require('./prisma');

const connectDB = async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("❌ DATABASE_URL not set in environment variables");
        process.exit(1);
    }
    
    try {
        await prisma.$connect();
        console.log("✅ Connected to MySQL database via Prisma");
    } catch (err) {
        console.error("❌ Database connection error:", err.message);
        console.error("Please check your DATABASE_URL and ensure MySQL is running");
        process.exit(1);
    }
};

module.exports = connectDB;