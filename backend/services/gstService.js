const axios = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");
const { v4: uuidv4 } = require("uuid");

// In-memory session store for GST verification flows
const gstSessions = {};

/**
 * Fetch a captcha image from the GST portal.
 * Returns a unique sessionId + the captcha as a base64 data URI.
 */
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

  // Initialize cookies by visiting the search page
  await session.get("https://services.gst.gov.in/services/searchtp");

  // Fetch captcha image
  const captchaResponse = await session.get(
    "https://services.gst.gov.in/services/captcha",
    { responseType: "arraybuffer" }
  );

  const captchaBase64 = Buffer.from(captchaResponse.data).toString("base64");

  // Store session for later use during verification
  gstSessions[sessionId] = session;

  // Auto-cleanup after 5 minutes to prevent memory leaks
  setTimeout(() => {
    delete gstSessions[sessionId];
  }, 5 * 60 * 1000);

  return {
    sessionId,
    image: "data:image/png;base64," + captchaBase64
  };
};

/**
 * Fetch GST taxpayer details using the stored session.
 * Requires the sessionId from fetchCaptcha, the GSTIN, and the solved captcha.
 */
exports.fetchGSTDetails = async (sessionId, GSTIN, captcha) => {
  const session = gstSessions[sessionId];

  if (!session) {
    throw new Error("Session expired or invalid. Please refresh the captcha.");
  }

  const response = await session.post(
    "https://services.gst.gov.in/services/api/search/taxpayerDetails",
    {
      gstin: GSTIN,
      captcha: captcha
    }
  );

  // Clean up used session
  delete gstSessions[sessionId];

  const result = response.data;

  // Check for any validation error from GST portal
  const data = result.data || result;
  if (!data || !data.gstin || result.errorCode || result.error) {
    throw new Error("invalid GST number or Captcha");
  }

  return data;
};
