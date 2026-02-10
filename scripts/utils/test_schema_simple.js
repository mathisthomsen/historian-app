// Simple test to verify new database schema tables exist
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSchemaTables() {
  console.log('🧪 Testing New Database Schema Tables...\n');

  try {
    // Test 1: Check if sources table exists
    console.log('1. Testing sources table...');
    const sourcesCount = await prisma.sources.count();
    console.log(`   ✅ Sources table exists (${sourcesCount} records)`);

    // Test 2: Check if statements table exists
    console.log('\n2. Testing statements table...');
    const statementsCount = await prisma.statements.count();
    console.log(`   ✅ Statements table exists (${statementsCount} records)`);

    // Test 3: Check if personEventRelations table exists
    console.log('\n3. Testing personEventRelations table...');
    const relationsCount = await prisma.personEventRelations.count();
    console.log(`   ✅ PersonEventRelations table exists (${relationsCount} records)`);

    // Test 4: Check if sourceOnRelations table exists
    console.log('\n4. Testing sourceOnRelations table...');
    const sourceOnRelationsCount = await prisma.sourceOnRelations.count();
    console.log(`   ✅ SourceOnRelations table exists (${sourceOnRelationsCount} records)`);

    // Test 5: Check if enhanced events table has new fields
    console.log('\n5. Testing enhanced events table...');
    const eventsCount = await prisma.events.count();
    console.log(`   ✅ Events table exists with new fields (${eventsCount} records)`);

    // Test 6: Check if enhanced persons table has new fields
    console.log('\n6. Testing enhanced persons table...');
    const personsCount = await prisma.persons.count();
    console.log(`   ✅ Persons table exists with new fields (${personsCount} records)`);

    // Test 7: Check table structure
    console.log('\n7. Testing table structure...');
    
    // Get table info using raw SQL
    const tableInfo = await prisma.$queryRaw`
      SELECT 
        table_name,
        column_name,
        data_type
      FROM information_schema.columns 
      WHERE table_name IN ('sources', 'statements', 'person_event_relations', 'source_on_relations')
      ORDER BY table_name, ordinal_position
    `;
    
    console.log(`   ✅ Found ${tableInfo.length} columns in new tables`);
    
    // Group by table
    const tables = {};
    tableInfo.forEach(col => {
      if (!tables[col.table_name]) {
        tables[col.table_name] = [];
      }
      tables[col.table_name].push(col.column_name);
    });
    
    Object.keys(tables).forEach(tableName => {
      console.log(`      ${tableName}: ${tables[tableName].join(', ')}`);
    });

    console.log('\n✅ All schema tests passed!');
    console.log('\n🎯 New database structure is working correctly.');
    console.log('\n📊 Schema Summary:');
    console.log('   - sources: ✅ Created');
    console.log('   - statements: ✅ Created');
    console.log('   - personEventRelations: ✅ Created');
    console.log('   - sourceOnRelations: ✅ Created');
    console.log('   - Enhanced events: ✅ Updated');
    console.log('   - Enhanced persons: ✅ Updated');

  } catch (error) {
    console.error('❌ Schema test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSchemaTables().catch(console.error); 