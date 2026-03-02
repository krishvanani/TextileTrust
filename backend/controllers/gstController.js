const { fetchCaptcha, fetchGSTDetails } = require("../services/gstService");

// @desc    Get captcha for GST verification
// @route   GET /api/gst/captcha
// @access  Public
exports.getCaptcha = async (req, res) => {
  try {
    const data = await fetchCaptcha();
    res.json(data);
  } catch (error) {
    console.error("Captcha fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch captcha. Please try again." });
  }
};

// @desc    Verify GST and fetch taxpayer details
// @route   POST /api/gst/verify
// @access  Public
exports.getGSTDetails = async (req, res) => {
  try {
    const { sessionId, GSTIN, captcha } = req.body;

    if (!sessionId || !GSTIN || !captcha) {
      return res.status(400).json({ error: "sessionId, GSTIN, and captcha are required." });
    }

    const data = await fetchGSTDetails(sessionId, GSTIN, captcha);
    res.json(data);
  } catch (error) {
    console.error("GST verify error:", error.message);
    res.status(500).json({ error: error.message || "Failed to verify GST. Please try again." });
  }
};
