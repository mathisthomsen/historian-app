const { PrismaClient } = require('./app/generated/prisma');

const prisma = new PrismaClient();

async function testPrisma() {
  try {
    console.log('Testing Prisma client...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Test user query
    const users = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    console.log('✅ Users query successful:', users.length, 'users found');
    
    // Test persons query
    const persons = await prisma.persons.findMany({
      where: { userId: 4 },
      select: { id: true, first_name: true }
    });
    console.log('✅ Persons query successful:', persons.length, 'persons found');
    
    // Test events query
    const events = await prisma.events.findMany({
      where: { userId: 4 },
      select: { id: true, title: true }
    });
    console.log('✅ Events query successful:', events.length, 'events found');
    
    // Test life_events query
    const lifeEvents = await prisma.life_events.findMany({
      where: { userId: 4 },
      select: { id: true, title: true }
    });
    console.log('✅ Life events query successful:', lifeEvents.length, 'life events found');
    
    // Test literature query
    const literature = await prisma.literature.findMany({
      where: { userId: 4 },
      select: { id: true, title: true }
    });
    console.log('✅ Literature query successful:', literature.length, 'literature found');
    
    // Test counts
    const counts = await Promise.all([
      prisma.persons.count({ where: { userId: 4 } }),
      prisma.events.count({ where: { userId: 4 } }),
      prisma.life_events.count({ where: { userId: 4 } }),
      prisma.literature.count({ where: { userId: 4 } })
    ]);
    
    console.log('✅ Counts successful:', {
      persons: counts[0],
      events: counts[1],
      lifeEvents: counts[2],
      literature: counts[3]
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma(); 