const { PrismaClient } = require('./app/generated/prisma');

const prisma = new PrismaClient();

async function createSampleRelationships() {
  try {
    console.log('Creating sample relationships...');

    // Get all persons for user ID 4
    const persons = await prisma.persons.findMany({
      where: { userId: 4 },
      select: { id: true, first_name: true, last_name: true }
    });

    if (persons.length < 2) {
      console.log('Need at least 2 persons to create relationships');
      return;
    }

    console.log(`Found ${persons.length} persons`);

    // Create some sample relationships
    const relationships = [
      {
        fromPersonId: persons[0].id,
        toPersonId: persons[1].id,
        relationType: 'father',
        notes: 'Vater-Sohn Beziehung'
      },
      {
        fromPersonId: persons[1].id,
        toPersonId: persons[2]?.id || persons[0].id,
        relationType: 'brother',
        notes: 'Geschwister Beziehung'
      },
      {
        fromPersonId: persons[2]?.id || persons[0].id,
        toPersonId: persons[3]?.id || persons[1].id,
        relationType: 'colleague',
        notes: 'Berufliche Zusammenarbeit'
      }
    ];

    for (const rel of relationships) {
      if (rel.toPersonId) {
        try {
          const existing = await prisma.person_relations.findFirst({
            where: {
              OR: [
                {
                  from_person_id: rel.fromPersonId,
                  to_person_id: rel.toPersonId
                },
                {
                  from_person_id: rel.toPersonId,
                  to_person_id: rel.fromPersonId
                }
              ]
            }
          });

          if (!existing) {
            await prisma.person_relations.create({
              data: {
                from_person_id: rel.fromPersonId,
                to_person_id: rel.toPersonId,
                relation_type: rel.relationType,
                notes: rel.notes
              }
            });
            console.log(`Created relationship: ${rel.relationType} between persons ${rel.fromPersonId} and ${rel.toPersonId}`);
          } else {
            console.log(`Relationship already exists between persons ${rel.fromPersonId} and ${rel.toPersonId}`);
          }
        } catch (error) {
          console.error(`Error creating relationship:`, error);
        }
      }
    }

    console.log('Sample relationships created successfully!');
  } catch (error) {
    console.error('Error creating sample relationships:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleRelationships(); 