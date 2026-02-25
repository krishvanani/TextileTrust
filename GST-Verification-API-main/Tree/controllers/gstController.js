const { fetchCaptcha, fetchGSTDetails } = require("../services/gstService");

exports.getCaptcha = async (req, res) => {
  try {
    const data = await fetchCaptcha();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error in fetching captcha" });
  }
};

exports.getGSTDetails = async (req, res) => {
  try {
    const { sessionId, GSTIN, captcha } = req.body;
    const data = await fetchGSTDetails(sessionId, GSTIN, captcha);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error in fetching GST Details" });
  }
};