// Test script for location validation
const { geocodingService } = require('./app/lib/geocoding.ts');

async function testLocationValidation() {
  console.log('🧪 Testing Location Validation System...\n');

  const testCases = [
    {
      input: 'Vienna, Austria',
      expected: { country: 'Österreich', city: 'Wien' }
    },
    {
      input: 'Berlin, Germany', 
      expected: { country: 'Deutschland', city: 'Berlin' }
    },
    {
      input: 'Paris, France',
      expected: { country: 'France', city: 'Paris' }
    }
  ];

  for (const testCase of testCases) {
    console.log(`📍 Testing: "${testCase.input}"`);
    
    try {
      // Test single geocoding
      const result = await geocodingService.geocode(testCase.input);
      
      if (result) {
        console.log(`  ✅ Found: ${result.latitude}, ${result.longitude}`);
        console.log(`     Country: ${result.country}`);
        console.log(`     Region: ${result.region || 'N/A'}`);
        console.log(`     City: ${result.city || 'N/A'}`);
        
        // Test search functionality
        const searchResults = await geocodingService.searchLocations(testCase.input.split(',')[0]);
        console.log(`  🔍 Search results: ${searchResults.length} options`);
        
        if (searchResults.length > 0) {
          console.log(`     Top match: ${searchResults[0].display_name}`);
          console.log(`     Confidence: ${(searchResults[0].importance * 100).toFixed(0)}%`);
        }
      } else {
        console.log(`  ❌ No results found`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    
    console.log('');
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('✅ Location validation test completed!');
  console.log('\n🎯 Next steps:');
  console.log('1. Try creating an event with location validation');
  console.log('2. Check that coordinates are saved correctly');
  console.log('3. Verify the location appears on the locations page');
}

// Run the test
testLocationValidation().catch(console.error); 