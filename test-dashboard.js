const { PrismaClient } = require('./app/generated/prisma');

const prisma = new PrismaClient();

async function testDashboardStats() {
  try {
    console.log('Testing dashboard stats...');
    
    // Test basic counts
    const totalPersons = await prisma.persons.count({
      where: { userId: 4 }
    });
    console.log('Total persons:', totalPersons);

    const totalEvents = await prisma.events.count({
      where: { userId: 4 }
    });
    console.log('Total events:', totalEvents);

    const totalLifeEvents = await prisma.life_events.count({
      where: { userId: 4 }
    });
    console.log('Total life events:', totalLifeEvents);

    const totalLiterature = await prisma.literature.count({
      where: { userId: 4 }
    });
    console.log('Total literature:', totalLiterature);

    // Test locations
    const eventLocations = await prisma.events.findMany({
      where: { 
        userId: 4,
        location: { not: null }
      },
      select: { location: true }
    });
    console.log('Event locations:', eventLocations);

    const lifeEventLocations = await prisma.life_events.findMany({
      where: { 
        userId: 4,
        location: { not: null }
      },
      select: { location: true }
    });
    console.log('Life event locations:', lifeEventLocations);

    console.log('All tests passed!');

  } catch (error) {
    console.error('Error testing dashboard stats:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardStats(); 