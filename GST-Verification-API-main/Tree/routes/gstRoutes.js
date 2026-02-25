const express = require("express");
const router = express.Router();
const { getCaptcha, getGSTDetails } = require("../controllers/gstController");

router.get("/getCaptcha", getCaptcha);
router.post("/getGSTDetails", getGSTDetails);

module.exports = router;