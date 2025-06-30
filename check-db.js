const { PrismaClient } = require('./app/generated/prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking database...');
    
    const users = await prisma.users.findMany({
      select: { id: true, email: true, name: true }
    });
    console.log('Users:', users);
    
    const persons = await prisma.persons.findMany({
      select: { id: true, first_name: true, last_name: true, userId: true }
    });
    console.log('Persons:', persons);
    
    const events = await prisma.events.findMany({
      select: { id: true, title: true, userId: true }
    });
    console.log('Events:', events);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 