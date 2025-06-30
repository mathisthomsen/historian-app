const { PrismaClient } = require('./app/generated/prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking person relations...');
    
    const relations = await prisma.person_relations.findMany({
      include: {
        from_person: {
          select: { id: true, first_name: true, last_name: true, userId: true }
        },
        to_person: {
          select: { id: true, first_name: true, last_name: true, userId: true }
        }
      }
    });
    
    console.log('Person Relations:', relations);
    
    const persons = await prisma.persons.findMany({
      select: { id: true, first_name: true, last_name: true, userId: true }
    });
    
    console.log('Persons:', persons);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 