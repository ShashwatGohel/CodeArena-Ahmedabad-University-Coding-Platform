const axios = require('axios');

async function test() {
  try {
    console.log('Testing POST /api/submissions/run...');
    const res = await axios.post('http://localhost:5000/api/submissions/run', {
        problemId: '663884d5f1d43c2c1a8e1b2c', // dummy
        code: 'print("hello")',
        language: 'python'
    });
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
