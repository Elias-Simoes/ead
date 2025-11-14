const axios = require('axios');

async function testLogin() {
  console.log('Testing login as frontend would do...\n');
  
  // Test 1: Direct login
  try {
    console.log('Test 1: Login with admin@example.com / Admin123!');
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@example.com',
      password: 'Admin123!'
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });

    console.log('✓ Login successful!');
    console.log('Status:', response.status);
    console.log('Has data.data?', !!response.data.data);
    console.log('Has data.data.tokens?', !!response.data.data?.tokens);
    console.log('Has data.data.user?', !!response.data.data?.user);
    
    if (response.data.data?.tokens) {
      console.log('\nTokens structure:');
      console.log('- accessToken:', response.data.data.tokens.accessToken ? 'Present' : 'Missing');
      console.log('- refreshToken:', response.data.data.tokens.refreshToken ? 'Present' : 'Missing');
    }
    
    if (response.data.data?.user) {
      console.log('\nUser data:');
      console.log(JSON.stringify(response.data.data.user, null, 2));
    }
    
  } catch (error) {
    console.error('✗ Login failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
  
  // Test 2: Try with wrong password
  console.log('\n\nTest 2: Login with wrong password');
  try {
    await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@example.com',
      password: 'WrongPassword123!'
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
    console.log('✗ Should have failed but succeeded!');
  } catch (error) {
    console.log('✓ Correctly rejected wrong password');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.error?.message);
  }
}

testLogin();
