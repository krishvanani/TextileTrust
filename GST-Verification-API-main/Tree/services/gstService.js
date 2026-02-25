const axios = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");
const { v4: uuidv4 } = require("uuid");

const gstSessions = {};

exports.fetchCaptcha = async () => {
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

  await session.get("https://services.gst.gov.in/services/searchtp");

  const captchaResponse = await session.get(
    "https://services.gst.gov.in/services/captcha",
    { responseType: "arraybuffer" }
  );

  const captchaBase64 = Buffer.from(captchaResponse.data).toString("base64");

  gstSessions[sessionId] = session;

  return {
    sessionId,
    image: "data:image/png;base64," + captchaBase64
  };
};

exports.fetchGSTDetails = async (sessionId, GSTIN, captcha) => {
  const session = gstSessions[sessionId];

  if (!session) {
    throw new Error("Invalid session id");
  }

  const response = await session.post(
    "https://services.gst.gov.in/services/api/search/taxpayerDetails",
    {
      gstin: GSTIN,
      captcha: captcha
    }
  );

  console.log("GST Raw Response:", response.data);

  return response.data.data || response.data;
};