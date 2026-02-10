// Simple test for geocoding functionality
async function testGeocoding() {
  console.log('Testing geocoding functionality...\n');

  const testLocations = [
    'Vienna, Austria',
    'Berlin, Germany',
    'Paris, France',
    'London, UK',
    'New York, USA'
  ];

  for (const location of testLocations) {
    console.log(`Testing: ${location}`);
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&addressdetails=1`, {
        headers: {
          'User-Agent': 'HistorianApp/1.0 (https://github.com/your-repo)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.log(`  ❌ HTTP ${response.status}: ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        console.log(`  ✅ Found: ${result.display_name}`);
        console.log(`     Coordinates: ${result.lat}, ${result.lon}`);
        console.log(`     Country: ${result.address?.country || 'N/A'}`);
        console.log(`     Region: ${result.address?.state || 'N/A'}`);
        console.log(`     City: ${result.address?.city || result.address?.town || 'N/A'}`);
      } else {
        console.log(`  ❌ No results found`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    
    console.log('');
    
    // Rate limiting: wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('Geocoding test completed!');
}

// Run the test
testGeocoding().catch(console.error); 