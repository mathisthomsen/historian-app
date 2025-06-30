const fetch = require('node-fetch');

async function testAuth() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test 1: Try to access protected endpoint without auth
    console.log('Test 1: Accessing protected endpoint without auth...');
    const response1 = await fetch(`${baseUrl}/api/persons`);
    console.log('Status:', response1.status);
    const data1 = await response1.json();
    console.log('Response:', data1);
    console.log('---');

    // Test 2: Register a new user
    console.log('Test 2: Registering a new user...');
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'testauth@example.com',
        password: 'TestPass123!'
      })
    });
    console.log('Register Status:', registerResponse.status);
    const registerData = await registerResponse.json();
    console.log('Register Response:', registerData);
    console.log('---');

    // Test 3: Login with the user
    console.log('Test 3: Logging in...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testauth@example.com',
        password: 'TestPass123!',
        rememberMe: false
      })
    });
    console.log('Login Status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login Response:', loginData);
    
    // Get cookies from response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Cookies set:', cookies);
    console.log('---');

    // Test 4: Access protected endpoint with auth
    console.log('Test 4: Accessing protected endpoint with auth...');
    const response2 = await fetch(`${baseUrl}/api/persons`, {
      headers: {
        'Cookie': cookies
      }
    });
    console.log('Status:', response2.status);
    const data2 = await response2.json();
    console.log('Response:', data2);

  } catch (error) {
    console.error('Error:', error);
  }
}

testAuth(); 