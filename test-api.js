const axios = require('axios');

async function run() {
  try {
    // We need a valid token. Let's look for a test user or just see if the error is before auth.
    // Actually, if we just send a request without auth, we'll get 401. 
    // To get the 500 error, we need a valid JWT.
  } catch (e) {
    console.error(e);
  }
}
run();
