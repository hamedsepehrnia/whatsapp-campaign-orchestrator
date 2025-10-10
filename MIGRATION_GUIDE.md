# Database Migration Guide: MongoDB to MySQL with Prisma

This guide explains how to migrate from MongoDB (Mongoose) to MySQL (Prisma) for the WhatsApp Campaign API.

## What Changed

### 1. Database Technology
- **Before**: MongoDB with Mongoose ODM
- **After**: MySQL with Prisma ORM

### 2. Dependencies
- **Removed**: `mongoose`
- **Added**: `@prisma/client`, `prisma`, `mysql2`

### 3. Database Schema
- Converted MongoDB schemas to Prisma schema
- Added proper relationships and constraints
- Used MySQL-specific data types

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file with the following variables:

```env
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/whatsapp_campaign_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"

# Server Configuration
PORT=3000
NODE_ENV=development

# Other configurations...
```

### 3. Database Setup
1. **Install MySQL** on your system
2. **Create Database**:
   ```sql
   CREATE DATABASE whatsapp_campaign_db;
   ```

### 4. Run Migrations
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed initial data
node prisma/migrate.js
```

### 5. Start the Server
```bash
npm start
```

## Database Schema

### Models Converted
1. **User** - User accounts and profiles
2. **Campaign** - WhatsApp campaigns
3. **Recipient** - Campaign recipients
4. **Attachment** - Campaign attachments
5. **Package** - Subscription packages
6. **Order** - Package orders
7. **Transaction** - Payment transactions
8. **Otp** - OTP verification codes
9. **RefreshToken** - JWT refresh tokens

### Key Changes
- MongoDB ObjectIds → MySQL auto-increment integers
- Embedded documents → Separate tables with foreign keys
- MongoDB arrays → Junction tables for many-to-many relationships
- Added proper indexes for performance

## API Changes

### Response Format
- `_id` fields changed to `id`
- Nested objects flattened where appropriate
- Profile data structure updated

### Example Response Change
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

## Migration Scripts

### Available Commands
```bash
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations in development
npm run db:deploy      # Deploy migrations in production
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Run seed script
```

## Troubleshooting

### Common Issues

1. **Connection Error**
   - Check DATABASE_URL format
   - Ensure MySQL is running
   - Verify database exists

2. **Migration Errors**
   - Check Prisma schema syntax
   - Ensure database is empty or backup existing data
   - Run `npx prisma migrate reset` to start fresh

3. **Import Errors**
   - Run `npm run db:generate` after schema changes
   - Restart the server after generating client

### Data Migration
If you have existing MongoDB data, you'll need to:
1. Export data from MongoDB
2. Transform data format
3. Import to MySQL using Prisma

## Performance Considerations

### Indexes
- Added indexes on frequently queried fields
- Foreign key indexes for relationships
- Composite indexes for complex queries

### Query Optimization
- Use Prisma's `include` for eager loading
- Implement pagination for large datasets
- Use `select` to limit returned fields

## Security Updates

### Authentication
- Updated JWT payload structure
- Maintained session-based authentication
- Updated password hashing (bcrypt)

### Data Validation
- Prisma schema validation
- Input sanitization maintained
- SQL injection protection via Prisma

## Testing

### Test the Migration
```bash
# Run basic API tests
npm test

# Test specific endpoints
npm run test:campaign
npm run test:whatsapp
```

### Verify Database
```bash
# Open Prisma Studio to inspect data
npm run db:studio
```

## Rollback Plan

If you need to rollback to MongoDB:
1. Restore original `package.json`
2. Restore original model files
3. Update database configuration
4. Restore MongoDB connection

## Support

For issues with the migration:
1. Check Prisma documentation
2. Verify MySQL configuration
3. Review error logs
4. Test with sample data

---

**Note**: This migration maintains API compatibility while changing the underlying database technology. Most client applications should continue to work without changes.
