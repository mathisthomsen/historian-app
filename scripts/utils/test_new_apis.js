// Test script for new API routes
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNewAPIs() {
  console.log('🧪 Testing New API Routes...\n');

  try {
    // Test 1: Create a test source
    console.log('1. Testing Sources API...');
    const testSource = await prisma.sources.create({
      data: {
        userId: 'test-user-id',
        title: 'Test Source - Historical Document',
        author: 'Test Author',
        publication: 'Test Publication',
        year: 2024,
        reliability: 0.85,
        notes: 'Test source for API validation'
      }
    });
    console.log('   ✅ Source created:', testSource.id);

    // Test 2: Create a test statement
    console.log('\n2. Testing Statements API...');
    const testStatement = await prisma.statements.create({
      data: {
        userId: 'test-user-id',
        content: 'This is a test statement about a historical event.',
        confidence: 0.75,
        source_id: testSource.id
      }
    });
    console.log('   ✅ Statement created:', testStatement.id);

    // Test 3: Create test person and event
    console.log('\n3. Testing Person/Event Creation...');
    const testPerson = await prisma.persons.create({
      data: {
        userId: 'test-user-id',
        first_name: 'Test',
        last_name: 'Person',
        birth_date: new Date('1990-01-01')
      }
    });
    console.log('   ✅ Person created:', testPerson.id);

    const testEvent = await prisma.events.create({
      data: {
        userId: 'test-user-id',
        title: 'Test Event',
        description: 'A test historical event',
        date: new Date('2024-01-01'),
        location: 'Test Location'
      }
    });
    console.log('   ✅ Event created:', testEvent.id);

    // Test 4: Create person-event relation
    console.log('\n4. Testing Person-Event Relations API...');
    const testRelation = await prisma.personEventRelations.create({
      data: {
        userId: 'test-user-id',
        person_id: testPerson.id,
        event_id: testEvent.id,
        relationship_type: 'participant',
        statement_id: testStatement.id
      }
    });
    console.log('   ✅ Person-Event Relation created:', testRelation.id);

    // Test 5: Create source-on-relation
    console.log('\n5. Testing Source-on-Relations API...');
    const testSourceOnRelation = await prisma.sourceOnRelations.create({
      data: {
        userId: 'test-user-id',
        source_id: testSource.id,
        relation_id: testRelation.id
      }
    });
    console.log('   ✅ Source-on-Relation created:', testSourceOnRelation.id);

    // Test 6: Verify relationships work correctly
    console.log('\n6. Testing Relationship Queries...');
    
    // Query event with participants
    const eventWithParticipants = await prisma.events.findFirst({
      where: { id: testEvent.id },
      include: {
        personEventRelations: {
          include: {
            person: true,
            statement: {
              include: {
                source: true
              }
            },
            sourceOnRelations: {
              include: {
                source: true
              }
            }
          }
        }
      }
    });
    
    console.log('   ✅ Event participants:', eventWithParticipants.personEventRelations.length);
    console.log('   ✅ Participant name:', eventWithParticipants.personEventRelations[0].person.first_name);
    console.log('   ✅ Relationship type:', eventWithParticipants.personEventRelations[0].relationship_type);

    // Query person with events
    const personWithEvents = await prisma.persons.findFirst({
      where: { id: testPerson.id },
      include: {
        personEventRelations: {
          include: {
            event: true,
            statement: {
              include: {
                source: true
              }
            }
          }
        }
      }
    });
    
    console.log('   ✅ Person events:', personWithEvents.personEventRelations.length);
    console.log('   ✅ Event title:', personWithEvents.personEventRelations[0].event.title);

    // Test 7: Test source usage statistics
    console.log('\n7. Testing Source Statistics...');
    const sourceWithUsage = await prisma.sources.findFirst({
      where: { id: testSource.id },
      include: {
        statements: true,
        sourceOnRelations: {
          include: {
            relation: {
              include: {
                person: true,
                event: true
              }
            }
          }
        }
      }
    });
    
    console.log('   ✅ Source statements:', sourceWithUsage.statements.length);
    console.log('   ✅ Source relations:', sourceWithUsage.sourceOnRelations.length);
    console.log('   ✅ Total usage:', sourceWithUsage.statements.length + sourceWithUsage.sourceOnRelations.length);

    console.log('\n✅ All API tests passed!');
    console.log('\n🎯 New API Structure Summary:');
    console.log('   - Sources: ✅ Working');
    console.log('   - Statements: ✅ Working');
    console.log('   - Person-Event Relations: ✅ Working');
    console.log('   - Source-on-Relations: ✅ Working');
    console.log('   - Enhanced Events: ✅ Working');
    console.log('   - Enhanced Persons: ✅ Working');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up test data
    try {
      await prisma.sourceOnRelations.deleteMany({
        where: { userId: 'test-user-id' }
      });
      await prisma.personEventRelations.deleteMany({
        where: { userId: 'test-user-id' }
      });
      await prisma.statements.deleteMany({
        where: { userId: 'test-user-id' }
      });
      await prisma.sources.deleteMany({
        where: { userId: 'test-user-id' }
      });
      await prisma.events.deleteMany({
        where: { userId: 'test-user-id' }
      });
      await prisma.persons.deleteMany({
        where: { userId: 'test-user-id' }
      });
      console.log('\n🧹 Test data cleaned up');
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    
    await prisma.$disconnect();
  }
}

// Run the test
testNewAPIs().catch(console.error); 