const { PrismaClient } = require('@prisma/client');

// Configure logging based on environment
const logLevel = process.env.NODE_ENV === 'development' 
  ? ['warn', 'error'] // Only show warnings and errors in development
  : ['error']; // Only show errors in production

const prisma = new PrismaClient({
  log: logLevel,
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = prisma;
