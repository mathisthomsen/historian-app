const { PrismaClient } = require('./app/generated/prisma');

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('Listing all users...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true
      }
    });

    console.log('Users found:', users.length);
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Verified: ${user.emailVerified}`);
    });

  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers(); 