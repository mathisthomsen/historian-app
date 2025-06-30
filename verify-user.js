const { PrismaClient } = require('./app/generated/prisma');

const prisma = new PrismaClient();

async function verifyUser(email) {
  try {
    console.log(`Verifying user: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', { id: user.id, email: user.email, emailVerified: user.emailVerified });

    if (user.emailVerified) {
      console.log('User is already verified');
      return;
    }

    // Verify the user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    });

    console.log('User verified successfully:', { id: updatedUser.id, email: updatedUser.email, emailVerified: updatedUser.emailVerified });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Verify the test user
verifyUser('bruno@test.test'); 