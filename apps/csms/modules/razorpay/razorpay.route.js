const { Router } = require("express");
const router = Router();
const razorpayController = require("./razorpay.controller");

router.post("/generate-qr", razorpayController.generateQr);

module.exports = router;
