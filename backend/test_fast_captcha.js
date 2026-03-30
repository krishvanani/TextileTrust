const axios = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");

async function testCookiesOld() {
  const jar = new CookieJar();
  const session = wrapper(axios.create({
    jar,
    withCredentials: true,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    }
  }));

  try {
    await session.get("https://services.gst.gov.in/services/searchtp");
    await session.get("https://services.gst.gov.in/services/captcha", { responseType: "arraybuffer" });
    console.log("Cookies old way:", jar.getCookiesSync("https://services.gst.gov.in").map(c => c.key));
  } catch(e) { console.error(e.message); }
}

testCookiesOld();
