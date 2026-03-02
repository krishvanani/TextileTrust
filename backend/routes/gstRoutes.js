const express = require("express");
const router = express.Router();
const { getCaptcha, getGSTDetails } = require("../controllers/gstController");

router.get("/captcha", getCaptcha);
router.post("/verify", getGSTDetails);

module.exports = router;
