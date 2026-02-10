// Test script for new database schema
const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNewSchema() {
  console.log('🧪 Testing New Database Schema...\n');

  try {
    // Test 1: Create a source
    console.log('1. Testing sources table...');
    const source = await prisma.sources.create({
      data: {
        userId: 'test-user-id',
        title: 'Test Historical Document',
        url: 'https://example.com/document',
        author: 'Test Author',
        publication: 'Test Publication',
        year: 2024,
        reliability: new Prisma.Decimal(0.9),
        notes: 'Test source for schema validation'
      }
    });
    console.log(`   ✅ Source created: ${source.title} (ID: ${source.id})`);

    // Test 2: Create a statement
    console.log('\n2. Testing statements table...');
    const statement = await prisma.statements.create({
      data: {
        userId: 'test-user-id',
        content: 'John Doe participated in the Battle of Berlin',
        confidence: new Prisma.Decimal(0.8),
        source_id: source.id
      }
    });
    console.log(`   ✅ Statement created: "${statement.content}" (ID: ${statement.id})`);

    // Test 3: Create a person (if persons table exists)
    console.log('\n3. Testing persons table...');
    const person = await prisma.persons.create({
      data: {
        userId: 'test-user-id',
        first_name: 'John',
        last_name: 'Doe',
        birth_date: new Date('1900-01-01'),
        birth_place: 'Vienna, Austria',
        notes: 'Test person for schema validation'
      }
    });
    console.log(`   ✅ Person created: ${person.first_name} ${person.last_name} (ID: ${person.id})`);

    // Test 4: Create an event (if events table exists)
    console.log('\n4. Testing events table...');
    const event = await prisma.events.create({
      data: {
        userId: 'test-user-id',
        title: 'Battle of Berlin',
        description: 'Final major battle of World War II in Europe',
        date: new Date('1945-04-16'),
        location: 'Berlin, Germany',
        latitude: new Prisma.Decimal(52.5200),
        longitude: new Prisma.Decimal(13.4050),
        country: 'Germany',
        city: 'Berlin'
      }
    });
    console.log(`   ✅ Event created: ${event.title} (ID: ${event.id})`);

    // Test 5: Create a person-event relationship
    console.log('\n5. Testing personEventRelations table...');
    const relation = await prisma.personEventRelations.create({
      data: {
        userId: 'test-user-id',
        person_id: person.id,
        event_id: event.id,
        relationship_type: 'participant',
        statement_id: statement.id
      }
    });
    console.log(`   ✅ Relationship created: Person ${person.id} -> Event ${event.id} (Type: ${relation.relationship_type})`);

    // Test 6: Create a source-on-relation
    console.log('\n6. Testing sourceOnRelations table...');
    const sourceOnRelation = await prisma.sourceOnRelations.create({
      data: {
        userId: 'test-user-id',
        source_id: source.id,
        relation_id: relation.id
      }
    });
    console.log(`   ✅ Source-on-relation created: Source ${source.id} -> Relation ${relation.id}`);

    // Test 7: Query relationships
    console.log('\n7. Testing relationship queries...');
    const relationships = await prisma.personEventRelations.findMany({
      include: {
        person: true,
        event: true,
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
    });
    console.log(`   ✅ Found ${relationships.length} relationships`);
    
    if (relationships.length > 0) {
      const rel = relationships[0];
      console.log(`   📋 Sample relationship:`);
      console.log(`      Person: ${rel.person.first_name} ${rel.person.last_name}`);
      console.log(`      Event: ${rel.event.title}`);
      console.log(`      Type: ${rel.relationship_type}`);
      console.log(`      Statement: "${rel.statement?.content}"`);
      console.log(`      Source: ${rel.statement?.source?.title}`);
    }

    console.log('\n✅ All schema tests passed!');
    console.log('\n🎯 New database structure is working correctly.');
    console.log('\n📊 Schema Summary:');
    console.log('   - sources: ✅ Working');
    console.log('   - statements: ✅ Working');
    console.log('   - personEventRelations: ✅ Working');
    console.log('   - sourceOnRelations: ✅ Working');
    console.log('   - Enhanced events: ✅ Working');
    console.log('   - Enhanced persons: ✅ Working');

  } catch (error) {
    console.error('❌ Schema test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testNewSchema().catch(console.error); 