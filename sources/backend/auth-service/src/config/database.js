const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('💾 Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

const disconnectDatabase = async () => {
  await prisma.$disconnect();
  console.log('💾 Database disconnected');
};

module.exports = {
  prisma,
  connectDatabase,
  disconnectDatabase
};
