const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMigration() {
  console.log('🧪 Testing Prisma migration...');
  
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test basic queries
    const userCount = await prisma.user.count();
    console.log(`✅ User count: ${userCount}`);

    const packageCount = await prisma.package.count();
    console.log(`✅ Package count: ${packageCount}`);

    const campaignCount = await prisma.campaign.count();
    console.log(`✅ Campaign count: ${campaignCount}`);

    // Test model relationships
    const usersWithOrders = await prisma.user.findMany({
      include: {
        orders: {
          include: {
            package: true
          }
        }
      },
      take: 1
    });
    console.log('✅ Model relationships working');

    console.log('🎉 Migration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration test failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testMigration()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
