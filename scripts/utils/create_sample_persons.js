const { PrismaClient } = require('./app/generated/prisma');

const prisma = new PrismaClient();

async function createSamplePersons() {
  try {
    console.log('Creating sample persons for user ID 4...');

    const samplePersons = [
      {
        first_name: 'Max',
        last_name: 'Mustermann',
        birth_date: new Date('1980-05-15'),
        birth_place: 'Berlin',
        notes: 'Hauptperson für Tests'
      },
      {
        first_name: 'Anna',
        last_name: 'Schmidt',
        birth_date: new Date('1985-03-22'),
        birth_place: 'Hamburg',
        notes: 'Ehefrau von Max'
      },
      {
        first_name: 'Tom',
        last_name: 'Mustermann',
        birth_date: new Date('2010-08-10'),
        birth_place: 'Berlin',
        notes: 'Sohn von Max und Anna'
      },
      {
        first_name: 'Lisa',
        last_name: 'Mustermann',
        birth_date: new Date('2012-12-03'),
        birth_place: 'Berlin',
        notes: 'Tochter von Max und Anna'
      }
    ];

    for (const personData of samplePersons) {
      const existing = await prisma.persons.findFirst({
        where: {
          userId: 4,
          first_name: personData.first_name,
          last_name: personData.last_name
        }
      });

      if (!existing) {
        const person = await prisma.persons.create({
          data: {
            ...personData,
            userId: 4
          }
        });
        console.log(`Created person: ${person.first_name} ${person.last_name} (ID: ${person.id})`);
      } else {
        console.log(`Person already exists: ${personData.first_name} ${personData.last_name}`);
      }
    }

    console.log('Sample persons created successfully!');
  } catch (error) {
    console.error('Error creating sample persons:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSamplePersons(); 