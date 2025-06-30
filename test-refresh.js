const fetch = require('node-fetch');

async function testTokenRefresh() {
  console.log('🧪 Testing token refresh functionality...');
  
  // First, let's try to access the dashboard stats without any cookies
  console.log('\n1. Testing without cookies...');
  try {
    const response = await fetch('http://localhost:3000/api/dashboard/stats');
    const data = await response.json();
    console.log('Response:', data);
    console.log('Status:', response.status);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Now let's test with a refresh token (you'll need to get this from a browser)
  console.log('\n2. Testing with refresh token...');
  console.log('Please log in to the app in your browser and copy the refreshToken cookie value.');
  console.log('Then update this script with the token value.');
  
  // You can uncomment and update this section with a real refresh token
  /*
  const refreshToken = 'your-refresh-token-here';
  try {
    const response = await fetch('http://localhost:3000/api/dashboard/stats', {
      headers: {
        'Cookie': `refreshToken=${refreshToken}`
      }
    });
    const data = await response.json();
    console.log('Response:', data);
    console.log('Status:', response.status);
    console.log('Cookies:', response.headers.get('set-cookie'));
  } catch (error) {
    console.error('Error:', error.message);
  }
  */
}

testTokenRefresh(); 