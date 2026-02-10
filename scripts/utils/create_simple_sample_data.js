const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSimpleSampleData() {
  const userId = 'cmdx9ra0000008znc4n4022f6'; // Test user ID

  try {
    console.log('Creating simple sample data...');

    // Create some sample events first
    const events = await Promise.all([
      prisma.events.create({
        data: {
          userId: userId,
          title: 'World War I',
          description: 'The First World War',
          date: new Date('1914-08-01'),
          end_date: new Date('1918-11-11'),
          location: 'Europe'
        }
      }),
      prisma.events.create({
        data: {
          userId: userId,
          title: 'Industrial Revolution',
          description: 'The Industrial Revolution period',
          date: new Date('1760-01-01'),
          end_date: new Date('1840-12-31'),
          location: 'Europe'
        }
      }),
      prisma.events.create({
        data: {
          userId: userId,
          title: 'French Revolution',
          description: 'The French Revolution',
          date: new Date('1789-07-14'),
          end_date: new Date('1799-11-09'),
          location: 'France'
        }
      })
    ]);

    console.log(`Created ${events.length} events`);

    // Create some sample persons
    const persons = await Promise.all([
      prisma.persons.create({
        data: {
          userId: userId,
          first_name: 'John',
          last_name: 'Doe',
          birth_date: new Date('1890-05-15'),
          death_date: new Date('1975-03-20'),
          birth_place: 'London, England',
          death_place: 'Oxford, England'
        }
      }),
      prisma.persons.create({
        data: {
          userId: userId,
          first_name: 'Jane',
          last_name: 'Smith',
          birth_date: new Date('1895-08-22'),
          death_date: new Date('1980-12-10'),
          birth_place: 'Manchester, England',
          death_place: 'Cambridge, England'
        }
      }),
      prisma.persons.create({
        data: {
          userId: userId,
          first_name: 'Robert',
          last_name: 'Johnson',
          birth_date: new Date('1885-12-03'),
          death_date: new Date('1965-07-15'),
          birth_place: 'Birmingham, England',
          death_place: 'Liverpool, England'
        }
      })
    ]);

    console.log(`Created ${persons.length} persons`);

    // Create some sample life events
    const lifeEvents = await Promise.all([
      prisma.life_events.create({
        data: {
          userId: userId,
          person_id: persons[0].id,
          event_id: events[0].id,
          title: 'Military Service in WWI',
          start_date: new Date('1914-08-01'),
          end_date: new Date('1918-11-11'),
          location: 'France',
          description: 'Served in the British Army during World War I'
        }
      }),
      prisma.life_events.create({
        data: {
          userId: userId,
          person_id: persons[1].id,
          event_id: events[1].id,
          title: 'Factory Work',
          start_date: new Date('1910-01-01'),
          end_date: new Date('1920-12-31'),
          location: 'Manchester',
          description: 'Worked in a textile factory during the industrial period'
        }
      }),
      prisma.life_events.create({
        data: {
          userId: userId,
          person_id: persons[2].id,
          event_id: events[2].id,
          title: 'Political Activism',
          start_date: new Date('1789-07-14'),
          end_date: new Date('1799-11-09'),
          location: 'Paris',
          description: 'Participated in revolutionary activities'
        }
      })
    ]);

    console.log(`Created ${lifeEvents.length} life events`);

    // Create some sample literature
    const literature = await Promise.all([
      prisma.literature.create({
        data: {
          userId: userId,
          title: 'The Great War: A Personal Account',
          author: 'John Doe',
          publication_year: 1920,
          type: 'Memoir',
          description: 'Personal account of World War I experiences'
        }
      }),
      prisma.literature.create({
        data: {
          userId: userId,
          title: 'Industrial Revolution and Society',
          author: 'Jane Smith',
          publication_year: 1915,
          type: 'Academic',
          description: 'Analysis of social changes during industrialization'
        }
      })
    ]);

    console.log(`Created ${literature.length} literature entries`);

    console.log('✅ Sample data created successfully!');
    console.log(`Summary:`);
    console.log(`- ${events.length} events`);
    console.log(`- ${persons.length} persons`);
    console.log(`- ${lifeEvents.length} life events`);
    console.log(`- ${literature.length} literature entries`);

  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSimpleSampleData(); 