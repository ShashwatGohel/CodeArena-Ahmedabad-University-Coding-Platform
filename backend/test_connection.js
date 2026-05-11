const axios = require('axios');

async function test() {
  try {
    console.log('Testing GET /api/problems...');
    const res = await axios.get('http://localhost:5000/api/problems/663884d5f1d43c2c1a8e1b2c'); // dummy id
    console.log('Response:', res.status);
  } catch (err) {
    if (err.response) {
      console.log('Backend responded with:', err.response.status, err.response.data);
    } else {
      console.error('Failed to reach backend:', err.message);
    }
  }
}

test();
