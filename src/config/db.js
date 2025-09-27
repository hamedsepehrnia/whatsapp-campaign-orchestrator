const mongoose = require('mongoose')
const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("❌ MONGODB_URI not set in environment variables");
        process.exit(1);
    }
    
    try{
        await mongoose.connect(mongoUri)
        console.log("✅ Connected to MongoDB")
    }catch(err){
        console.error("❌ MongoDB connection error:", err.message)
        console.error("Please check your MongoDB connection string and ensure MongoDB is running")
        process.exit(1)
    }
}
module.exports = connectDB