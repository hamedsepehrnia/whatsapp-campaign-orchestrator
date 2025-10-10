const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting database migration...');
  
  try {
    // Create initial admin user if not exists
    const adminExists = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const admin = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@example.com',
          phone: '09123456789',
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });
      
      console.log('✅ Admin user created:', admin.email);
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create sample packages if not exist
    const packageCount = await prisma.package.count();
    
    if (packageCount === 0) {
      const packages = [
        {
          title: 'Basic Package',
          description: 'Basic messaging package with 100 messages',
          price: 100000,
          duration: 30,
          category: 'basic',
          messageLimit: 100
        },
        {
          title: 'Premium Package',
          description: 'Premium messaging package with 500 messages',
          price: 400000,
          duration: 30,
          category: 'premium',
          messageLimit: 500
        },
        {
          title: 'Enterprise Package',
          description: 'Enterprise messaging package with unlimited messages',
          price: 1000000,
          duration: 30,
          category: 'enterprise',
          messageLimit: 0
        }
      ];

      for (const pkg of packages) {
        await prisma.package.create({ data: pkg });
      }
      
      console.log('✅ Sample packages created');
    } else {
      console.log('ℹ️  Packages already exist');
    }

    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
