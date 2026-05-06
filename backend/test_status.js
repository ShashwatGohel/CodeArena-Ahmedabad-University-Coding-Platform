const axios = require('axios');

async function test() {
  const jobId = '415'; // From previous test
  try {
    console.log(`Testing GET /api/submissions/status/${jobId}...`);
    const res = await axios.get(`http://localhost:5000/api/submissions/status/${jobId}`);
    console.log('Response:', res.status, res.data);
  } catch (err) {
    if (err.response) {
      console.log('Backend responded with:', err.response.status, err.response.data);
    } else {
      console.error('Failed to reach backend:', err.message);
    }
  }
}

test();
