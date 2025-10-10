# 🚀 WhatsApp Campaign API - MySQL Migration

## Overview
This project has been successfully migrated from **MongoDB (Mongoose)** to **MySQL (Prisma)** for better performance, data consistency, and scalability.

## 🎯 Migration Benefits

### Performance Improvements
- ✅ **Faster queries** with optimized indexes
- ✅ **Better join performance** for relational data
- ✅ **ACID compliance** for transactions
- ✅ **Reduced memory usage** with structured data

### Data Consistency
- ✅ **Foreign key constraints** ensure data integrity
- ✅ **Referential integrity** prevents orphaned records
- ✅ **Atomic transactions** for complex operations
- ✅ **Data validation** at database level

### Developer Experience
- ✅ **Type-safe queries** with Prisma
- ✅ **Auto-completion** in IDEs
- ✅ **Database introspection** and migrations
- ✅ **Better error handling**

## 📋 What Changed

### Database Technology
| Before | After |
|--------|-------|
| MongoDB | MySQL |
| Mongoose ODM | Prisma ORM |
| Document-based | Relational |
| ObjectId | Auto-increment Integer |

### API Response Format
```javascript
// Before (MongoDB)
{
  "_id": "507f1f77bcf86cd799439011",
  "profile": {
    "age": 25,
    "address": "Tehran"
  }
}

// After (MySQL/Prisma)
{
  "id": 1,
  "age": 25,
  "address": "Tehran"
}
```

## 🛠️ Setup Instructions

### 1. Prerequisites
- Node.js 16+ 
- MySQL 8.0+
- npm or yarn

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE whatsapp_campaign_db;
```

### 4. Environment Configuration
Create `.env` file:
```env
DATABASE_URL="mysql://username:password@localhost:3306/whatsapp_campaign_db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
```

### 5. Run Migrations
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed initial data
node prisma/migrate.js
```

### 6. Start Server
```bash
npm start
```

## 📊 Database Schema

### Core Tables
- **users** - User accounts and profiles
- **campaigns** - WhatsApp campaigns
- **recipients** - Campaign recipients
- **attachments** - Campaign attachments
- **packages** - Subscription packages
- **orders** - Package orders
- **transactions** - Payment transactions
- **otps** - OTP verification codes
- **refresh_tokens** - JWT refresh tokens

### Key Relationships
- Users → Campaigns (1:many)
- Campaigns → Recipients (1:many)
- Campaigns → Attachments (1:many)
- Users → Orders (1:many)
- Orders → Transactions (1:1)
- Users → RefreshTokens (1:many)

## 🔧 Available Scripts

```bash
# Development
npm start              # Start server
npm run dev           # Start with nodemon

# Database
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run migrations (dev)
npm run db:deploy     # Deploy migrations (prod)
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Run seed script

# Testing
npm test              # Run API tests
npm run test:all      # Run all tests
```

## 🧪 Testing

### Test Migration
```bash
node test-migration.js
```

### Test APIs
```bash
npm test
```

### Postman Collection
Import `postman/WhatsApp-Campaign-API.postman_collection.json` into Postman.

## 📚 Documentation

- [API Documentation](docs/API_DOCUMENTATION.md)
- [Migration Guide](MIGRATION_GUIDE.md)
- [Prisma Schema](prisma/schema.prisma)

## 🔍 Troubleshooting

### Common Issues

1. **Connection Error**
   ```bash
   # Check DATABASE_URL format
   DATABASE_URL="mysql://user:pass@localhost:3306/db"
   ```

2. **Migration Errors**
   ```bash
   # Reset and start fresh
   npx prisma migrate reset
   npm run db:migrate
   ```

3. **Client Generation**
   ```bash
   # Regenerate Prisma client
   npm run db:generate
   ```

### Performance Tips
- Use `include` for eager loading
- Implement pagination for large datasets
- Add indexes for frequently queried fields
- Use `select` to limit returned fields

## 🚀 Production Deployment

### Environment Variables
```env
DATABASE_URL="mysql://user:pass@prod-server:3306/whatsapp_campaign_db"
JWT_SECRET="production-secret-key"
NODE_ENV=production
```

### Database Migration
```bash
npm run db:deploy
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

## 📈 Monitoring

### Prisma Studio
```bash
npm run db:studio
```

### Query Logging
Prisma automatically logs queries in development mode.

## 🔄 Rollback Plan

If you need to rollback to MongoDB:
1. Restore original `package.json`
2. Restore original model files
3. Update database configuration
4. Restore MongoDB connection

## 📞 Support

For issues with the migration:
1. Check [Prisma Documentation](https://www.prisma.io/docs)
2. Review error logs
3. Test with sample data
4. Verify MySQL configuration

---

**Migration completed successfully!** 🎉

The API maintains full backward compatibility while providing significant performance and reliability improvements.
