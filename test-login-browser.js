const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login from browser perspective...');
    console.log('URL: http://localhost:3000/api/auth/login');
    console.log('Credentials: admin@example.com / Admin123!');
    
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@example.com',
      password: 'Admin123!'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      }
    });

    console.log('\n✓ Login successful!');
    console.log('Status:', response.status);
    console.log('Response structure:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check if tokens are in the expected location
    if (response.data.data && response.data.data.tokens) {
      console.log('\n✓ Tokens found at response.data.data.tokens');
      console.log('Access Token:', response.data.data.tokens.accessToken.substring(0, 50) + '...');
      console.log('Refresh Token:', response.data.data.tokens.refreshToken.substring(0, 50) + '...');
    }
    
    if (response.data.data && response.data.data.user) {
      console.log('\n✓ User found at response.data.data.user');
      console.log('User:', response.data.data.user);
    }
    
  } catch (error) {
    console.error('\n✗ Login failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received');
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLogin();
