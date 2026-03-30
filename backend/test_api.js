const axios = require('axios');
const fs = require('fs');

async function testApi() {
  try {
    const res = await axios.get('http://localhost:5003/api/gst/captcha');
    console.log("Success! SessionId:", res.data.sessionId);
    console.log("Image length:", res.data.image.length);
    console.log("Starts with data:image/png:", res.data.image.startsWith('data:image/png;base64,'));
    fs.writeFileSync('captcha.png', Buffer.from(res.data.image.split(',')[1], 'base64'));
    console.log("Saved to captcha.png");
  } catch(e) {
    if(e.response) {
      console.error("Failed:", e.response.status, e.response.data);
    } else {
      console.error("Error:", e.message);
    }
  }
}

testApi();
