const axios = require('axios');

async function testInstructorsAPI() {
  try {
    // First login to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@example.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✓ Login successful\n');
    
    // Now test instructors endpoint
    console.log('2. Fetching instructors...');
    const instructorsResponse = await axios.get('http://localhost:3000/api/admin/instructors', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✓ Instructors fetched successfully');
    console.log('\nResponse structure:');
    console.log('- Has data?', !!instructorsResponse.data);
    console.log('- Has data.data?', !!instructorsResponse.data.data);
    console.log('- Is data.data an array?', Array.isArray(instructorsResponse.data.data));
    console.log('- Is data an array?', Array.isArray(instructorsResponse.data));
    
    console.log('\nFull response:');
    console.log(JSON.stringify(instructorsResponse.data, null, 2));
    
  } catch (error) {
    console.error('✗ Error:', error.response?.data || error.message);
  }
}

testInstructorsAPI();
