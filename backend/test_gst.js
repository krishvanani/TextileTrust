const axios = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

async function testFetchCaptcha() {
  const sessionId = uuidv4();
  const jar = new CookieJar();

  const session = wrapper(axios.create({
    jar,
    withCredentials: true,
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Referer": "https://services.gst.gov.in/services/searchtp",
      "Accept": "application/json, text/plain, */*"
    }
  }));

  try {
    await session.get("https://services.gst.gov.in/services/searchtp");
    const captchaResponse = await session.get(
      "https://services.gst.gov.in/services/captcha",
      { responseType: "arraybuffer" }
    );
    
    // Save to error.html for inspection
    fs.writeFileSync("error.html", Buffer.from(captchaResponse.data));
    console.log("Saved response to error.html");
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testFetchCaptcha();
