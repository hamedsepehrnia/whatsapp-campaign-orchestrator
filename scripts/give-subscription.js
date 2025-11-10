require('dotenv').config();
const prisma = require('../src/config/prisma');

async function giveSubscription() {
    try {
        console.log('🔍 Finding first user...');
        
        // Find first user
        const user = await prisma.user.findFirst({
            orderBy: { id: 'asc' }
        });

        if (!user) {
            console.error('❌ No user found in database. Please create a user first.');
            process.exit(1);
        }

        console.log(`✅ Found user: ${user.name} (ID: ${user.id}, Email: ${user.email})`);

        // Check if package exists, if not create one
        let package = await prisma.package.findFirst({
            where: { status: 'ACTIVE' }
        });

        if (!package) {
            console.log('📦 Creating test package...');
            package = await prisma.package.create({
                data: {
                    title: 'Test Package',
                    description: 'Test package for development',
                    price: 0,
                    duration: 365, // 1 year
                    category: 'test',
                    status: 'ACTIVE',
                    messageLimit: 10000 // 10,000 messages
                }
            });
            console.log(`✅ Created package: ${package.title} (ID: ${package.id}, Limit: ${package.messageLimit})`);
        } else {
            console.log(`✅ Using existing package: ${package.title} (ID: ${package.id}, Limit: ${package.messageLimit})`);
        }

        // Check if user already has this package
        const userPackages = await prisma.user.findUnique({
            where: { id: user.id },
            include: { purchasedPackages: true }
        });

        const hasPackage = userPackages.purchasedPackages.some(pkg => pkg.id === package.id);

        if (!hasPackage) {
            console.log('🔗 Connecting package to user...');
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    purchasedPackages: {
                        connect: { id: package.id }
                    }
                }
            });
            console.log('✅ Package connected to user');
        } else {
            console.log('ℹ️ User already has this package');
        }

        // Activate subscription
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year from now

        await prisma.user.update({
            where: { id: user.id },
            data: {
                subscriptionActive: true,
                subscriptionExpiresAt: expiresAt
            }
        });

        console.log('✅ Subscription activated');
        console.log(`   - Active: true`);
        console.log(`   - Expires at: ${expiresAt.toLocaleString('fa-IR')}`);

        // Show final status
        const updatedUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { purchasedPackages: true }
        });

        const totalLimit = updatedUser.purchasedPackages.reduce((total, pkg) => {
            return total + (pkg.messageLimit || 0);
        }, 0);

        console.log('\n📊 Final Subscription Status:');
        console.log(`   User: ${updatedUser.name} (ID: ${updatedUser.id})`);
        console.log(`   Subscription Active: ${updatedUser.subscriptionActive}`);
        console.log(`   Expires At: ${updatedUser.subscriptionExpiresAt?.toLocaleString('fa-IR') || 'N/A'}`);
        console.log(`   Total Message Limit: ${totalLimit}`);
        console.log(`   Packages: ${updatedUser.purchasedPackages.length}`);
        updatedUser.purchasedPackages.forEach(pkg => {
            console.log(`     - ${pkg.title}: ${pkg.messageLimit} messages`);
        });

        console.log('\n✅ Subscription setup completed successfully!');
        console.log('💡 You can now start campaigns.');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

giveSubscription();

